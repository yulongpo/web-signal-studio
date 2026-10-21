/**
 * DspWorkerClient 鈥?cancelable PSD / STFT / DDC over an injectable WorkerBackend.
 * Default backend is InProcessAsyncBackend (Node/vitest friendly).
 * Use createNodeDspWorkerClient() for a real worker_threads path.
 * Use createBrowserDspWorkerClient() for a browser module Worker path.
 */

import type {
  DdcRequest,
  DdcResult,
  PsdRequest,
  PsdResult,
  StftRequest,
  StftResult,
  SampleIndex,
} from '@wss/contracts';
import { sampleIndexFromDecimal, sampleIndexToDecimal } from '@wss/contracts';
import { InProcessAsyncBackend, type WorkerBackend } from './backends.js';
import {
  BrowserWorkerBackend,
  type BrowserWorkerBackendOptions,
} from './browser-backend.js';
import type {
  DdcResultWire,
  DspWorkerRequest,
  DspWorkerResponse,
  PsdResultWire,
  StftResultWire,
} from './protocol.js';

let jobSeq = 0;
function nextJobId(): string {
  jobSeq += 1;
  return `dsp-job-${jobSeq}-${Date.now().toString(36)}`;
}

function abortError(message = 'Aborted'): Error {
  if (typeof DOMException !== 'undefined') {
    try {
      return new DOMException(message, 'AbortError');
    } catch {
      /* fall through */
    }
  }
  const err = new Error(message);
  err.name = 'AbortError';
  return err;
}

function copyIqBuffer(iq: Float32Array): { buffer: ArrayBuffer; transfer: ArrayBuffer[] } {
  // Copy so the caller's view stays valid even when we transfer.
  const copy = iq.slice();
  const buffer = copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength) as ArrayBuffer;
  return { buffer, transfer: [buffer] };
}

export interface DspWorkerClientOptions {
  backend?: WorkerBackend;
}

export class DspWorkerClient {
  private readonly backend: WorkerBackend;
  private readonly pending = new Map<
    string,
    {
      resolve: (value: unknown) => void;
      reject: (err: Error) => void;
      op: 'psd' | 'stft' | 'ddc';
    }
  >();
  private closed = false;

  constructor(options: DspWorkerClientOptions = {}) {
    this.backend = options.backend ?? new InProcessAsyncBackend();
    this.backend.onMessage((response) => this.dispatch(response));
    this.backend.onError((err) => {
      for (const [, p] of this.pending) p.reject(err);
      this.pending.clear();
    });
  }

  async analyzePsd(
    request: PsdRequest,
    iqInterleaved: Float32Array,
    signal?: AbortSignal,
  ): Promise<PsdResult> {
    const merged = signal ?? request.signal;
    const { buffer, transfer } = copyIqBuffer(iqInterleaved);
    const msg: DspWorkerRequest = {
      kind: 'psd',
      jobId: nextJobId(),
      params: {
        begin: sampleIndexToDecimal(request.begin),
        end: sampleIndexToDecimal(request.end),
        fftSize: request.fftSize,
        window: request.window,
        overlap: request.overlap,
        sampleRateHz: request.sampleRateHz,
      },
      iqBuffer: buffer,
    };
    const wire = (await this.send(msg, transfer, merged, 'psd')) as PsdResultWire;
    return {
      frequenciesHz: new Float64Array(wire.frequenciesHz),
      linearPower: new Float32Array(wire.linearPower),
      fftSize: wire.fftSize,
      sampleRateHz: wire.sampleRateHz,
    };
  }

  async analyzeStft(
    request: StftRequest,
    iqInterleaved: Float32Array,
    signal?: AbortSignal,
  ): Promise<StftResult> {
    const merged = signal ?? request.signal;
    const { buffer, transfer } = copyIqBuffer(iqInterleaved);
    const msg: DspWorkerRequest = {
      kind: 'stft',
      jobId: nextJobId(),
      params: {
        begin: sampleIndexToDecimal(request.begin),
        end: sampleIndexToDecimal(request.end),
        fftSize: request.fftSize,
        hopSize: request.hopSize,
        window: request.window,
        sampleRateHz: request.sampleRateHz,
      },
      iqBuffer: buffer,
    };
    const wire = (await this.send(msg, transfer, merged, 'stft')) as StftResultWire;
    return {
      frequenciesHz: new Float64Array(wire.frequenciesHz),
      frameCenters: wire.frameCenters,
      linearPower: new Float32Array(wire.linearPower),
      frameCount: wire.frameCount,
      binCount: wire.binCount,
    };
  }

  async processDdc(
    request: DdcRequest,
    iqInterleaved: Float32Array,
    signal?: AbortSignal,
  ): Promise<DdcResult> {
    const merged = signal ?? request.signal;
    const { buffer, transfer } = copyIqBuffer(iqInterleaved);
    let firTapsBuffer: ArrayBuffer | undefined;
    if (request.firTaps) {
      const t = request.firTaps;
      firTapsBuffer = t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength) as ArrayBuffer;
      transfer.push(firTapsBuffer);
    }
    const msg: DspWorkerRequest = {
      kind: 'ddc',
      jobId: nextJobId(),
      params: {
        begin: sampleIndexToDecimal(request.begin),
        end: sampleIndexToDecimal(request.end),
        loHz: request.loHz,
        sampleRateHz: request.sampleRateHz,
        interpolation: request.interpolation,
        decimation: request.decimation,
        firTapsBuffer,
      },
      iqBuffer: buffer,
    };
    const wire = (await this.send(msg, transfer, merged, 'ddc')) as DdcResultWire;
    return {
      begin: sampleIndexFromDecimal(wire.begin) as SampleIndex,
      end: sampleIndexFromDecimal(wire.end) as SampleIndex,
      outputSampleRateHz: wire.outputSampleRateHz,
      samples: new Float32Array(wire.samples),
    };
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    for (const [, p] of this.pending) p.reject(abortError('DspWorkerClient closed'));
    this.pending.clear();
    await this.backend.terminate();
  }

  private send(
    message: Extract<DspWorkerRequest, { kind: 'psd' | 'stft' | 'ddc' }>,
    transfer: ArrayBuffer[],
    signal: AbortSignal | undefined,
    op: 'psd' | 'stft' | 'ddc',
  ): Promise<unknown> {
    if (this.closed) return Promise.reject(abortError('DspWorkerClient closed'));
    if (signal?.aborted) return Promise.reject(abortError());

    return new Promise((resolve, reject) => {
      const { jobId } = message;

      const onAbort = () => {
        this.backend.post({ kind: 'cancel', jobId });
        const pending = this.pending.get(jobId);
        if (pending) {
          this.pending.delete(jobId);
          pending.reject(abortError());
        }
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      this.pending.set(jobId, {
        op,
        resolve: (value) => {
          signal?.removeEventListener('abort', onAbort);
          resolve(value);
        },
        reject: (err) => {
          signal?.removeEventListener('abort', onAbort);
          reject(err);
        },
      });

      this.backend.post(message, transfer);
    });
  }

  private dispatch(response: DspWorkerResponse): void {
    const pending = this.pending.get(response.jobId);
    if (!pending) return;
    this.pending.delete(response.jobId);

    if (response.kind === 'result') {
      pending.resolve(response.payload);
      return;
    }
    if (response.kind === 'cancelled') {
      pending.reject(abortError());
      return;
    }
    const err = new Error(response.message);
    err.name = response.name || 'Error';
    pending.reject(err);
  }
}

/** Default in-process client (safe under vitest node env). */
export function createDspWorkerClient(options?: DspWorkerClientOptions): DspWorkerClient {
  return new DspWorkerClient(options);
}

/** Real worker_threads client (bundles handler via esbuild). Lazy-imports node-backend. */
export async function createNodeDspWorkerClient(): Promise<DspWorkerClient> {
  const { createNodeWorkerBackend } = await import('./node-backend.js');
  const backend = await createNodeWorkerBackend();
  return new DspWorkerClient({ backend });
}

/** Browser module Worker client (Vite: new URL('./dsp-worker.ts', import.meta.url)). */
export function createBrowserDspWorkerClient(
  options?: BrowserWorkerBackendOptions,
): DspWorkerClient {
  const backend = new BrowserWorkerBackend(options);
  return new DspWorkerClient({ backend });
}

