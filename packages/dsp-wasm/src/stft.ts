import type { StftRequest, StftResult, SampleIndex } from '@wss/contracts';
import {
  sampleIndexToDecimal,
  isStftSupportedMethod,
  DEFAULT_KAISER_BETA,
  segmentMillisecondsFromFft,
  resolveAnalysisSamples,
  webFftSizeFromAnalysisSamples,
} from '@wss/contracts';
import { fftRadix2, isPowerOfTwo, binFrequencyHz } from './fft.js';
import type { StftEngine } from './interfaces.js';
import type { FftRadix2Fn } from './psd.js';
import { makeWindow, windowPowerSum } from './windows.js';

export type { FftRadix2Fn } from './psd.js';

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('STFT aborted');
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
 * Reference STFT engine: hop frames → linear-power spectrogram for complex IQ.
 * Uses JS fftRadix2 by default (same as Package A/B callers).
 */
export class ReferenceStftEngine implements StftEngine {
  async analyze(request: StftRequest, iqInterleaved: Float32Array): Promise<StftResult> {
    return computeStft(request, iqInterleaved);
  }
}

export async function computeStft(
  request: StftRequest,
  iqInterleaved: Float32Array,
  fft: FftRadix2Fn = fftRadix2,
): Promise<StftResult> {
  throwIfAborted(request.signal);
  if (!isStftSupportedMethod(request.method)) {
    throw new RangeError(
      `STFT method '${String(request.method)}' is BLOCKED on web (only 'welch' is implemented)`,
    );
  }

  let { fftSize, hopSize, window, sampleRateHz } = request;

  // Desktop auto N/B: segmentMilliseconds === 0
  const segmentMs = request.segmentMilliseconds;
  let autoNb = false;
  if (segmentMs === 0) {
    if (
      request.bandwidthHz == null ||
      !(request.bandwidthHz > 0) ||
      request.analysisPoints == null
    ) {
      throw new RangeError(
        'STFT auto N/B (segmentMilliseconds===0) requires bandwidthHz and analysisPoints — no silent fake auto',
      );
    }
    const plan = resolveAnalysisSamples({
      sampleRateHz,
      bandwidthHz: request.bandwidthHz,
      points: request.analysisPoints,
      segmentMilliseconds: 0,
    });
    fftSize = webFftSizeFromAnalysisSamples(plan.analysisSamples);
    autoNb = true;
  }

  if (!isPowerOfTwo(fftSize)) {
    throw new RangeError(`STFT fftSize must be power of two, got ${fftSize}`);
  }
  if (!Number.isInteger(hopSize) || hopSize <= 0) {
    throw new RangeError(`STFT hopSize must be positive integer, got ${hopSize}`);
  }

  const begin = request.begin;
  const end = request.end;
  if (end < begin) throw new RangeError('STFT end < begin');

  const totalSamplesInBuffer = BigInt(iqInterleaved.length / 2);
  const span = end - begin;
  if (span > totalSamplesInBuffer) {
    throw new RangeError(
      `STFT range ${sampleIndexToDecimal(begin)}..${sampleIndexToDecimal(end)} exceeds buffer samples ${sampleIndexToDecimal(totalSamplesInBuffer)}`,
    );
  }
  const nSamples = Number(span);
  if (!Number.isSafeInteger(nSamples)) {
    throw new RangeError('STFT span exceeds Number.MAX_SAFE_INTEGER');
  }

  const kaiserBeta =
    request.kaiserBeta != null && Number.isFinite(request.kaiserBeta)
      ? request.kaiserBeta
      : DEFAULT_KAISER_BETA;
  // Publish metadata: explicit ms, or derived; auto path keeps 0 as the request value.
  if (segmentMs == null) {
    void segmentMillisecondsFromFft(fftSize, sampleRateHz);
  }
  void autoNb;

  const removeMean = request.removeMean === true;
  const win = makeWindow(window, fftSize, kaiserBeta);
  const wPow = windowPowerSum(win);
  const scale = 1 / (wPow * sampleRateHz);

  const frameStarts: number[] = [];
  for (let start = 0; start + fftSize <= nSamples; start += hopSize) {
    frameStarts.push(start);
  }
  if (frameStarts.length === 0 && nSamples > 0) {
    frameStarts.push(0);
  }

  const frameCount = frameStarts.length;
  const binCount = fftSize;
  const linearPower = new Float32Array(frameCount * binCount);
  const frameCenters: string[] = [];

  for (let f = 0; f < frameCount; f++) {
    throwIfAborted(request.signal);
    if (request.signal) await yieldForAbort();
    const start = frameStarts[f]!;
    const frame = new Float64Array(fftSize * 2);
    const use = Math.min(fftSize, nSamples - start);

    let meanI = 0;
    let meanQ = 0;
    if (removeMean && use > 0) {
      for (let n = 0; n < use; n++) {
        const src = (start + n) * 2;
        meanI += iqInterleaved[src]!;
        meanQ += iqInterleaved[src + 1]!;
      }
      meanI /= use;
      meanQ /= use;
    }

    for (let n = 0; n < use; n++) {
      const src = (start + n) * 2;
      const w = win[n]!;
      const i = iqInterleaved[src]! - meanI;
      const q = iqInterleaved[src + 1]! - meanQ;
      frame[n * 2] = i * w;
      frame[n * 2 + 1] = q * w;
    }
    fft(frame, false);
    const row = f * binCount;
    for (let k = 0; k < binCount; k++) {
      const re = frame[k * 2]!;
      const im = frame[k * 2 + 1]!;
      linearPower[row + k] = (re * re + im * im) * scale;
    }
    const center = begin + BigInt(start) + BigInt(Math.floor(fftSize / 2));
    frameCenters.push(sampleIndexToDecimal(center as SampleIndex));
  }

  const frequenciesHz = new Float64Array(binCount);
  for (let k = 0; k < binCount; k++) {
    frequenciesHz[k] = binFrequencyHz(k, fftSize, sampleRateHz);
  }

  return {
    frequenciesHz,
    frameCenters,
    linearPower,
    frameCount,
    binCount,
  };
}
