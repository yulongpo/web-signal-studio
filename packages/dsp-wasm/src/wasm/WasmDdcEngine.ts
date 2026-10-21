/**
 * WASM-backed reference DDC (M-07).
 * Same processing order as computeDdc / ReferenceDdcEngine:
 *   mix → FIR → rational resample (skipFilter when L===1).
 * Default engine remains JS ReferenceDdcEngine; this is optional.
 */
import type { DdcRequest, DdcResult } from '@wss/contracts';
import { sampleIndexToDecimal } from '@wss/contracts';
import type { DdcEngine } from '../interfaces.js';
import { defaultDdcFirTaps } from '../fir.js';
import { outputSampleRateHz } from '../rational-resample.js';
import { loadWasmFftModule, type DspFftModule } from './loadDspFft.js';
import {
  wasmApplyFirComplexWithModule,
  wasmMixDownLoWithModule,
  wasmRationalResampleIqWithModule,
} from './WasmFirEngine.js';

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const err = new Error('DDC aborted');
    err.name = 'AbortError';
    throw err;
  }
}

function yieldForAbort(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof setImmediate === 'function') setImmediate(resolve);
    else queueMicrotask(resolve);
  });
}

export async function computeDdcWithWasmModule(
  mod: DspFftModule,
  request: DdcRequest,
  iqInterleaved: Float32Array,
): Promise<DdcResult> {
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
  const mixed = wasmMixDownLoWithModule(mod, input, {
    beginIndex,
    loHz,
    sampleRateHz,
  });

  throwIfAborted(request.signal);
  if (request.signal) await yieldForAbort();
  const taps = request.firTaps ?? defaultDdcFirTaps(interpolation, decimation);
  const filtered = wasmApplyFirComplexWithModule(mod, mixed, taps);

  throwIfAborted(request.signal);
  if (request.signal) await yieldForAbort();
  const resampled = wasmRationalResampleIqWithModule(mod, {
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

/** Optional WASM reference DDC — JS ReferenceDdcEngine remains default. */
export class WasmReferenceDdcEngine implements DdcEngine {
  private modPromise: Promise<DspFftModule> | null = null;

  private load(): Promise<DspFftModule> {
    if (!this.modPromise) this.modPromise = loadWasmFftModule();
    return this.modPromise;
  }

  async process(request: DdcRequest, iqInterleaved: Float32Array): Promise<DdcResult> {
    const mod = await this.load();
    return computeDdcWithWasmModule(mod, request, iqInterleaved);
  }
}
