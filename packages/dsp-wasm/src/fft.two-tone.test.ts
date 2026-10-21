import { describe, expect, it } from 'vitest';
import {
  fftRadix2,
  findPeakBins,
  frequencyToBin,
  powerSpectrum,
} from './fft.js';

/**
 * SYNTHETIC FIXTURE ONLY — not loaded from disk / SigMF / RAW.
 * Two complex tones at exact DFT bins so peak assertions are unambiguous.
 */
function synthesizeTwoToneIq(options: {
  fftSize: number;
  sampleRateHz: number;
  f1Hz: number;
  f2Hz: number;
  amp1?: number;
  amp2?: number;
}): Float64Array {
  const { fftSize, sampleRateHz, f1Hz, f2Hz } = options;
  const a1 = options.amp1 ?? 1;
  const a2 = options.amp2 ?? 0.7;
  const out = new Float64Array(fftSize * 2);
  for (let n = 0; n < fftSize; n++) {
    const p1 = (2 * Math.PI * f1Hz * n) / sampleRateHz;
    const p2 = (2 * Math.PI * f2Hz * n) / sampleRateHz;
    out[n * 2] = a1 * Math.cos(p1) + a2 * Math.cos(p2);
    out[n * 2 + 1] = a1 * Math.sin(p1) + a2 * Math.sin(p2);
  }
  return out;
}

describe('fftRadix2 two-tone golden (synthetic fixture)', () => {
  it('places peaks within ±1 bin of expected tone frequencies', () => {
    const fftSize = 1024;
    const sampleRateHz = 1_024_000; // 1.024 MHz → 1 kHz/bin
    // Choose exact bin centres: bin 50 → 50 kHz, bin 120 → 120 kHz
    const f1Hz = 50_000;
    const f2Hz = 120_000;
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);
    expect(expected1).toBe(50);
    expect(expected2).toBe(120);

    const iq = synthesizeTwoToneIq({ fftSize, sampleRateHz, f1Hz, f2Hz });
    fftRadix2(iq, false);
    const power = powerSpectrum(iq);
    const peaks = findPeakBins(power, 2, 3).sort((a, b) => a - b);

    const toleranceBins = 1;
    expect(peaks).toHaveLength(2);
    expect(Math.abs(peaks[0]! - expected1)).toBeLessThanOrEqual(toleranceBins);
    expect(Math.abs(peaks[1]! - expected2)).toBeLessThanOrEqual(toleranceBins);

    // Peak powers must dominate noise floor (synthetic tones, no window loss at bin centre)
    const floor =
      [...power].reduce((s, v, i) => (peaks.includes(i) ? s : s + v), 0) / (fftSize - 2);
    expect(power[peaks[0]!]!).toBeGreaterThan(floor * 100);
    expect(power[peaks[1]!]!).toBeGreaterThan(floor * 100);
  });

  it('round-trips inverse FFT for a single complex tone', () => {
    const fftSize = 256;
    const sampleRateHz = 2560;
    const fHz = 100; // bin 10
    const original = synthesizeTwoToneIq({
      fftSize,
      sampleRateHz,
      f1Hz: fHz,
      f2Hz: fHz,
      amp1: 0.5,
      amp2: 0.5,
    });
    const copy = original.slice();
    fftRadix2(copy, false);
    fftRadix2(copy, true);
    let maxErr = 0;
    for (let i = 0; i < copy.length; i++) {
      maxErr = Math.max(maxErr, Math.abs(copy[i]! - original[i]!));
    }
    expect(maxErr).toBeLessThan(1e-10);
  });
});
