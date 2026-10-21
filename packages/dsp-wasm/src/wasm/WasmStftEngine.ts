import type { StftRequest, StftResult } from '@wss/contracts';
import type { StftEngine } from '../interfaces.js';
import { computeStft, type FftRadix2Fn } from '../stft.js';
import { loadWasmFftModule } from './loadDspFft.js';
import { wasmFftRadix2WithModule } from './WasmFftEngine.js';

/**
 * STFT engine that runs the same hop / window path as ReferenceStftEngine,
 * but replaces the FFT kernel with the Emscripten WASM port (Package C).
 */
export class WasmReferenceStftEngine implements StftEngine {
  async analyze(request: StftRequest, iqInterleaved: Float32Array): Promise<StftResult> {
    const mod = await loadWasmFftModule();
    const fft: FftRadix2Fn = (buf, inverse = false) => {
      wasmFftRadix2WithModule(mod, buf, inverse);
    };
    return computeStft(request, iqInterleaved, fft);
  }
}

/** Helper: run STFT with an arbitrary in-place FFT implementation. */
export async function computeStftWithFft(
  request: StftRequest,
  iqInterleaved: Float32Array,
  fft: FftRadix2Fn,
): Promise<StftResult> {
  return computeStft(request, iqInterleaved, fft);
}
