/**
 * Browser Worker backend for DspWorkerClient.
 * Uses Vite-friendly `new Worker(new URL('./dsp-worker.ts', import.meta.url), { type: 'module' })`.
 * Throws a clear error when `Worker` is unavailable (Node/jsdom without polyfill).
 */

import type { WorkerBackend } from './backends.js';
import type { DspWorkerRequest, DspWorkerResponse } from './protocol.js';

export type BrowserWorkerCtor = new (
  scriptURL: string | URL,
  options?: { type?: 'classic' | 'module'; name?: string },
) => Worker;

function resolveWorkerGlobal(): BrowserWorkerCtor {
  const W = (globalThis as { Worker?: BrowserWorkerCtor }).Worker;
  if (typeof W !== 'function') {
    throw new Error(
      'BrowserWorkerBackend requires globalThis.Worker (run in a browser, or provide a Worker polyfill). Not available under plain Node/jsdom.',
    );
  }
  return W;
}

export interface BrowserWorkerBackendOptions {
  /** Override worker script URL (defaults to ./dsp-worker.ts next to this module). */
  workerUrl?: URL | string;
  /** Inject Worker constructor (tests). */
  WorkerCtor?: BrowserWorkerCtor;
}

export class BrowserWorkerBackend implements WorkerBackend {
  private readonly worker: Worker;
  private messageHandler: ((response: DspWorkerResponse) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private terminated = false;

  constructor(options: BrowserWorkerBackendOptions = {}) {
    const WorkerCtor = options.WorkerCtor ?? resolveWorkerGlobal();
    const url =
      options.workerUrl ?? new URL('./dsp-worker.ts', import.meta.url);
    this.worker = new WorkerCtor(url, { type: 'module' });
    this.worker.onmessage = (ev: MessageEvent<DspWorkerResponse>) => {
      if (this.terminated) return;
      this.messageHandler?.(ev.data);
    };
    this.worker.onerror = (ev: ErrorEvent) => {
      const err = ev.error instanceof Error ? ev.error : new Error(ev.message || 'Worker error');
      this.errorHandler?.(err);
    };
    this.worker.onmessageerror = () => {
      this.errorHandler?.(new Error('BrowserWorkerBackend message deserialization failed'));
    };
  }

  post(message: DspWorkerRequest, transfer?: ArrayBuffer[]): void {
    if (this.terminated) return;
    if (transfer && transfer.length > 0) {
      this.worker.postMessage(message, transfer);
    } else {
      this.worker.postMessage(message);
    }
  }

  onMessage(handler: (response: DspWorkerResponse) => void): void {
    this.messageHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }

  terminate(): void {
    if (this.terminated) return;
    this.terminated = true;
    this.worker.terminate();
  }
}

/** Create a DspWorkerClient backed by a browser module Worker (AbortSignal cancel via protocol). */
export function createBrowserWorkerBackend(
  options?: BrowserWorkerBackendOptions,
): BrowserWorkerBackend {
  return new BrowserWorkerBackend(options);
}
