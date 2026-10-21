declare module '*dsp_fft.js' {
  export interface DspFftGlueModule {
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
  export default function createDspFftModule(arg?: {
    locateFile?: (path: string, prefix: string) => string;
  }): Promise<DspFftGlueModule>;
}
