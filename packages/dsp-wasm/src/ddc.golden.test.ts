import { describe, expect, it } from 'vitest';
import { fftRadix2, frequencyToBin, isPowerOfTwo } from './fft.js';
import { ReferenceDdcEngine } from './ddc.js';
import { defaultDdcCutoffNyquist, defaultDdcFirTaps } from './fir.js';
import { makeWindow } from './windows.js';

/**
 * SYNTHETIC FIXTURE ONLY — labeled complex tones, not from disk / SigMF / RAW.
 */
function synthesizeComplexToneIqF32(options: {
  sampleCount: number;
  sampleRateHz: number;
  tones: Array<{ freqHz: number; amp?: number; phaseRad?: number }>;
}): Float32Array {
  const { sampleCount, sampleRateHz, tones } = options;
  const out = new Float32Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    let re = 0;
    let im = 0;
    for (const t of tones) {
      const a = t.amp ?? 1;
      const ph = (2 * Math.PI * t.freqHz * n) / sampleRateHz + (t.phaseRad ?? 0);
      re += a * Math.cos(ph);
      im += a * Math.sin(ph);
    }
    out[n * 2] = re;
    out[n * 2 + 1] = im;
  }
  return out;
}

/** Linear power spectrum of complex IQ via radix-2 FFT (Hann), returns Float64 power. */
function powerSpectrumIq(iq: Float32Array, fftSize: number): Float64Array {
  if (!isPowerOfTwo(fftSize)) throw new Error('fftSize pow2');
  const win = makeWindow('hann', fftSize);
  const frame = new Float64Array(fftSize * 2);
  const use = Math.min(iq.length / 2, fftSize);
  // Take the last `use` samples to skip FIR transient when possible
  const start = Math.max(0, iq.length / 2 - use);
  for (let n = 0; n < use; n++) {
    const src = (start + n) * 2;
    const w = win[n]!;
    frame[n * 2] = iq[src]! * w;
    frame[n * 2 + 1] = iq[src + 1]! * w;
  }
  fftRadix2(frame, false);
  const power = new Float64Array(fftSize);
  for (let k = 0; k < fftSize; k++) {
    const re = frame[k * 2]!;
    const im = frame[k * 2 + 1]!;
    power[k] = re * re + im * im;
  }
  return power;
}

function bandEnergy(power: Float64Array, centerBin: number, halfWidth: number): number {
  let s = 0;
  for (let k = centerBin - halfWidth; k <= centerBin + halfWidth; k++) {
    const idx = ((k % power.length) + power.length) % power.length;
    s += power[idx]!;
  }
  return s;
}

describe('FIR design helpers', () => {
  it('documents default cutoff: 0.45 / max(L,M) of Nyquist', () => {
    expect(defaultDdcCutoffNyquist(1, 4)).toBeCloseTo(0.45 / 4, 12);
    expect(defaultDdcCutoffNyquist(2, 5)).toBeCloseTo(0.45 / 5, 12);
    const taps = defaultDdcFirTaps(1, 4, 63);
    expect(taps.length).toBe(63);
    // Unity DC gain (sum ≈ 1)
    const sum = [...taps].reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 10);
  });
});

describe('ReferenceDdcEngine golden (synthetic single tone → DC)', () => {
  it('mixes tone at 0.1*fs to baseband; after decimate×4 residual energy near bin 0', async () => {
    const sampleRateHz = 100_000;
    const f0 = 0.1 * sampleRateHz; // 10 kHz
    const decimation = 4;
    const interpolation = 1;
    const sampleCount = 4096;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: f0, amp: 1 }],
    });

    const engine = new ReferenceDdcEngine();
    const result = await engine.process(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        loHz: f0,
        sampleRateHz,
        interpolation,
        decimation,
      },
      iq,
    );

    expect(result.outputSampleRateHz).toBe(sampleRateHz / decimation);
    expect(result.begin).toBe(0n);
    const nOut = Number(result.end - result.begin);
    expect(nOut).toBe(result.samples.length / 2);
    // Decimation shortens roughly by M (FIR keeps length before decimate)
    expect(nOut).toBe(Math.floor(sampleCount / decimation));

    const fftSize = 512;
    expect(nOut).toBeGreaterThanOrEqual(fftSize);
    const power = powerSpectrumIq(result.samples, fftSize);
    const total = [...power].reduce((a, b) => a + b, 0);
    // Near-DC band: bins 0..2 and wrap N-2..N-1 (complex baseband)
    const dcEnergy =
      bandEnergy(power, 0, 2) + power[fftSize - 1]! + power[fftSize - 2]!;
    // Tolerance: ≥ 85% of total spectral energy within ±2 bins of DC
    const dcFraction = dcEnergy / total;
    expect(dcFraction).toBeGreaterThan(0.85);

    // Peak bin must be 0 (or ±1)
    let peakBin = 0;
    let peakVal = -1;
    for (let k = 0; k < fftSize; k++) {
      if (power[k]! > peakVal) {
        peakVal = power[k]!;
        peakBin = k;
      }
    }
    const dist = Math.min(peakBin, fftSize - peakBin);
    expect(dist).toBeLessThanOrEqual(1);
  });
});

describe('ReferenceDdcEngine golden (synthetic two-tone; LO on one)', () => {
  it('keeps LO-shifted tone near DC and attenuates the other tone', async () => {
    const sampleRateHz = 100_000;
    const fKeep = 10_000; // LO target → DC
    const fReject = 30_000; // after mix → 20 kHz; outside default LPF for M=4
    const decimation = 4;
    const sampleCount = 8192;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [
        { freqHz: fKeep, amp: 1 },
        { freqHz: fReject, amp: 1 },
      ],
    });

    // Sanity: default cutoff places 20 kHz well into stopband at input rate
    const cutoffNyquist = defaultDdcCutoffNyquist(1, decimation); // 0.1125
    const cutoffHz = cutoffNyquist * (sampleRateHz / 2); // ~5625 Hz
    const rejectAfterMixHz = Math.abs(fReject - fKeep); // 20 kHz
    expect(rejectAfterMixHz).toBeGreaterThan(cutoffHz * 2);

    const engine = new ReferenceDdcEngine();
    const result = await engine.process(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        loHz: fKeep,
        sampleRateHz,
        interpolation: 1,
        decimation,
      },
      iq,
    );

    const outFs = result.outputSampleRateHz;
    expect(outFs).toBe(sampleRateHz / decimation); // 25 kHz

    const fftSize = 1024;
    const power = powerSpectrumIq(result.samples, fftSize);
    const dcEnergy = bandEnergy(power, 0, 3);

    // Where would the rejected tone land if it leaked? 20 kHz at outFs=25 kHz
    // aliases: 20000 mod 25000 = 20000; bin = freq/outFs * fftSize
    // But LPF should crush it before decimation. Compare DC band vs a mid-band window.
    const leakBin = frequencyToBin(rejectAfterMixHz, sampleRateHz, fftSize);
    // After decimation spectrum is at outFs — measure energy away from DC
    // Use bins around fftSize/4 (quarter Nyquist of output) as "far" band
    const farCenter = Math.floor(fftSize / 4);
    const farEnergy = bandEnergy(power, farCenter, 5);

    // Coarse check with explicit ratio: DC band >> far band (reject attenuated)
    // Tolerance: dcEnergy / farEnergy >= 20 (≈13 dB in-band vs mid-band)
    expect(dcEnergy).toBeGreaterThan(farEnergy * 20);

    // Also: peak within ±2 bins of DC
    let peakBin = 0;
    let peakVal = -1;
    for (let k = 0; k < fftSize; k++) {
      if (power[k]! > peakVal) {
        peakVal = power[k]!;
        peakBin = k;
      }
    }
    const dist = Math.min(peakBin, fftSize - peakBin);
    expect(dist).toBeLessThanOrEqual(2);

    // leakBin used only as documentation of intent (pre-decimation)
    expect(leakBin).toBeGreaterThan(0);
  });

  it('respects AbortSignal', async () => {
    const sampleRateHz = 10_000;
    const sampleCount = 256;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: 1000 }],
    });
    const ac = new AbortController();
    ac.abort();
    const engine = new ReferenceDdcEngine();
    await expect(
      engine.process(
        {
          begin: 0n,
          end: BigInt(sampleCount),
          loHz: 1000,
          sampleRateHz,
          interpolation: 1,
          decimation: 2,
          signal: ac.signal,
        },
        iq,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
