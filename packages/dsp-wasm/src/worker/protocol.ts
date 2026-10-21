/**
 * Wire protocol for DSP worker (browser Worker or Node worker_threads).
 * SampleIndex crosses the boundary as canonical decimal strings only.
 * IQ samples travel as transferable ArrayBuffer (Float32 interleaved I,Q).
 */

import type { SpectralWindowName } from '@wss/contracts';

export type DspWorkerOp = 'psd' | 'stft' | 'ddc';

/** FFT kernel used inside the worker for PSD/STFT. Default is JS. */
export type DspFftEngineKind = 'js' | 'wasm-fft';

export type DspWorkerRequestKind = DspWorkerOp | 'cancel' | 'configure';

export interface PsdParamsWire {
  begin: string;
  end: string;
  fftSize: number;
  window: SpectralWindowName;
  overlap: number;
  sampleRateHz: number;
}

export interface StftParamsWire {
  begin: string;
  end: string;
  fftSize: number;
  hopSize: number;
  window: SpectralWindowName;
  sampleRateHz: number;
}

export interface DdcParamsWire {
  begin: string;
  end: string;
  loHz: number;
  sampleRateHz: number;
  interpolation: number;
  decimation: number;
  /** Optional FIR taps as Float64 ArrayBuffer (byteLength = taps*8). */
  firTapsBuffer?: ArrayBuffer;
}

export interface DspWorkerPsdRequest {
  kind: 'psd';
  jobId: string;
  params: PsdParamsWire;
  /** Float32 interleaved IQ ArrayBuffer. */
  iqBuffer: ArrayBuffer;
}

export interface DspWorkerStftRequest {
  kind: 'stft';
  jobId: string;
  params: StftParamsWire;
  iqBuffer: ArrayBuffer;
}

export interface DspWorkerDdcRequest {
  kind: 'ddc';
  jobId: string;
  params: DdcParamsWire;
  iqBuffer: ArrayBuffer;
}

export interface DspWorkerCancelRequest {
  kind: 'cancel';
  jobId: string;
}

/** One-time / reconfigurable FFT engine selection (Package C). Default remains JS. */
export interface DspWorkerConfigureRequest {
  kind: 'configure';
  jobId: string;
  /** Requested engine; 'js' is default. 'wasm-fft' loads Package B WASM FFT. */
  engine: DspFftEngineKind;
}

export type DspWorkerRequest =
  | DspWorkerPsdRequest
  | DspWorkerStftRequest
  | DspWorkerDdcRequest
  | DspWorkerCancelRequest
  | DspWorkerConfigureRequest;

export interface PsdResultWire {
  frequenciesHz: ArrayBuffer; // Float64
  linearPower: ArrayBuffer; // Float32
  fftSize: number;
  sampleRateHz: number;
}

export interface StftResultWire {
  frequenciesHz: ArrayBuffer; // Float64
  frameCenters: string[];
  linearPower: ArrayBuffer; // Float32
  frameCount: number;
  binCount: number;
}

export interface DdcResultWire {
  begin: string;
  end: string;
  outputSampleRateHz: number;
  samples: ArrayBuffer; // Float32
}

export interface DspWorkerResultResponse {
  kind: 'result';
  jobId: string;
  op: DspWorkerOp;
  payload: PsdResultWire | StftResultWire | DdcResultWire;
}

export interface DspWorkerErrorResponse {
  kind: 'error';
  jobId: string;
  message: string;
  name: string;
}

export interface DspWorkerCancelledResponse {
  kind: 'cancelled';
  jobId: string;
}

export interface DspWorkerConfiguredResponse {
  kind: 'configured';
  jobId: string;
  /** Engine actually in use after configure (may be js if wasm load failed). */
  engine: DspFftEngineKind;
  /** True when wasm-fft was requested but JS was kept after load failure. */
  fellBackToJs?: boolean;
  message?: string;
}

export type DspWorkerResponse =
  | DspWorkerResultResponse
  | DspWorkerErrorResponse
  | DspWorkerCancelledResponse
  | DspWorkerConfiguredResponse;

/** Collect transferable ArrayBuffers from a response for postMessage. */
export function collectTransferables(response: DspWorkerResponse): ArrayBuffer[] {
  if (response.kind !== 'result') return [];
  const p = response.payload;
  if (response.op === 'psd') {
    const w = p as PsdResultWire;
    return [w.frequenciesHz, w.linearPower];
  }
  if (response.op === 'stft') {
    const w = p as StftResultWire;
    return [w.frequenciesHz, w.linearPower];
  }
  const w = p as DdcResultWire;
  return [w.samples];
}
