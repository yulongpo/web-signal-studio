/**
 * Reference DDC engine (portable JS — WASM later).
 *
 * Processing order (documented):
 *   1. Complex LO mix-down: x[n] *= exp(-j * 2π * loHz * n / fs)
 *      Sample index n starts at request.begin (Number(begin)+i; safe for test-scale BigInts).
 *   2. Real FIR lowpass on I and Q (caller firTaps, or default windowed-sinc
 *      with cutoffNyquist = 0.45 / max(L, M) of input Nyquist — see fir.ts).
 *   3. Rational resample: outputRate = fs * interpolation / decimation
 *      (zero-insert + filter when L>1, then keep every M-th).
 *
 * Output sample indices are engine-local: begin = 0n, end = BigInt(N_out).
 * (Mapping back to input indices would need filter delay / rate accounting;
 *  callers that need absolute time can scale by outputSampleRateHz.)
 */

import type { DdcRequest, DdcResult } from '@wss/contracts';
import { sampleIndexToDecimal } from '@wss/contracts';
import type { DdcEngine } from './interfaces.js';
import { applyFirComplex, defaultDdcFirTaps } from './fir.js';
import { outputSampleRateHz, rationalResampleIq } from './rational-resample.js';

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('DDC aborted');
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

/** Mix complex IQ by LO: x[n] *= exp(-j*2π*loHz*n/fs), n = beginIndex + i. */
export function mixDownLo(
  iqInterleaved: Float32Array | Float64Array,
  options: { beginIndex: number; loHz: number; sampleRateHz: number },
): Float32Array {
  const { beginIndex, loHz, sampleRateHz } = options;
  const nSamples = iqInterleaved.length / 2;
  const out = new Float32Array(nSamples * 2);
  if (loHz === 0) {
    for (let i = 0; i < iqInterleaved.length; i++) out[i] = iqInterleaved[i]!;
    return out;
  }
  const twoPi = 2 * Math.PI;
  for (let i = 0; i < nSamples; i++) {
    const n = beginIndex + i;
    const phase = (-twoPi * loHz * n) / sampleRateHz;
    const c = Math.cos(phase);
    const s = Math.sin(phase);
    const re = iqInterleaved[i * 2]!;
    const im = iqInterleaved[i * 2 + 1]!;
    // (re+j*im)*(c+j*s) with s = sin(phase), phase negative → exp(-jθ)=c+j*(-sinθ)?
    // exp(-jθ) = cos(-θ)+j*sin(-θ) = cos(θ) - j*sin(θ)
    // Here phase = -θ already, so exp(j*phase) = cos(phase)+j*sin(phase).
    out[i * 2] = re * c - im * s;
    out[i * 2 + 1] = re * s + im * c;
  }
  return out;
}

export async function computeDdc(request: DdcRequest, iqInterleaved: Float32Array): Promise<DdcResult> {
  throwIfAborted(request.signal);
  if (request.signal) await yieldForAbort();

  const { loHz, sampleRateHz, interpolation, decimation } = request;
  if (!(sampleRateHz > 0)) throw new RangeError('sampleRateHz must be > 0');
  if (!Number.isInteger(interpolation) || interpolation < 1) {
    throw new RangeError(`interpolation must be integer >= 1, got ${interpolation}`);
  }
  if (!Number.isInteger(decimation) || decimation < 1) {
    throw new RangeError(`decimation must be integer >= 1, got ${decimation}`);
  }

  const begin = request.begin;
  const end = request.end;
  if (end < begin) throw new RangeError('DDC end < begin');

  const totalSamplesInBuffer = BigInt(iqInterleaved.length / 2);
  const span = end - begin;
  if (span > totalSamplesInBuffer) {
    throw new RangeError(
      `DDC range ${sampleIndexToDecimal(begin)}..${sampleIndexToDecimal(end)} exceeds buffer samples ${sampleIndexToDecimal(totalSamplesInBuffer)}`,
    );
  }
  const nSamples = Number(span);
  if (!Number.isSafeInteger(nSamples)) {
    throw new RangeError('DDC span exceeds Number.MAX_SAFE_INTEGER');
  }

  // Slice view: buffer holds samples starting at `begin` (caller slices).
  const input =
    iqInterleaved.length === nSamples * 2
      ? iqInterleaved
      : iqInterleaved.subarray(0, nSamples * 2);

  const beginIndex = Number(begin);
  if (!Number.isSafeInteger(beginIndex)) {
    throw new RangeError('DDC begin exceeds Number.MAX_SAFE_INTEGER (phase uses Number)');
  }

  throwIfAborted(request.signal);
  if (request.signal) await yieldForAbort();
  const mixed = mixDownLo(input, { beginIndex, loHz, sampleRateHz });

  throwIfAborted(request.signal);
  if (request.signal) await yieldForAbort();
  const taps = request.firTaps ?? defaultDdcFirTaps(interpolation, decimation);
  const filtered = applyFirComplex(mixed, taps);

  throwIfAborted(request.signal);
  if (request.signal) await yieldForAbort();
  // FIR already anti-aliased at input rate. Pure decimation (L===1) only keeps
  // every M-th sample. When L>1, rationalResample still applies anti-image FIR
  // after zero-insertion (skipFilter false).
  const resampled = rationalResampleIq({
    iqInterleaved: filtered,
    interpolation,
    decimation,
    skipFilter: interpolation === 1,
  });

  const nOut = resampled.length / 2;
  return {
    begin: 0n,
    end: BigInt(nOut),
    outputSampleRateHz: outputSampleRateHz(sampleRateHz, interpolation, decimation),
    samples: resampled,
  };
}

export class ReferenceDdcEngine implements DdcEngine {
  async process(request: DdcRequest, iqInterleaved: Float32Array): Promise<DdcResult> {
    return computeDdc(request, iqInterleaved);
  }
}
