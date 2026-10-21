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


/** Result of desktop-equivalent analysis-length resolution (auto N/B or fixed ms). */
export interface AnalysisSamplesPlan {
  /** Window length in analysis-rate samples (desktop analysisSamples). */
  analysisSamples: number;
  /** Rate after optional power-of-two decimation (desktop analysisRateHz). */
  analysisRateHz: number;
  /** Product of ×2 stages while analysisRate/2 >= 2*bandwidth (desktop decimation). */
  decimation: number;
  decimationStages: number;
  /** bandwidthHz / points (desktop binHz). */
  binHz: number;
  /** True when segmentMilliseconds === 0 (desktop auto N/B). */
  autoNb: boolean;
}

/**
 * Desktop `makeSpectralAnalysisPlan` sample-count core (17471a6 spectral_analysis.cpp):
 * - binHz = bandwidthHz / points
 * - if segmentMilliseconds > 0: count = ceil(analysisRate * segmentMs / 1000)
 * - if segmentMilliseconds === 0 (auto N/B): count = ceil(analysisRate / binHz)
 * - optional decimation: while analysisRate/2 >= 2*bandwidth, halve rate / ×2 decimation
 *
 * Does not invent Multitaper/Burg. Pure sizing — callers still need a compute path.
 */
export function resolveAnalysisSamples(options: {
  sampleRateHz: number;
  bandwidthHz: number;
  /** Display / analysis bin count (desktop `points`); must be power of two in [32, 65536]. */
  points: number;
  /** 0 = auto N/B (desktop). */
  segmentMilliseconds: number;
}): AnalysisSamplesPlan {
  const { sampleRateHz, bandwidthHz, points, segmentMilliseconds } = options;
  if (!(sampleRateHz > 0) || !Number.isFinite(sampleRateHz)) {
    throw new RangeError(`resolveAnalysisSamples: invalid sampleRateHz ${sampleRateHz}`);
  }
  if (!(bandwidthHz > 0) || !Number.isFinite(bandwidthHz)) {
    throw new RangeError(`resolveAnalysisSamples: invalid bandwidthHz ${bandwidthHz}`);
  }
  if (
    !Number.isInteger(points) ||
    points < 32 ||
    points > 65536 ||
    (points & (points - 1)) !== 0
  ) {
    throw new RangeError(
      `resolveAnalysisSamples: points must be power of two in [32, 65536], got ${points}`,
    );
  }
  if (!Number.isFinite(segmentMilliseconds) || segmentMilliseconds < 0) {
    throw new RangeError(
      `resolveAnalysisSamples: invalid segmentMilliseconds ${segmentMilliseconds}`,
    );
  }

  let analysisRateHz = sampleRateHz;
  let decimation = 1;
  let decimationStages = 0;
  while (analysisRateHz / 2 >= 2 * bandwidthHz && decimationStages < 40) {
    analysisRateHz /= 2;
    decimation *= 2;
    decimationStages += 1;
  }
  const binHz = bandwidthHz / points;
  const autoNb = segmentMilliseconds === 0;
  const count = Math.ceil(
    autoNb
      ? analysisRateHz / binHz
      : (analysisRateHz * segmentMilliseconds) / 1000,
  );
  if (!Number.isFinite(count) || count < 1 || count > 262144) {
    throw new RangeError(
      `resolveAnalysisSamples: analysisSamples out of budget (${count}); shorten segment or widen band`,
    );
  }
  return {
    analysisSamples: count,
    analysisRateHz,
    decimation,
    decimationStages,
    binHz,
    autoNb,
  };
}

/**
 * Web FFT engines require power-of-two fftSize. Map desktop analysisSamples →
 * next power of two in [32, 65536]. Honest adaptation — not bit-identical to desktop
 * non-PoT window length.
 */
export function webFftSizeFromAnalysisSamples(analysisSamples: number): number {
  if (!(analysisSamples >= 1) || !Number.isFinite(analysisSamples)) {
    throw new RangeError(`webFftSizeFromAnalysisSamples: invalid ${analysisSamples}`);
  }
  let n = 1;
  const target = Math.ceil(analysisSamples);
  while (n < target) n *= 2;
  if (n < 32) n = 32;
  if (n > 65536) {
    throw new RangeError(
      `webFftSizeFromAnalysisSamples: ${analysisSamples} rounds above 65536`,
    );
  }
  return n;
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
   * - omitted / >0: framing uses `fftSize` samples; ms is publish metadata
   *   (when omitted, derive via {@link segmentMillisecondsFromFft}).
   * - === 0: desktop auto N/B — requires `bandwidthHz` + `analysisPoints`;
   *   compute path resolves analysisSamples via {@link resolveAnalysisSamples}
   *   and adapts fftSize via {@link webFftSizeFromAnalysisSamples}.
   *   Without those fields, compute throws (no silent fake auto).
   */
  segmentMilliseconds?: number;
  /**
   * Display bandwidth Hz for auto N/B (desktop frequency.upper-lower).
   * Required when `segmentMilliseconds === 0`.
   */
  bandwidthHz?: number;
  /**
   * Display/analysis bin count for auto N/B (desktop `points`, power of two).
   * Required when `segmentMilliseconds === 0`.
   */
  analysisPoints?: number;
  /**
   * Kaiser β when `window === 'kaiser'`. Default {@link DEFAULT_KAISER_BETA}.
   * Ignored for non-Kaiser windows.
   */
  kaiserBeta?: number;
  /**
   * Desktop `removeMean`: subtract complex mean of each frame's valid samples
   * before windowing. Default false.
   */
  removeMean?: boolean;
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
