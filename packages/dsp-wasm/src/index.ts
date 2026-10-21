export {
  fftRadix2,
  powerSpectrum,
  binFrequencyHz,
  frequencyToBin,
  findPeakBins,
  isPowerOfTwo,
} from './fft.js';

export { makeWindow, windowCoherentGain, windowPowerSum } from './windows.js';

export { ReferencePsdEngine, computePsd, periodogram } from './psd.js';
export { ReferenceStftEngine, computeStft } from './stft.js';

export {
  designLowpassFir,
  defaultDdcCutoffNyquist,
  defaultDdcFirTaps,
  applyFirComplex,
} from './fir.js';
export { rationalResampleIq, outputSampleRateHz } from './rational-resample.js';
export { ReferenceDdcEngine, computeDdc, mixDownLo } from './ddc.js';

export type { PsdEngine, StftEngine, DdcEngine } from './interfaces.js';
export {
  NotImplementedPsdEngine,
  NotImplementedStftEngine,
  /** @deprecated Use ReferenceDdcEngine */
  NotImplementedDdcEngine,
} from './interfaces.js';

export {
  DspWorkerClient,
  createDspWorkerClient,
  createNodeDspWorkerClient,
  createBrowserDspWorkerClient,
} from './worker/dsp-client.js';
export type { DspWorkerClientOptions } from './worker/dsp-client.js';
export { InProcessAsyncBackend } from './worker/backends.js';
export type { WorkerBackend } from './worker/backends.js';
export type {
  DspWorkerRequest,
  DspWorkerResponse,
  DspWorkerOp,
} from './worker/protocol.js';

export {
  BrowserWorkerBackend,
  createBrowserWorkerBackend,
} from './worker/browser-backend.js';
export type { BrowserWorkerBackendOptions } from './worker/browser-backend.js';

/** Lazy re-export — avoids pulling node:worker_threads into browser bundles. */
export async function createNodeWorkerBackend(): Promise<
  import('./worker/node-backend.js').NodeWorkerBackend
> {
  const m = await import('./worker/node-backend.js');
  return m.createNodeWorkerBackend();
}
