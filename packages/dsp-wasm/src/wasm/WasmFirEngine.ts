/**
 * WASM complex FIR + rational resample + LO mix (M-07).
 * dtype: float64 kernels; public API accepts Float32|Float64 IQ and returns Float32
 * (same contract as JS applyFirComplex / rationalResampleIq / mixDownLo).
 */
import {
  loadWasmFftModule,
  type DspFftModule,
} from './loadDspFft.js';
import { designLowpassFir } from '../fir.js';

function toF64(iq: Float32Array | Float64Array): Float64Array {
  return iq instanceof Float64Array ? iq : Float64Array.from(iq);
}

function toF32(iq: Float64Array): Float32Array {
  return Float32Array.from(iq);
}

function heapOffset(ptr: number): number {
  return ptr / Float64Array.BYTES_PER_ELEMENT;
}

export class WasmFirEngine {
  constructor(private readonly mod: DspFftModule) {}

  applyFirComplex(
    iqInterleaved: Float32Array | Float64Array,
    taps: Float64Array,
  ): Float32Array {
    return wasmApplyFirComplexWithModule(this.mod, iqInterleaved, taps);
  }

  rationalResampleIq(options: {
    iqInterleaved: Float32Array | Float64Array;
    interpolation: number;
    decimation: number;
    firTaps?: Float64Array;
    skipFilter?: boolean;
  }): Float32Array {
    return wasmRationalResampleIqWithModule(this.mod, options);
  }

  mixDownLo(
    iqInterleaved: Float32Array | Float64Array,
    options: { beginIndex: number; loHz: number; sampleRateHz: number },
  ): Float32Array {
    return wasmMixDownLoWithModule(this.mod, iqInterleaved, options);
  }
}

export async function ensureWasmFir(): Promise<WasmFirEngine> {
  const mod = await loadWasmFftModule();
  return new WasmFirEngine(mod);
}

/** Alias matching deliverable naming. */
export const WasmRationalResample = WasmFirEngine;

export async function wasmApplyFirComplex(
  iqInterleaved: Float32Array | Float64Array,
  taps: Float64Array,
): Promise<Float32Array> {
  const mod = await loadWasmFftModule();
  return wasmApplyFirComplexWithModule(mod, iqInterleaved, taps);
}

export function wasmApplyFirComplexWithModule(
  mod: DspFftModule,
  iqInterleaved: Float32Array | Float64Array,
  taps: Float64Array,
): Float32Array {
  const nSamples = iqInterleaved.length / 2;
  if (!Number.isInteger(nSamples)) {
    throw new RangeError('iqInterleaved length must be even');
  }
  if (taps.length < 1) throw new RangeError('FIR taps empty');

  const iq = toF64(iqInterleaved);
  const iqBytes = iq.length * 8;
  const tapsBytes = taps.length * 8;
  const outBytes = iqBytes;

  const iqPtr = mod._malloc(iqBytes);
  const tapsPtr = mod._malloc(tapsBytes);
  const outPtr = mod._malloc(outBytes);
  if (!iqPtr || !tapsPtr || !outPtr) {
    if (iqPtr) mod._free(iqPtr);
    if (tapsPtr) mod._free(tapsPtr);
    if (outPtr) mod._free(outPtr);
    throw new Error('WASM malloc failed');
  }
  try {
    mod.HEAPF64.set(iq, heapOffset(iqPtr));
    mod.HEAPF64.set(taps, heapOffset(tapsPtr));
    mod._apply_fir_complex(iqPtr, nSamples, tapsPtr, taps.length, outPtr);
    const out = new Float64Array(
      mod.HEAPF64.subarray(heapOffset(outPtr), heapOffset(outPtr) + iq.length),
    );
    return toF32(out);
  } finally {
    mod._free(iqPtr);
    mod._free(tapsPtr);
    mod._free(outPtr);
  }
}

export async function wasmRationalResampleIq(options: {
  iqInterleaved: Float32Array | Float64Array;
  interpolation: number;
  decimation: number;
  firTaps?: Float64Array;
  skipFilter?: boolean;
}): Promise<Float32Array> {
  const mod = await loadWasmFftModule();
  return wasmRationalResampleIqWithModule(mod, options);
}

export function wasmRationalResampleIqWithModule(
  mod: DspFftModule,
  options: {
    iqInterleaved: Float32Array | Float64Array;
    interpolation: number;
    decimation: number;
    firTaps?: Float64Array;
    skipFilter?: boolean;
  },
): Float32Array {
  const L = options.interpolation;
  const M = options.decimation;
  if (!Number.isInteger(L) || L < 1) {
    throw new RangeError(`interpolation must be integer >= 1, got ${L}`);
  }
  if (!Number.isInteger(M) || M < 1) {
    throw new RangeError(`decimation must be integer >= 1, got ${M}`);
  }
  const nIn = options.iqInterleaved.length / 2;
  if (!Number.isInteger(nIn)) {
    throw new RangeError('iqInterleaved length must be even');
  }

  let taps = options.firTaps;
  const skipFilter = options.skipFilter === true;
  if (L > 1 && !skipFilter && !taps) {
    const base = designLowpassFir({ numTaps: 63, cutoffNyquist: 0.45 / L });
    taps = new Float64Array(base.length);
    for (let i = 0; i < base.length; i++) taps[i] = base[i]! * L;
  }

  const iq = toF64(options.iqInterleaved);
  const nOutCap = Math.floor((nIn * L) / M);
  const iqBytes = iq.length * 8;
  const outBytes = Math.max(nOutCap, 1) * 2 * 8;
  const tapsBytes = taps && taps.length ? taps.length * 8 : 0;

  const iqPtr = mod._malloc(iqBytes);
  const outPtr = mod._malloc(outBytes);
  const tapsPtr = tapsBytes ? mod._malloc(tapsBytes) : 0;
  if (!iqPtr || !outPtr || (tapsBytes && !tapsPtr)) {
    if (iqPtr) mod._free(iqPtr);
    if (outPtr) mod._free(outPtr);
    if (tapsPtr) mod._free(tapsPtr);
    throw new Error('WASM malloc failed');
  }
  try {
    mod.HEAPF64.set(iq, heapOffset(iqPtr));
    if (taps && tapsPtr) mod.HEAPF64.set(taps, heapOffset(tapsPtr));
    const nOut = mod._rational_resample_iq(
      iqPtr,
      nIn,
      L,
      M,
      tapsPtr,
      taps?.length ?? 0,
      skipFilter ? 1 : 0,
      outPtr,
      nOutCap,
    );
    if (nOut < 0) throw new Error('WASM rational_resample_iq failed');
    const out = new Float64Array(
      mod.HEAPF64.subarray(heapOffset(outPtr), heapOffset(outPtr) + nOut * 2),
    );
    return toF32(out);
  } finally {
    mod._free(iqPtr);
    mod._free(outPtr);
    if (tapsPtr) mod._free(tapsPtr);
  }
}

export async function wasmMixDownLo(
  iqInterleaved: Float32Array | Float64Array,
  options: { beginIndex: number; loHz: number; sampleRateHz: number },
): Promise<Float32Array> {
  const mod = await loadWasmFftModule();
  return wasmMixDownLoWithModule(mod, iqInterleaved, options);
}

export function wasmMixDownLoWithModule(
  mod: DspFftModule,
  iqInterleaved: Float32Array | Float64Array,
  options: { beginIndex: number; loHz: number; sampleRateHz: number },
): Float32Array {
  const nSamples = iqInterleaved.length / 2;
  if (!Number.isInteger(nSamples)) {
    throw new RangeError('iqInterleaved length must be even');
  }
  const iq = toF64(iqInterleaved);
  const bytes = iq.length * 8;
  const inPtr = mod._malloc(bytes);
  const outPtr = mod._malloc(bytes);
  if (!inPtr || !outPtr) {
    if (inPtr) mod._free(inPtr);
    if (outPtr) mod._free(outPtr);
    throw new Error('WASM malloc failed');
  }
  try {
    mod.HEAPF64.set(iq, heapOffset(inPtr));
    mod._mix_down_lo(
      inPtr,
      nSamples,
      options.beginIndex,
      options.loHz,
      options.sampleRateHz,
      outPtr,
    );
    const out = new Float64Array(
      mod.HEAPF64.subarray(heapOffset(outPtr), heapOffset(outPtr) + iq.length),
    );
    return toF32(out);
  } finally {
    mod._free(inPtr);
    mod._free(outPtr);
  }
}
