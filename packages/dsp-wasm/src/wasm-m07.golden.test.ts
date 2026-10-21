import { describe, expect, it, beforeAll } from 'vitest';
import { fftRadix2, frequencyToBin, isPowerOfTwo } from './fft.js';
import { applyFirComplex, defaultDdcFirTaps, designLowpassFir } from './fir.js';
import { rationalResampleIq, outputSampleRateHz } from './rational-resample.js';
import { ReferenceDdcEngine, mixDownLo } from './ddc.js';
import { makeWindow } from './windows.js';
import {
  isWasmFftAvailable,
  loadWasmFftModule,
  wasmApplyFirComplex,
  wasmRationalResampleIq,
  wasmMixDownLo,
  WasmReferenceDdcEngine,
} from './wasm/index.js';

/**
 * dtype: WASM kernels float64; public IQ Float32 (same as JS).
 * Eps: F32 store + libm vs JS Math; FIR/resample mostly algebraic so tighter than FFT.
 */
const FIR_ABS_EPS = 1e-5;
const RESAMPLE_ABS_EPS = 1e-5;
const MIX_ABS_EPS = 1e-5;
const DDC_SAMPLE_ABS_EPS = 2e-5;

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

function maxAbsDiffF32(a: Float32Array, b: Float32Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i]! - b[i]!);
    if (d > m) m = d;
  }
  return m;
}

function powerSpectrumIq(iq: Float32Array, fftSize: number): Float64Array {
  if (!isPowerOfTwo(fftSize)) throw new Error('fftSize pow2');
  const win = makeWindow('hann', fftSize);
  const frame = new Float64Array(fftSize * 2);
  const use = Math.min(iq.length / 2, fftSize);
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

function peakBin(power: Float64Array): number {
  let peakBin = 0;
  let peakVal = -1;
  for (let k = 0; k < power.length; k++) {
    if (power[k]! > peakVal) {
      peakVal = power[k]!;
      peakBin = k;
    }
  }
  return peakBin;
}

describe('WASM M-07 FIR / resample / DDC golden', () => {
  beforeAll(async () => {
    expect(isWasmFftAvailable()).toBe(true);
    await loadWasmFftModule();
  });

  it('JS vs WASM applyFirComplex on known taps+IQ', async () => {
    const taps = designLowpassFir({ numTaps: 31, cutoffNyquist: 0.2 });
    const iq = synthesizeComplexToneIqF32({
      sampleCount: 256,
      sampleRateHz: 10_000,
      tones: [
        { freqHz: 500, amp: 1 },
        { freqHz: 3500, amp: 0.8 },
      ],
    });
    const js = applyFirComplex(iq, taps);
    const wasm = await wasmApplyFirComplex(iq, taps);
    expect(wasm.length).toBe(js.length);
    expect(maxAbsDiffF32(js, wasm)).toBeLessThan(FIR_ABS_EPS);
  });

  it('JS vs WASM rationalResampleIq: length, rate, peak after decimate', async () => {
    const sampleRateHz = 100_000;
    const f0 = 5_000;
    const L = 1;
    const M = 4;
    const sampleCount = 2048;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: f0, amp: 1 }],
    });
    // Pre-filter then pure decimate (skipFilter) — same as DDC path for L===1
    const taps = defaultDdcFirTaps(L, M, 63);
    const filtered = applyFirComplex(iq, taps);
    const js = rationalResampleIq({
      iqInterleaved: filtered,
      interpolation: L,
      decimation: M,
      skipFilter: true,
    });
    const wasm = await wasmRationalResampleIq({
      iqInterleaved: filtered,
      interpolation: L,
      decimation: M,
      skipFilter: true,
    });
    expect(wasm.length).toBe(js.length);
    expect(wasm.length / 2).toBe(Math.floor(sampleCount / M));
    expect(outputSampleRateHz(sampleRateHz, L, M)).toBe(sampleRateHz / M);
    expect(maxAbsDiffF32(js, wasm)).toBeLessThan(RESAMPLE_ABS_EPS);

    const outFs = sampleRateHz / M;
    const fftSize = 512;
    const power = powerSpectrumIq(wasm, fftSize);
    const expected = frequencyToBin(f0, outFs, fftSize);
    const pb = peakBin(power);
    const dist = Math.min(
      Math.abs(pb - expected),
      Math.abs(pb - expected + fftSize),
      Math.abs(pb - expected - fftSize),
    );
    expect(dist).toBeLessThanOrEqual(1);
  });

  it('JS vs WASM rationalResampleIq with L>1 (upsample+FIR+downsample)', async () => {
    const sampleRateHz = 48_000;
    const f0 = 3_000;
    const L = 2;
    const M = 3;
    const sampleCount = 600;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: f0, amp: 1 }],
    });
    const js = rationalResampleIq({
      iqInterleaved: iq,
      interpolation: L,
      decimation: M,
    });
    const wasm = await wasmRationalResampleIq({
      iqInterleaved: iq,
      interpolation: L,
      decimation: M,
    });
    expect(wasm.length).toBe(js.length);
    expect(maxAbsDiffF32(js, wasm)).toBeLessThan(RESAMPLE_ABS_EPS);
  });

  it('JS vs WASM mixDownLo', async () => {
    const sampleRateHz = 50_000;
    const loHz = 10_000;
    const iq = synthesizeComplexToneIqF32({
      sampleCount: 512,
      sampleRateHz,
      tones: [{ freqHz: loHz, amp: 1 }],
    });
    const opts = { beginIndex: 0, loHz, sampleRateHz };
    const js = mixDownLo(iq, opts);
    const wasm = await wasmMixDownLo(iq, opts);
    expect(maxAbsDiffF32(js, wasm)).toBeLessThan(MIX_ABS_EPS);
  });

  it('JS ReferenceDdcEngine vs WasmReferenceDdcEngine: tone→DC + sample parity', async () => {
    const sampleRateHz = 100_000;
    const f0 = 0.1 * sampleRateHz;
    const decimation = 4;
    const interpolation = 1;
    const sampleCount = 4096;
    const iq = synthesizeComplexToneIqF32({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: f0, amp: 1 }],
    });
    const req = {
      begin: 0n,
      end: BigInt(sampleCount),
      loHz: f0,
      sampleRateHz,
      interpolation,
      decimation,
    };
    const js = await new ReferenceDdcEngine().process(req, iq);
    const wasm = await new WasmReferenceDdcEngine().process(req, iq);
    expect(wasm.outputSampleRateHz).toBe(js.outputSampleRateHz);
    expect(wasm.end).toBe(js.end);
    expect(wasm.samples.length).toBe(js.samples.length);
    expect(maxAbsDiffF32(js.samples, wasm.samples)).toBeLessThan(DDC_SAMPLE_ABS_EPS);

    const fftSize = 512;
    const power = powerSpectrumIq(wasm.samples, fftSize);
    const dist = Math.min(peakBin(power), fftSize - peakBin(power));
    expect(dist).toBeLessThanOrEqual(1);
  });

  it('WasmReferenceDdcEngine two-tone: keep near DC, reject image', async () => {
    const sampleRateHz = 100_000;
    const fKeep = 10_000;
    const fReject = 30_000;
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
    const result = await new WasmReferenceDdcEngine().process(
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
    const fftSize = 1024;
    const power = powerSpectrumIq(result.samples, fftSize);
    const dcEnergy =
      power[0]! + power[1]! + power[2]! + power[fftSize - 1]! + power[fftSize - 2]! + power[fftSize - 3]!;
    const farCenter = Math.floor(fftSize / 4);
    let farEnergy = 0;
    for (let k = farCenter - 5; k <= farCenter + 5; k++) farEnergy += power[k]!;
    expect(dcEnergy).toBeGreaterThan(farEnergy * 20);
    const dist = Math.min(peakBin(power), fftSize - peakBin(power));
    expect(dist).toBeLessThanOrEqual(2);
  });
});
