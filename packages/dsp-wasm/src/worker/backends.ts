/**
 * Injectable backends for DspWorkerClient.
 * - InProcessAsyncBackend: default under Node/vitest; yields between jobs and honors AbortSignal.
 * - NodeWorkerBackend: real worker_threads (esbuild-bundled entry).
 */

import type { DspWorkerRequest, DspWorkerResponse } from './protocol.js';
import {
  createCancelRegistry,
  createHandlerState,
  handleDspWorkerRequest,
  type DspWorkerHandlerState,
} from './dsp-worker-handler.js';

export interface WorkerBackend {
  post(message: DspWorkerRequest, transfer?: ArrayBuffer[]): void;
  onMessage(handler: (response: DspWorkerResponse) => void): void;
  onError(handler: (err: Error) => void): void;
  terminate(): void | Promise<void>;
}

/**
 * In-process async queue that still leaves the calling stack
 * (await Promise.resolve / queueMicrotask) and checks cancel between jobs.
 * Cancel posts are applied immediately to the shared CancelRegistry.
 * Configure posts share the same handler state (Package C engine selection).
 */
export class InProcessAsyncBackend implements WorkerBackend {
  private readonly registry = createCancelRegistry();
  private readonly state: DspWorkerHandlerState = createHandlerState();
  private messageHandler: ((response: DspWorkerResponse) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private readonly queue: DspWorkerRequest[] = [];
  private pumping = false;
  private terminated = false;

  post(message: DspWorkerRequest): void {
    if (this.terminated) return;
    if (message.kind === 'cancel') {
      this.registry.cancel(message.jobId);
      return;
    }
    this.queue.push(message);
    void this.pump();
  }

  onMessage(handler: (response: DspWorkerResponse) => void): void {
    this.messageHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }

  terminate(): void {
    this.terminated = true;
    this.queue.length = 0;
  }

  private async pump(): Promise<void> {
    if (this.pumping) return;
    this.pumping = true;
    try {
      while (this.queue.length > 0 && !this.terminated) {
        const msg = this.queue.shift()!;
        // Yield so AbortSignal listeners / cancel posts can run.
        await new Promise<void>((r) => (typeof setImmediate === 'function' ? setImmediate(r) : queueMicrotask(r)));
        if (this.terminated) break;
        try {
          const response = await handleDspWorkerRequest(msg, this.registry, this.state);
          // Yield again before delivering — cancel mid-job surfaces here.
          await new Promise<void>((r) => (typeof setImmediate === 'function' ? setImmediate(r) : queueMicrotask(r)));
          if (response && this.messageHandler && !this.terminated) {
            this.messageHandler(response);
          }
        } catch (err) {
          this.errorHandler?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    } finally {
      this.pumping = false;
      if (this.queue.length > 0 && !this.terminated) void this.pump();
    }
  }
}
