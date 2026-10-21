/**
 * Pure DSP worker handler — shared by browser Worker entry, Node worker_threads,
 * and the in-process JobRunner. Cancel is tracked by jobId via AbortController.
 *
 * Package C: optional FFT engine ('js' | 'wasm-fft') for PSD/STFT via configure.
 * Default remains JS fftRadix2. WASM load failure falls back to JS (no hang).
 */

import type { DdcRequest, PsdRequest, StftRequest, SampleIndex } from '@wss/contracts';
import { sampleIndexFromDecimal, sampleIndexToDecimal } from '@wss/contracts';
import { computePsd, type FftRadix2Fn } from '../psd.js';
import { computeStft } from '../stft.js';
import { computeDdc } from '../ddc.js';
import type {
  DspWorkerRequest,
  DspWorkerResponse,
  DdcParamsWire,
  PsdParamsWire,
  StftParamsWire,
  PsdResultWire,
  StftResultWire,
  DdcResultWire,
  DspFftEngineKind,
} from './protocol.js';

export interface CancelRegistry {
  /** Register a controller for an in-flight job. */
  register(jobId: string, controller: AbortController): void;
  /** Abort + drop a job. Returns true if it was registered. */
  cancel(jobId: string): boolean;
  /** Drop without aborting (job finished). */
  unregister(jobId: string): void;
  getSignal(jobId: string): AbortSignal | undefined;
}

export function createCancelRegistry(): CancelRegistry {
  const map = new Map<string, AbortController>();
  const cancelled = new Set<string>();
  return {
    register(jobId, controller) {
      map.set(jobId, controller);
      if (cancelled.has(jobId)) {
        controller.abort();
      }
    },
    cancel(jobId) {
      cancelled.add(jobId);
      const c = map.get(jobId);
      if (c) {
        if (!c.signal.aborted) c.abort();
        map.delete(jobId);
        return true;
      }
      return true; // sticky: cancel before register still counts
    },
    unregister(jobId) {
      map.delete(jobId);
      cancelled.delete(jobId);
    },
    getSignal(jobId) {
      return map.get(jobId)?.signal;
    },
  };
}

/** Per-handler FFT engine state (one registry+engine per Worker / InProcess backend). */
export interface DspWorkerHandlerState {
  /** Active FFT for PSD/STFT; undefined ⇒ JS default inside compute*. */
  fft?: FftRadix2Fn;
  engine: DspFftEngineKind;
}

export function createHandlerState(): DspWorkerHandlerState {
  return { engine: 'js', fft: undefined };
}

function abortError(message = 'Aborted'): Error {
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof Error && err.name === 'AbortError') ||
    (typeof DOMException !== 'undefined' &&
      err instanceof DOMException &&
      err.name === 'AbortError')
  );
}

function parseBeginEnd(params: { begin: string; end: string }): {
  begin: SampleIndex;
  end: SampleIndex;
} {
  return {
    begin: sampleIndexFromDecimal(params.begin) as SampleIndex,
    end: sampleIndexFromDecimal(params.end) as SampleIndex,
  };
}

function toPsdRequest(params: PsdParamsWire, signal: AbortSignal): PsdRequest {
  const { begin, end } = parseBeginEnd(params);
  return {
    begin,
    end,
    fftSize: params.fftSize,
    window: params.window,
    overlap: params.overlap,
    sampleRateHz: params.sampleRateHz,
    signal,
  };
}

function toStftRequest(params: StftParamsWire, signal: AbortSignal): StftRequest {
  const { begin, end } = parseBeginEnd(params);
  return {
    begin,
    end,
    fftSize: params.fftSize,
    hopSize: params.hopSize,
    window: params.window,
    sampleRateHz: params.sampleRateHz,
    method: params.method,
    segmentMilliseconds: params.segmentMilliseconds,
    bandwidthHz: params.bandwidthHz,
    analysisPoints: params.analysisPoints,
    kaiserBeta: params.kaiserBeta,
    removeMean: params.removeMean,
    signal,
  };
}

function toDdcRequest(params: DdcParamsWire, signal: AbortSignal): DdcRequest {
  const { begin, end } = parseBeginEnd(params);
  let firTaps: Float64Array | undefined;
  if (params.firTapsBuffer) {
    firTaps = new Float64Array(params.firTapsBuffer);
  }
  return {
    begin,
    end,
    loHz: params.loHz,
    sampleRateHz: params.sampleRateHz,
    interpolation: params.interpolation,
    decimation: params.decimation,
    firTaps,
    signal,
  };
}

async function applyEngineConfigure(
  state: DspWorkerHandlerState,
  requested: DspFftEngineKind,
): Promise<{ engine: DspFftEngineKind; fellBackToJs?: boolean; message?: string }> {
  if (requested === 'js') {
    state.engine = 'js';
    state.fft = undefined;
    return { engine: 'js' };
  }

  // wasm-fft
  try {
    const { loadWasmFftModule } = await import('../wasm/loadDspFft.js');
    const { wasmFftRadix2WithModule } = await import('../wasm/WasmFftEngine.js');
    const mod = await loadWasmFftModule();
    state.fft = (buf, inverse = false) => {
      wasmFftRadix2WithModule(mod, buf, inverse);
    };
    state.engine = 'wasm-fft';
    return { engine: 'wasm-fft' };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    state.engine = 'js';
    state.fft = undefined;
    return {
      engine: 'js',
      fellBackToJs: true,
      message: `wasm-fft load failed, falling back to js: ${msg}`,
    };
  }
}

/**
 * Handle one worker message. For `cancel`, returns null (no response required
 * beyond the in-flight job eventually resolving as cancelled).
 * Callers that want an immediate cancel ack can still post cancelled when the
 * job rejects.
 *
 * @param state Optional shared engine state (Package C). When omitted, a
 *   throwaway JS-default state is used (backward compatible).
 */
export async function handleDspWorkerRequest(
  message: DspWorkerRequest,
  registry: CancelRegistry,
  state: DspWorkerHandlerState = createHandlerState(),
): Promise<DspWorkerResponse | null> {
  if (message.kind === 'cancel') {
    registry.cancel(message.jobId);
    return null;
  }

  if (message.kind === 'configure') {
    const result = await applyEngineConfigure(state, message.engine);
    return {
      kind: 'configured',
      jobId: message.jobId,
      engine: result.engine,
      fellBackToJs: result.fellBackToJs,
      message: result.message,
    };
  }

  const { jobId, kind } = message;
  const controller = new AbortController();
  registry.register(jobId, controller);

  try {
    if (controller.signal.aborted) throw abortError();

    const iq = new Float32Array(message.iqBuffer);
    const fft = state.fft; // undefined ⇒ JS default inside compute*

    if (kind === 'psd') {
      const result = await computePsd(toPsdRequest(message.params, controller.signal), iq, fft);
      if (controller.signal.aborted) throw abortError();
      const payload: PsdResultWire = {
        frequenciesHz: result.frequenciesHz.buffer.slice(
          result.frequenciesHz.byteOffset,
          result.frequenciesHz.byteOffset + result.frequenciesHz.byteLength,
        ) as ArrayBuffer,
        linearPower: result.linearPower.buffer.slice(
          result.linearPower.byteOffset,
          result.linearPower.byteOffset + result.linearPower.byteLength,
        ) as ArrayBuffer,
        fftSize: result.fftSize,
        sampleRateHz: result.sampleRateHz,
      };
      return { kind: 'result', jobId, op: 'psd', payload };
    }

    if (kind === 'stft') {
      const result = await computeStft(toStftRequest(message.params, controller.signal), iq, fft);
      if (controller.signal.aborted) throw abortError();
      const payload: StftResultWire = {
        frequenciesHz: result.frequenciesHz.buffer.slice(
          result.frequenciesHz.byteOffset,
          result.frequenciesHz.byteOffset + result.frequenciesHz.byteLength,
        ) as ArrayBuffer,
        frameCenters: result.frameCenters,
        linearPower: result.linearPower.buffer.slice(
          result.linearPower.byteOffset,
          result.linearPower.byteOffset + result.linearPower.byteLength,
        ) as ArrayBuffer,
        frameCount: result.frameCount,
        binCount: result.binCount,
      };
      return { kind: 'result', jobId, op: 'stft', payload };
    }

    // ddc
    const result = await computeDdc(toDdcRequest(message.params, controller.signal), iq);
    if (controller.signal.aborted) throw abortError();
    const payload: DdcResultWire = {
      begin: sampleIndexToDecimal(result.begin),
      end: sampleIndexToDecimal(result.end),
      outputSampleRateHz: result.outputSampleRateHz,
      samples: result.samples.buffer.slice(
        result.samples.byteOffset,
        result.samples.byteOffset + result.samples.byteLength,
      ) as ArrayBuffer,
    };
    return { kind: 'result', jobId, op: 'ddc', payload };
  } catch (err) {
    if (isAbortError(err) || controller.signal.aborted) {
      return { kind: 'cancelled', jobId };
    }
    const e = err instanceof Error ? err : new Error(String(err));
    return { kind: 'error', jobId, message: e.message, name: e.name };
  } finally {
    registry.unregister(jobId);
  }
}
