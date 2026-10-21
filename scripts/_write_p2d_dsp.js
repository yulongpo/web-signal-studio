const fs = require('fs');
const path = require('path');
function write(rel, content) {
  const abs = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.replace(/\r?\n/g, '\n'), { encoding: 'utf8' });
  console.log('wrote', rel);
}

write('packages/dsp-wasm/package.json', `{
  "name": "@web-signal-studio/dsp-wasm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@web-signal-studio/contracts": "0.1.0"
  }
}
`);

write('packages/dsp-wasm/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "composite": true },
  "include": ["src/**/*.ts"]
}
`);

write('packages/dsp-wasm/src/fft.ts', `/**
 * In-place radix-2 Cooley–Tukey FFT over interleaved complex Float64
 * [re0, im0, re1, im1, ...]. Length of complex samples must be power of two.
 * WASM port comes later; this is the portable reference kernel.
 */

export function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

export function fftRadix2(interleaved: Float64Array, inverse = false): void {
  const nComplex = interleaved.length / 2;
  if (!isPowerOfTwo(nComplex)) {
    throw new RangeError(\`FFT length must be power of two, got \${nComplex}\`);
  }
  if (interleaved.length !== nComplex * 2) {
    throw new RangeError('interleaved buffer length must be 2 * n');
  }

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < nComplex; i++) {
    let bit = nComplex >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const ir = i * 2;
      const jr = j * 2;
      const tr = interleaved[ir]!;
      const ti = interleaved[ir + 1]!;
      interleaved[ir] = interleaved[jr]!;
      interleaved[ir + 1] = interleaved[jr + 1]!;
      interleaved[jr] = tr;
      interleaved[jr + 1] = ti;
    }
  }

  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= nComplex; len <<= 1) {
    const ang = (sign * (2 * Math.PI)) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < nComplex; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uIndex = (i + j) * 2;
        const vIndex = (i + j + len / 2) * 2;
        const uRe = interleaved[uIndex]!;
        const uIm = interleaved[uIndex + 1]!;
        const vRe0 = interleaved[vIndex]!;
        const vIm0 = interleaved[vIndex + 1]!;
        const vRe = vRe0 * wRe - vIm0 * wIm;
        const vIm = vRe0 * wIm + vIm0 * wRe;
        interleaved[uIndex] = uRe + vRe;
        interleaved[uIndex + 1] = uIm + vIm;
        interleaved[vIndex] = uRe - vRe;
        interleaved[vIndex + 1] = uIm - vIm;
        const nextWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextWRe;
      }
    }
  }

  if (inverse) {
    const scale = 1 / nComplex;
    for (let i = 0; i < interleaved.length; i++) interleaved[i]! *= scale;
  }
}

/** Complex magnitude-squared spectrum (length nComplex). */
export function powerSpectrum(interleaved: Float64Array): Float64Array {
  const n = interleaved.length / 2;
  const out = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const re = interleaved[k * 2]!;
    const im = interleaved[k * 2 + 1]!;
    out[k] = re * re + im * im;
  }
  return out;
}

/** Baseband bin centre frequency for DFT bin k (unshifted, bin 0 = DC). */
export function binFrequencyHz(bin: number, fftSize: number, sampleRateHz: number): number {
  if (bin < 0 || bin >= fftSize) throw new RangeError('bin out of range');
  if (bin <= fftSize / 2) return (bin * sampleRateHz) / fftSize;
  return ((bin - fftSize) * sampleRateHz) / fftSize;
}

export function frequencyToBin(frequencyHz: number, sampleRateHz: number, fftSize: number): number {
  const raw = Math.round((frequencyHz / sampleRateHz) * fftSize);
  return ((raw % fftSize) + fftSize) % fftSize;
}

/** Find top-K peak bins by power (excluding duplicates within excludeRadius). */
export function findPeakBins(power: Float64Array, k: number, excludeRadius = 2): number[] {
  const peaks: number[] = [];
  const used = new Uint8Array(power.length);
  for (let n = 0; n < k; n++) {
    let best = -1;
    let bestVal = -Infinity;
    for (let i = 0; i < power.length; i++) {
      if (used[i]) continue;
      const v = power[i]!;
      if (v > bestVal) {
        bestVal = v;
        best = i;
      }
    }
    if (best < 0) break;
    peaks.push(best);
    const lo = Math.max(0, best - excludeRadius);
    const hi = Math.min(power.length - 1, best + excludeRadius);
    for (let i = lo; i <= hi; i++) used[i] = 1;
  }
  return peaks;
}
`);

write('packages/dsp-wasm/src/interfaces.ts', `import type {
  DdcRequest,
  DdcResult,
  PsdRequest,
  PsdResult,
  StftRequest,
  StftResult,
} from '../../contracts/src/spectral.js';

/** PSD engine placeholder — full Welch/Bartlett ports land with WASM. */
export interface PsdEngine {
  analyze(request: PsdRequest, iqInterleaved: Float32Array): Promise<PsdResult>;
}

/** STFT / spectrogram placeholder. */
export interface StftEngine {
  analyze(request: StftRequest, iqInterleaved: Float32Array): Promise<StftResult>;
}

/** DDC + FIR + rational resample placeholder. */
export interface DdcEngine {
  process(request: DdcRequest, iqInterleaved: Float32Array): Promise<DdcResult>;
}

export class NotImplementedPsdEngine implements PsdEngine {
  async analyze(): Promise<PsdResult> {
    throw new Error('PsdEngine not implemented yet (Bot-D P2+); use fftRadix2 for unit kernels');
  }
}

export class NotImplementedStftEngine implements StftEngine {
  async analyze(): Promise<StftResult> {
    throw new Error('StftEngine not implemented yet (Bot-D P2+)');
  }
}

export class NotImplementedDdcEngine implements DdcEngine {
  async process(): Promise<DdcResult> {
    throw new Error('DdcEngine not implemented yet (Bot-D P2+)');
  }
}
`);

write('packages/dsp-wasm/src/index.ts', `export {
  fftRadix2,
  powerSpectrum,
  binFrequencyHz,
  frequencyToBin,
  findPeakBins,
  isPowerOfTwo,
} from './fft.js';

export type { PsdEngine, StftEngine, DdcEngine } from './interfaces.js';
export {
  NotImplementedPsdEngine,
  NotImplementedStftEngine,
  NotImplementedDdcEngine,
} from './interfaces.js';
`);

write('packages/dsp-wasm/src/fft.two-tone.test.ts', `import { describe, expect, it } from 'vitest';
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
`);

// placeholders
write('tests/fixtures/dsp/.gitkeep', '');
write('tests/parity/dsp/.gitkeep', '');

console.log('dsp-wasm done');
