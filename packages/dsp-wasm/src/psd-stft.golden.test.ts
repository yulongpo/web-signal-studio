import { describe, expect, it } from 'vitest';
import { findPeakBins, frequencyToBin } from './fft.js';
import { ReferencePsdEngine } from './psd.js';
import { ReferenceStftEngine } from './stft.js';
import { makeWindow } from './windows.js';

/**
 * SYNTHETIC FIXTURE ONLY — not loaded from disk / SigMF / RAW.
 * Two complex tones at exact DFT bin centres.
 */
function synthesizeTwoToneIqF32(options: {
  sampleCount: number;
  sampleRateHz: number;
  f1Hz: number;
  f2Hz: number;
  amp1?: number;
  amp2?: number;
}): Float32Array {
  const { sampleCount, sampleRateHz, f1Hz, f2Hz } = options;
  const a1 = options.amp1 ?? 1;
  const a2 = options.amp2 ?? 0.7;
  const out = new Float32Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    const p1 = (2 * Math.PI * f1Hz * n) / sampleRateHz;
    const p2 = (2 * Math.PI * f2Hz * n) / sampleRateHz;
    out[n * 2] = a1 * Math.cos(p1) + a2 * Math.cos(p2);
    out[n * 2 + 1] = a1 * Math.sin(p1) + a2 * Math.sin(p2);
  }
  return out;
}

describe('windows', () => {
  it('builds rectangular and hann of expected length', () => {
    const r = makeWindow('rectangular', 8);
    expect([...r]).toEqual([1, 1, 1, 1, 1, 1, 1, 1]);
    const h = makeWindow('hann', 5);
    expect(h.length).toBe(5);
    expect(h[0]).toBeCloseTo(0, 10);
    expect(h[2]!).toBeCloseTo(1, 10);
    expect(h[4]!).toBeCloseTo(0, 10);
  });
});

describe('ReferencePsdEngine golden (synthetic two-tone)', () => {
  it('places PSD peaks within ±1 bin of expected tone frequencies', async () => {
    const fftSize = 1024;
    const sampleRateHz = 1_024_000; // 1 kHz/bin
    const f1Hz = 50_000;
    const f2Hz = 120_000;
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);
    expect(expected1).toBe(50);
    expect(expected2).toBe(120);

    // Several frames for Welch average
    const sampleCount = fftSize * 4;
    const iq = synthesizeTwoToneIqF32({ sampleCount, sampleRateHz, f1Hz, f2Hz });
    const engine = new ReferencePsdEngine();
    const result = await engine.analyze(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        window: 'hann',
        overlap: 0.5,
        sampleRateHz,
      },
      iq,
    );

    expect(result.linearPower.length).toBe(fftSize);
    const power = Float64Array.from(result.linearPower);
    const peaks = findPeakBins(power, 2, 3).sort((a, b) => a - b);
    const toleranceBins = 1;
    expect(peaks).toHaveLength(2);
    expect(Math.abs(peaks[0]! - expected1)).toBeLessThanOrEqual(toleranceBins);
    expect(Math.abs(peaks[1]! - expected2)).toBeLessThanOrEqual(toleranceBins);

    const floor =
      [...power].reduce((s, v, i) => (peaks.includes(i) ? s : s + v), 0) / (fftSize - 2);
    expect(power[peaks[0]!]!).toBeGreaterThan(floor * 50);
    expect(power[peaks[1]!]!).toBeGreaterThan(floor * 50);
  });
});

describe('ReferenceStftEngine golden (synthetic two-tone)', () => {
  it('concentrates STFT energy near tone bins across frames', async () => {
    const fftSize = 256;
    const hopSize = 128;
    const sampleRateHz = 256_000; // 1 kHz/bin
    const f1Hz = 40_000; // bin 40
    const f2Hz = 80_000; // bin 80
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);
    expect(expected1).toBe(40);
    expect(expected2).toBe(80);

    const sampleCount = fftSize + hopSize * 3; // 4 frames
    const iq = synthesizeTwoToneIqF32({ sampleCount, sampleRateHz, f1Hz, f2Hz });
    const engine = new ReferenceStftEngine();
    const result = await engine.analyze(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        hopSize,
        window: 'hann',
        sampleRateHz,
      },
      iq,
    );

    expect(result.frameCount).toBeGreaterThanOrEqual(3);
    expect(result.binCount).toBe(fftSize);
    expect(result.frameCenters.length).toBe(result.frameCount);

    const toleranceBins = 1;
    for (let f = 0; f < result.frameCount; f++) {
      const row = result.linearPower.subarray(f * fftSize, (f + 1) * fftSize);
      const power = Float64Array.from(row);
      const peaks = findPeakBins(power, 2, 3).sort((a, b) => a - b);
      expect(peaks).toHaveLength(2);
      expect(Math.abs(peaks[0]! - expected1)).toBeLessThanOrEqual(toleranceBins);
      expect(Math.abs(peaks[1]! - expected2)).toBeLessThanOrEqual(toleranceBins);

      // Energy in ±1 bin around each tone >> elsewhere (explicit tolerance)
      const toneEnergy = energyNear(power, expected1, toleranceBins) + energyNear(power, expected2, toleranceBins);
      const total = power.reduce((s, v) => s + v, 0);
      expect(toneEnergy / total).toBeGreaterThan(0.5);
    }
  });
});

function energyNear(power: Float64Array, center: number, radius: number): number {
  let s = 0;
  for (let i = center - radius; i <= center + radius; i++) {
    const idx = ((i % power.length) + power.length) % power.length;
    s += power[idx]!;
  }
  return s;
}
