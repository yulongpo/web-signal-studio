import type {
  DdcRequest,
  DdcResult,
  PsdRequest,
  PsdResult,
  StftRequest,
  StftResult,
} from '../../contracts/src/spectral.js';

/** PSD engine placeholder — full Welch/Bartlett ports land with WASM. */
export interface PsdEngine {
  analyze(request: PsdRequest, iqInterleaved: Float32Array): Promise<PsdResult>;
}

/** STFT / spectrogram placeholder. */
export interface StftEngine {
  analyze(request: StftRequest, iqInterleaved: Float32Array): Promise<StftResult>;
}

/** DDC + FIR + rational resample placeholder. */
export interface DdcEngine {
  process(request: DdcRequest, iqInterleaved: Float32Array): Promise<DdcResult>;
}

export class NotImplementedPsdEngine implements PsdEngine {
  async analyze(): Promise<PsdResult> {
    throw new Error('PsdEngine not implemented yet (Bot-D P2+); use fftRadix2 for unit kernels');
  }
}

export class NotImplementedStftEngine implements StftEngine {
  async analyze(): Promise<StftResult> {
    throw new Error('StftEngine not implemented yet (Bot-D P2+)');
  }
}

export class NotImplementedDdcEngine implements DdcEngine {
  async process(): Promise<DdcResult> {
    throw new Error('DdcEngine not implemented yet (Bot-D P2+)');
  }
}
