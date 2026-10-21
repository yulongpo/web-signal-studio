import type {
  DdcRequest,
  DdcResult,
  PsdRequest,
  PsdResult,
  StftRequest,
  StftResult,
} from '@wss/contracts';

/** PSD engine — reference Welch periodogram lives in psd.ts. */
export interface PsdEngine {
  analyze(request: PsdRequest, iqInterleaved: Float32Array): Promise<PsdResult>;
}

/** STFT / spectrogram engine — reference hop STFT lives in stft.ts. */
export interface StftEngine {
  analyze(request: StftRequest, iqInterleaved: Float32Array): Promise<StftResult>;
}

/** DDC + FIR + rational resample — reference implementation in ddc.ts. */
export interface DdcEngine {
  process(request: DdcRequest, iqInterleaved: Float32Array): Promise<DdcResult>;
}

/** @deprecated Prefer ReferencePsdEngine from './psd.js'. */
export class NotImplementedPsdEngine implements PsdEngine {
  async analyze(): Promise<PsdResult> {
    throw new Error(
      'NotImplementedPsdEngine: use ReferencePsdEngine from @wss/dsp-wasm (psd.ts)',
    );
  }
}

/** @deprecated Prefer ReferenceStftEngine from './stft.js'. */
export class NotImplementedStftEngine implements StftEngine {
  async analyze(): Promise<StftResult> {
    throw new Error(
      'NotImplementedStftEngine: use ReferenceStftEngine from @wss/dsp-wasm (stft.ts)',
    );
  }
}

/**
 * @deprecated Prefer ReferenceDdcEngine from './ddc.js'.
 * Kept as a loud stub so old imports fail closed.
 */
export class NotImplementedDdcEngine implements DdcEngine {
  async process(): Promise<DdcResult> {
    throw new Error(
      'NotImplementedDdcEngine: use ReferenceDdcEngine from @wss/dsp-wasm (ddc.ts)',
    );
  }
}
