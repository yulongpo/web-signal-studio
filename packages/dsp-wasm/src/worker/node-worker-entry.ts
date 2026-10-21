/**
 * Node worker_threads entry. Bundled to ESM by createNodeWorkerBackend (esbuild).
 */

import { parentPort } from 'node:worker_threads';
import {
  createCancelRegistry,
  handleDspWorkerRequest,
} from './dsp-worker-handler.js';
import { collectTransferables, type DspWorkerRequest } from './protocol.js';

if (!parentPort) {
  throw new Error('node-worker-entry must run inside worker_threads');
}

const registry = createCancelRegistry();

parentPort.on('message', (message: DspWorkerRequest) => {
  void (async () => {
    const response = await handleDspWorkerRequest(message, registry);
    if (!response) return;
    const transfer = collectTransferables(response);
    parentPort!.postMessage(response, transfer);
  })();
});
