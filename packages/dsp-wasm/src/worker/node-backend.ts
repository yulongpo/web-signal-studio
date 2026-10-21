/**
 * Real Node worker_threads backend.
 * Bundles node-worker-entry.ts (+ deps) once via esbuild into os.tmpdir().
 */

import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
import type { WorkerBackend } from './backends.js';
import type { DspWorkerRequest, DspWorkerResponse } from './protocol.js';

const ENTRY = fileURLToPath(new URL('./node-worker-entry.ts', import.meta.url));
const CONTRACTS = fileURLToPath(
  new URL('../../../contracts/src/index.ts', import.meta.url),
);

let bundlePromise: Promise<string> | null = null;

async function ensureWorkerBundle(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const hash = createHash('sha1').update(ENTRY).update(String(existsSync(ENTRY))).digest('hex').slice(0, 12);
      const outfile = path.join(tmpdir(), `wss-dsp-node-worker-${hash}.mjs`);
      // Always rebuild — sources change during development; tmp path is cheap.
      const esbuild = await import('esbuild');
      await esbuild.build({
        entryPoints: [ENTRY],
        bundle: true,
        platform: 'node',
        format: 'esm',
        outfile,
        target: 'node20',
        // Workspace packages are TypeScript with .js import specifiers.
        alias: {
          '@wss/contracts': CONTRACTS,
        },
        logLevel: 'silent',
      });
      return outfile;
    })();
  }
  return bundlePromise;
}

/** Reset cached bundle path (tests). */
export function resetNodeWorkerBundleCache(): void {
  bundlePromise = null;
}

export class NodeWorkerBackend implements WorkerBackend {
  private worker: Worker | null = null;
  private messageHandler: ((response: DspWorkerResponse) => void) | null = null;
  private errorHandler: ((err: Error) => void) | null = null;
  private readonly ready: Promise<void>;

  constructor() {
    this.ready = this.start();
  }

  /** Resolves when the worker thread is listening. */
  waitUntilReady(): Promise<void> {
    return this.ready;
  }

  private async start(): Promise<void> {
    const bundled = await ensureWorkerBundle();
    this.worker = new Worker(bundled);
    this.worker.on('message', (msg: DspWorkerResponse) => {
      this.messageHandler?.(msg);
    });
    this.worker.on('error', (err) => {
      this.errorHandler?.(err);
    });
  }

  post(message: DspWorkerRequest, transfer?: ArrayBuffer[]): void {
    void this.ready.then(() => {
      if (!this.worker) return;
      if (transfer && transfer.length > 0) {
        this.worker.postMessage(message, transfer);
      } else {
        this.worker.postMessage(message);
      }
    });
  }

  onMessage(handler: (response: DspWorkerResponse) => void): void {
    this.messageHandler = handler;
  }

  onError(handler: (err: Error) => void): void {
    this.errorHandler = handler;
  }

  async terminate(): Promise<void> {
    await this.ready.catch(() => undefined);
    await this.worker?.terminate();
    this.worker = null;
  }
}

export async function createNodeWorkerBackend(): Promise<NodeWorkerBackend> {
  const backend = new NodeWorkerBackend();
  await backend.waitUntilReady();
  return backend;
}
