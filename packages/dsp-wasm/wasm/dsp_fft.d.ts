export interface DspFftGlueModule {
  HEAPF64: Float64Array;
  _malloc(bytes: number): number;
  _free(ptr: number): void;
  _fft_radix2(ptr: number, nComplex: number, inverse: number): void;
}
export default function createDspFftModule(arg?: {
  locateFile?: (path: string, prefix: string) => string;
}): Promise<DspFftGlueModule>;
