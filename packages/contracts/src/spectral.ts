import type { SampleIndex } from './sample-index.js';

export type SpectralWindowName =
  | 'rectangular'
  | 'hann'
  | 'hamming'
  | 'blackman'
  | 'blackman_harris'
  | 'flat_top'
  | 'kaiser';

/**
 * Desktop SpectralMethod (signal_studio_rebuild @ 17471a6 domain/project.h).
 * Web STFT implements only Welch-equivalent single-window framing.
 */
export type SpectralMethodName =
  | 'periodogram'
  | 'bartlett'
  | 'welch'
  | 'multitaper'
  | 'burg';

/** Only method the web STFT/worker path actually runs. */
export type StftSupportedMethod = 'welch';

export const STFT_SUPPORTED_METHODS: readonly StftSupportedMethod[] = ['welch'];

/**
 * Desktop STFT widget also offers Multitaper (DPSS); Periodogram/Bartlett/Burg
 * appear on the PSD widget only. None of these have a web compute path yet.
 */
export const STFT_BLOCKED_METHODS: readonly SpectralMethodName[] = [
  'periodogram',
  'bartlett',
  'multitaper',
  'burg',
];

/** Desktop SpectrumStatistic (PSD settings only). */
export type SpectrumStatisticName = 'mean' | 'maximum' | 'minimum';

/**
 * On desktop, SpectrumStatistic exists only on SpectralSettingsWidget(psd=true)
 * / PsdSettings. SpectrogramSettings has no statistic — STFT publish is NA.
 */
export const STFT_SPECTRUM_STATISTIC_STATUS = 'NA_PSD_ONLY' as const;

/** Matches desktop default and prior web Kaiser hardcode. */
export const DEFAULT_KAISER_BETA = 8.6;

/** Segment duration in ms from FFT length and sample rate (desktop segmentMilliseconds). */
export function segmentMillisecondsFromFft(
  fftSize: number,
  sampleRateHz: number,
): number {
  if (!(fftSize > 0) || !(sampleRateHz > 0) || !Number.isFinite(fftSize) || !Number.isFinite(sampleRateHz)) {
    return 0;
  }
  return (fftSize / sampleRateHz) * 1000;
}

export function isStftSupportedMethod(
  method: string | null | undefined,
): method is StftSupportedMethod {
  return method == null || method === 'welch';
}

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
  /**
   * Spectral method. Only `'welch'` is implemented (default when omitted).
   * Passing a BLOCKED method must throw — never silently fall back.
   */
  method?: StftSupportedMethod;
  /**
   * Observation segment length in ms (desktop `segmentMilliseconds`).
   * Web sizes the segment by `fftSize` samples; desktop auto N/B (0) is not implemented.
   * When omitted, derive via {@link segmentMillisecondsFromFft}.
   */
  segmentMilliseconds?: number;
  /**
   * Kaiser β when `window === 'kaiser'`. Default {@link DEFAULT_KAISER_BETA}.
   * Ignored for non-Kaiser windows.
   */
  kaiserBeta?: number;
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
