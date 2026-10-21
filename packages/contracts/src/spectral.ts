import type { SampleIndex } from './sample-index.js';

export type SpectralWindowName =
  | 'rectangular'
  | 'hann'
  | 'hamming'
  | 'blackman'
  | 'blackman_harris'
  | 'flat_top'
  | 'kaiser';

export interface PsdRequest {
  begin: SampleIndex;
  end: SampleIndex;
  fftSize: number;
  window: SpectralWindowName;
  overlap: number;
  sampleRateHz: number;
  signal?: AbortSignal;
}

export interface PsdResult {
  /** Frequency axis in Hz (baseband), length = fftSize (complex) or fftSize/2+1 (real). */
  frequenciesHz: Float64Array;
  /** Linear power spectral density (not dB). */
  linearPower: Float32Array;
  fftSize: number;
  sampleRateHz: number;
}

export interface StftRequest {
  begin: SampleIndex;
  end: SampleIndex;
  fftSize: number;
  hopSize: number;
  window: SpectralWindowName;
  sampleRateHz: number;
  signal?: AbortSignal;
}

export interface StftResult {
  frequenciesHz: Float64Array;
  /** Frame centers as sample indices (decimal strings for boundary safety). */
  frameCenters: string[];
  /** Row-major frames * bins linear power. */
  linearPower: Float32Array;
  frameCount: number;
  binCount: number;
}

export interface DdcRequest {
  begin: SampleIndex;
  end: SampleIndex;
  /** LO shift in Hz (baseband). */
  loHz: number;
  sampleRateHz: number;
  /** Rational resample: outputRate = sampleRate * interpolation / decimation */
  interpolation: number;
  decimation: number;
  firTaps?: Float64Array;
  signal?: AbortSignal;
}

export interface DdcResult {
  begin: SampleIndex;
  end: SampleIndex;
  outputSampleRateHz: number;
  samples: Float32Array; // interleaved IQ
}
