import { isPowerOfTwo } from '../fft.js';
import {
  loadWasmFftModule,
  type DspFftModule,
} from './loadDspFft.js';

export { isWasmFftAvailable, loadWasmFftModule } from './loadDspFft.js';

/**
 * Thin wrapper: in-place radix-2 FFT via WASM (float64 interleaved), same
 * contract as {@link import('../fft.js').fftRadix2}.
 *
 * Module must already be loaded (call {@link loadWasmFftModule} / ensureWasmFft).
 */
export class WasmFftEngine {
  constructor(private readonly mod: DspFftModule) {}

  fftRadix2(interleaved: Float64Array, inverse = false): void {
    wasmFftRadix2WithModule(this.mod, interleaved, inverse);
  }
}

export async function ensureWasmFft(): Promise<WasmFftEngine> {
  const mod = await loadWasmFftModule();
  return new WasmFftEngine(mod);
}

/** Mutating WASM FFT — mirrors JS `fftRadix2`. Loads module on first call. */
export async function wasmFftRadix2(interleaved: Float64Array, inverse = false): Promise<void> {
  const mod = await loadWasmFftModule();
  wasmFftRadix2WithModule(mod, interleaved, inverse);
}

export function wasmFftRadix2WithModule(
  mod: DspFftModule,
  interleaved: Float64Array,
  inverse = false,
): void {
  const nComplex = interleaved.length / 2;
  if (!isPowerOfTwo(nComplex)) {
    throw new RangeError(`FFT length must be power of two, got ${nComplex}`);
  }
  if (interleaved.length !== nComplex * 2) {
    throw new RangeError('interleaved buffer length must be 2 * n');
  }

  const bytes = interleaved.length * Float64Array.BYTES_PER_ELEMENT;
  const ptr = mod._malloc(bytes);
  if (!ptr) throw new Error('WASM malloc failed');
  try {
    // ptr is byte offset; HEAPF64 index is ptr/8
    const offset = ptr / Float64Array.BYTES_PER_ELEMENT;
    mod.HEAPF64.set(interleaved, offset);
    mod._fft_radix2(ptr, nComplex, inverse ? 1 : 0);
    interleaved.set(mod.HEAPF64.subarray(offset, offset + interleaved.length));
  } finally {
    mod._free(ptr);
  }
}
