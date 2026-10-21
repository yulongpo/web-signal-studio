/**
 * BrowserWorkerBackend unit tests.
 * Real Worker construction is gated: under Node/jsdom without Worker, only the guard is asserted.
 */

import { describe, expect, it } from 'vitest';
import { BrowserWorkerBackend, createBrowserWorkerBackend } from './browser-backend.js';
import { createBrowserDspWorkerClient } from './dsp-client.js';

describe('BrowserWorkerBackend', () => {
  it('throws a clear error when Worker is unavailable', () => {
    const original = (globalThis as { Worker?: unknown }).Worker;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (globalThis as any).Worker;
      expect(() => new BrowserWorkerBackend()).toThrow(/requires globalThis\.Worker/i);
      expect(() => createBrowserWorkerBackend()).toThrow(/requires globalThis\.Worker/i);
      expect(() => createBrowserDspWorkerClient()).toThrow(/requires globalThis\.Worker/i);
    } finally {
      if (original !== undefined) {
        (globalThis as { Worker?: unknown }).Worker = original;
      }
    }
  });

  it('constructs with an injected WorkerCtor and terminates cleanly', () => {
    const posts: unknown[] = [];
    let terminated = false;
    class FakeWorker {
      onmessage: ((ev: MessageEvent) => void) | null = null;
      onerror: ((ev: ErrorEvent) => void) | null = null;
      onmessageerror: (() => void) | null = null;
      constructor(public scriptURL: string | URL, public options?: { type?: string }) {}
      postMessage(message: unknown): void {
        posts.push(message);
      }
      terminate(): void {
        terminated = true;
      }
    }
    const backend = new BrowserWorkerBackend({
      WorkerCtor: FakeWorker as unknown as new (
        scriptURL: string | URL,
        options?: { type?: 'classic' | 'module' },
      ) => Worker,
      workerUrl: 'blob:fake-dsp-worker',
    });
    backend.onMessage(() => undefined);
    backend.post({ kind: 'cancel', jobId: 'j1' });
    expect(posts).toHaveLength(1);
    backend.terminate();
    expect(terminated).toBe(true);
  });
});

describe.skipIf(typeof Worker === 'undefined')('BrowserWorkerBackend live Worker', () => {
  it('documents that a real browser Worker path needs a Worker-capable env', () => {
    // Under Vite browser / happy-dom with Worker: createBrowserDspWorkerClient() would work.
    expect(typeof Worker).toBe('function');
  });
});
