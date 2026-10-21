import type { PsdRequest, PsdResult } from '@wss/contracts';
import type { PsdEngine } from '../interfaces.js';
import { computePsd, type FftRadix2Fn } from '../psd.js';
import { loadWasmFftModule } from './loadDspFft.js';
import { wasmFftRadix2WithModule } from './WasmFftEngine.js';

/**
 * PSD engine that runs the same Welch / window path as ReferencePsdEngine,
 * but replaces the FFT kernel with the Emscripten WASM port.
 */
export class WasmReferencePsdEngine implements PsdEngine {
  async analyze(request: PsdRequest, iqInterleaved: Float32Array): Promise<PsdResult> {
    const mod = await loadWasmFftModule();
    const fft: FftRadix2Fn = (buf, inverse = false) => {
      wasmFftRadix2WithModule(mod, buf, inverse);
    };
    return computePsd(request, iqInterleaved, fft);
  }
}

/** Helper: run PSD with an arbitrary in-place FFT implementation. */
export async function computePsdWithFft(
  request: PsdRequest,
  iqInterleaved: Float32Array,
  fft: FftRadix2Fn,
): Promise<PsdResult> {
  return computePsd(request, iqInterleaved, fft);
}
