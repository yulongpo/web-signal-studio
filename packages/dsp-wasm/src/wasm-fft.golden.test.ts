import { describe, expect, it, beforeAll } from 'vitest';
import {
  fftRadix2,
  powerSpectrum,
  findPeakBins,
  frequencyToBin,
} from './fft.js';
import { ReferencePsdEngine } from './psd.js';
import {
  isWasmFftAvailable,
  loadWasmFftModule,
  wasmFftRadix2WithModule,
  WasmReferencePsdEngine,
} from './wasm/index.js';

/**
 * dtype: float64 for both JS and WASM kernels.
 * Eps accounts for transcendental (sin/cos) + FP associativity differences
 * between JS Math and libm used by the WASM build — not algorithmic drift.
 */
const FFT_MAX_ABS_EPS = 1e-9;
const PSD_REL_EPS = 1e-6;
const PSD_ABS_FLOOR = 1e-18;

function synthesizeTwoToneF64(options: {
  nComplex: number;
  sampleRateHz: number;
  f1Hz: number;
  f2Hz: number;
  amp1?: number;
  amp2?: number;
}): Float64Array {
  const { nComplex, sampleRateHz, f1Hz, f2Hz } = options;
  const a1 = options.amp1 ?? 1;
  const a2 = options.amp2 ?? 0.7;
  const out = new Float64Array(nComplex * 2);
  for (let n = 0; n < nComplex; n++) {
    const p1 = (2 * Math.PI * f1Hz * n) / sampleRateHz;
    const p2 = (2 * Math.PI * f2Hz * n) / sampleRateHz;
    out[n * 2] = a1 * Math.cos(p1) + a2 * Math.cos(p2);
    out[n * 2 + 1] = a1 * Math.sin(p1) + a2 * Math.sin(p2);
  }
  return out;
}

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

function maxAbsDiff(a: Float64Array, b: Float64Array): number {
  let m = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i]! - b[i]!);
    if (d > m) m = d;
  }
  return m;
}

describe('WASM FFT/PSD golden (package B)', () => {
  beforeAll(async () => {
    expect(isWasmFftAvailable()).toBe(true);
    await loadWasmFftModule();
  });

  it('JS vs WASM fftRadix2: peak bins identical and max abs err tight (two-tone)', async () => {
    const fftSize = 1024;
    const sampleRateHz = 1_024_000;
    const f1Hz = 50_000;
    const f2Hz = 120_000;
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);

    const jsBuf = synthesizeTwoToneF64({
      nComplex: fftSize,
      sampleRateHz,
      f1Hz,
      f2Hz,
    });
    const wasmBuf = new Float64Array(jsBuf);

    fftRadix2(jsBuf, false);
    const mod = await loadWasmFftModule();
    wasmFftRadix2WithModule(mod, wasmBuf, false);

    const err = maxAbsDiff(jsBuf, wasmBuf);
    expect(err).toBeLessThan(FFT_MAX_ABS_EPS);

    const jsPeaks = findPeakBins(powerSpectrum(jsBuf), 2, 3).sort((a, b) => a - b);
    const wasmPeaks = findPeakBins(powerSpectrum(wasmBuf), 2, 3).sort((a, b) => a - b);
    expect(jsPeaks).toEqual([expected1, expected2]);
    expect(wasmPeaks).toEqual(jsPeaks);
  });

  it('inverse WASM FFT round-trips (scale parity with JS)', async () => {
    const n = 64;
    const src = new Float64Array(n * 2);
    for (let i = 0; i < src.length; i++) src[i] = Math.sin(i * 0.37) * 0.5;

    const js = new Float64Array(src);
    fftRadix2(js, false);
    fftRadix2(js, true);

    const wasm = new Float64Array(src);
    const mod = await loadWasmFftModule();
    wasmFftRadix2WithModule(mod, wasm, false);
    wasmFftRadix2WithModule(mod, wasm, true);

    expect(maxAbsDiff(js, wasm)).toBeLessThan(FFT_MAX_ABS_EPS);
    expect(maxAbsDiff(js, src)).toBeLessThan(1e-10);
  });

  it('ReferencePsdEngine (JS) vs WasmReferencePsdEngine: peaks match, powers within eps', async () => {
    const fftSize = 1024;
    const sampleRateHz = 1_024_000;
    const f1Hz = 50_000;
    const f2Hz = 120_000;
    const expected1 = frequencyToBin(f1Hz, sampleRateHz, fftSize);
    const expected2 = frequencyToBin(f2Hz, sampleRateHz, fftSize);
    const sampleCount = fftSize * 4;
    const iq = synthesizeTwoToneIqF32({ sampleCount, sampleRateHz, f1Hz, f2Hz });

    const req = {
      begin: 0n,
      end: BigInt(sampleCount),
      fftSize,
      window: 'hann' as const,
      overlap: 0.5,
      sampleRateHz,
    };

    const jsResult = await new ReferencePsdEngine().analyze(req, iq);
    const wasmResult = await new WasmReferencePsdEngine().analyze(req, iq);

    expect(wasmResult.linearPower.length).toBe(fftSize);
    const jsPower = Float64Array.from(jsResult.linearPower);
    const wasmPower = Float64Array.from(wasmResult.linearPower);

    const jsPeaks = findPeakBins(jsPower, 2, 3).sort((a, b) => a - b);
    const wasmPeaks = findPeakBins(wasmPower, 2, 3).sort((a, b) => a - b);
    expect(jsPeaks).toEqual([expected1, expected2]);
    expect(wasmPeaks).toEqual(jsPeaks);

    for (let k = 0; k < fftSize; k++) {
      const a = jsPower[k]!;
      const b = wasmPower[k]!;
      const tol = Math.max(PSD_ABS_FLOOR, PSD_REL_EPS * Math.max(Math.abs(a), Math.abs(b)));
      expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
    }
  });
});
