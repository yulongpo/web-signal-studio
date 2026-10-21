/**
 * Browser Worker entry (self.onmessage).
 * Node uses node-worker-entry.ts + worker_threads wrapping the same handler.
 */

import {
  createCancelRegistry,
  handleDspWorkerRequest,
} from './dsp-worker-handler.js';
import { collectTransferables, type DspWorkerRequest } from './protocol.js';

const registry = createCancelRegistry();

const workerScope = self as unknown as {
  onmessage: ((ev: MessageEvent<DspWorkerRequest>) => void) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};

workerScope.onmessage = (ev: MessageEvent<DspWorkerRequest>) => {
  void (async () => {
    const response = await handleDspWorkerRequest(ev.data, registry);
    if (!response) return;
    const transfer = collectTransferables(response);
    workerScope.postMessage(response, transfer);
  })();
};
