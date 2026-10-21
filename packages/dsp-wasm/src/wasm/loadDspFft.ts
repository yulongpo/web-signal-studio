/**
 * Lazy-load the committed Emscripten MODULARIZE glue + dsp_fft.wasm.
 * Artifact path: packages/dsp-wasm/wasm/dsp_fft.{js,wasm}
 *
 * Module exports FFT (Package B) + FIR/resample/LO mix (M-07).
 */

export interface DspFftModule {
  HEAPF64: Float64Array;
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  _fft_radix2(ptr: number, nComplex: number, inverse: number): void;
  _apply_fir_complex(
    iqInPtr: number,
    nSamples: number,
    tapsPtr: number,
    nTaps: number,
    iqOutPtr: number,
  ): void;
  _rational_resample_iq(
    iqInPtr: number,
    nIn: number,
    L: number,
    M: number,
    firTapsPtr: number,
    nTaps: number,
    skipFilter: number,
    iqOutPtr: number,
    outCapSamples: number,
  ): number;
  _mix_down_lo(
    iqInPtr: number,
    nSamples: number,
    beginIndex: number,
    loHz: number,
    sampleRateHz: number,
    iqOutPtr: number,
  ): void;
}

type CreateDspFftModule = (arg?: {
  locateFile?: (path: string, prefix: string) => string;
}) => Promise<DspFftModule>;

let loadPromise: Promise<DspFftModule> | null = null;
let loadError: Error | null = null;
let loadedModule: DspFftModule | null = null;

/** True once a module load has succeeded (sync). Before first load, returns false. */
export function isWasmFftLoaded(): boolean {
  return loadedModule !== null;
}

/**
 * Artifact is committed; availability means the glue URL resolves.
 * Call loadWasmFftModule() to actually instantiate.
 */
export function isWasmFftAvailable(): boolean {
  try {
    void new URL('../../wasm/dsp_fft.wasm', import.meta.url);
    void new URL('../../wasm/dsp_fft.js', import.meta.url);
    return loadError === null;
  } catch {
    return false;
  }
}

function assertM07Exports(instance: DspFftModule): void {
  if (
    typeof instance._fft_radix2 !== 'function' ||
    typeof instance._malloc !== 'function' ||
    typeof instance._apply_fir_complex !== 'function' ||
    typeof instance._rational_resample_iq !== 'function' ||
    typeof instance._mix_down_lo !== 'function' ||
    !instance.HEAPF64
  ) {
    throw new Error('dsp_fft module missing required FFT/M-07 exports');
  }
}

export async function loadWasmFftModule(): Promise<DspFftModule> {
  if (loadError) throw loadError;
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const mod = (await import('../../wasm/dsp_fft.js')) as {
          default: CreateDspFftModule;
        };
        const create = mod.default;
        if (typeof create !== 'function') {
          throw new Error('dsp_fft.js did not export createDspFftModule');
        }
        const instance = await create({
          locateFile: (p: string) => new URL(`../../wasm/${p}`, import.meta.url).href,
        });
        assertM07Exports(instance);
        loadedModule = instance;
        return instance;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        loadError = err;
        loadPromise = null;
        loadedModule = null;
        throw err;
      }
    })();
  }
  return loadPromise;
}

/** Test helper: drop cached module (forces re-instantiate). */
export function resetWasmFftModuleForTests(): void {
  loadPromise = null;
  loadError = null;
  loadedModule = null;
}
