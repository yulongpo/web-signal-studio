import type { PsdRequest, PsdResult, SampleIndex } from '@wss/contracts';
import { sampleIndexToDecimal } from '@wss/contracts';
import { fftRadix2, isPowerOfTwo, binFrequencyHz } from './fft.js';
import type { PsdEngine } from './interfaces.js';
import { makeWindow, windowPowerSum } from './windows.js';

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('PSD aborted');
    err.name = 'AbortError';
    throw err;
  }
}

/** Yield so AbortSignal / worker cancel can land (macrotask-friendly on Node). */
function yieldForAbort(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof setImmediate === 'function') setImmediate(resolve);
    else queueMicrotask(resolve);
  });
}

/**
 * Reference PSD engine: Welch-style averaged periodogram over complex IQ
 * (Float32 interleaved I,Q). Uses portable fftRadix2 — not a stub.
 */
export class ReferencePsdEngine implements PsdEngine {
  async analyze(request: PsdRequest, iqInterleaved: Float32Array): Promise<PsdResult> {
    return computePsd(request, iqInterleaved);
  }
}

export async function computePsd(request: PsdRequest, iqInterleaved: Float32Array): Promise<PsdResult> {
  const { fftSize, window, overlap, sampleRateHz } = request;
  throwIfAborted(request.signal);
  if (!isPowerOfTwo(fftSize)) {
    throw new RangeError(`PSD fftSize must be power of two, got ${fftSize}`);
  }
  if (!(overlap >= 0 && overlap < 1)) {
    throw new RangeError(`PSD overlap must be in [0,1), got ${overlap}`);
  }

  const begin = request.begin;
  const end = request.end;
  if (end < begin) throw new RangeError('PSD end < begin');

  const totalSamplesInBuffer = BigInt(iqInterleaved.length / 2);
  const span = end - begin;
  if (span > totalSamplesInBuffer) {
    throw new RangeError(
      `PSD range ${sampleIndexToDecimal(begin)}..${sampleIndexToDecimal(end)} exceeds buffer samples ${sampleIndexToDecimal(totalSamplesInBuffer)}`,
    );
  }
  // Buffer is assumed to hold samples starting at `begin` (caller slices).
  const nSamples = Number(span);
  if (!Number.isSafeInteger(nSamples)) {
    throw new RangeError('PSD span exceeds Number.MAX_SAFE_INTEGER');
  }

  const hop = Math.max(1, Math.floor(fftSize * (1 - overlap)));
  const win = makeWindow(window, fftSize);
  const wPow = windowPowerSum(win);
  // Scale so that a unit-amplitude complex tone → power ≈ 1 in its bin (Welch).
  const scale = 1 / (wPow * sampleRateHz);

  const avg = new Float64Array(fftSize);
  let frames = 0;
  for (let start = 0; start + fftSize <= nSamples; start += hop) {
    throwIfAborted(request.signal);
    if (request.signal) await yieldForAbort();
    const frame = new Float64Array(fftSize * 2);
    for (let n = 0; n < fftSize; n++) {
      const src = (start + n) * 2;
      const w = win[n]!;
      frame[n * 2] = iqInterleaved[src]! * w;
      frame[n * 2 + 1] = iqInterleaved[src + 1]! * w;
    }
    fftRadix2(frame, false);
    for (let k = 0; k < fftSize; k++) {
      const re = frame[k * 2]!;
      const im = frame[k * 2 + 1]!;
      avg[k]! += (re * re + im * im) * scale;
    }
    frames += 1;
  }

  if (frames === 0) {
    // Single periodogram on available prefix (zero-pad).
    const frame = new Float64Array(fftSize * 2);
    const use = Math.min(nSamples, fftSize);
    for (let n = 0; n < use; n++) {
      const src = n * 2;
      const w = win[n]!;
      frame[n * 2] = iqInterleaved[src]! * w;
      frame[n * 2 + 1] = iqInterleaved[src + 1]! * w;
    }
    fftRadix2(frame, false);
    for (let k = 0; k < fftSize; k++) {
      const re = frame[k * 2]!;
      const im = frame[k * 2 + 1]!;
      avg[k]! = (re * re + im * im) * scale;
    }
    frames = 1;
  } else {
    for (let k = 0; k < fftSize; k++) avg[k]! /= frames;
  }

  const frequenciesHz = new Float64Array(fftSize);
  const linearPower = new Float32Array(fftSize);
  for (let k = 0; k < fftSize; k++) {
    frequenciesHz[k] = binFrequencyHz(k, fftSize, sampleRateHz);
    linearPower[k] = avg[k]!;
  }

  return {
    frequenciesHz,
    linearPower,
    fftSize,
    sampleRateHz,
  };
}

/** Periodogram of a single frame (no averaging). */
export async function periodogram(
  iqInterleaved: Float32Array,
  options: {
    fftSize: number;
    window: PsdRequest['window'];
    sampleRateHz: number;
  },
): Promise<PsdResult> {
  const n = iqInterleaved.length / 2;
  return computePsd(
    {
      begin: 0n as SampleIndex,
      end: BigInt(n) as SampleIndex,
      fftSize: options.fftSize,
      window: options.window,
      overlap: 0,
      sampleRateHz: options.sampleRateHz,
    },
    iqInterleaved,
  );
}
