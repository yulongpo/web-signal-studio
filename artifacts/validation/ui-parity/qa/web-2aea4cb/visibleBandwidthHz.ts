/**
 * A2 / G02: display bandwidth for desktop auto N/B (17471a6).
 *
 * Desktop `makeSpectralAnalysisPlan` uses
 * `bandwidth = view.frequency.upperHz - view.frequency.lowerHz`
 * (spectral_analysis.cpp). Web STFT auto path previously hardcoded fs.
 *
 * Charts host owns the live view; derive Hz span from the freq axis of the
 * current ViewState. Fallback = sampleRateHz when span is invalid.
 * Does not invent STFT-DDC / band-limited STFT — sizing input only.
 */
export type ChartModeForBandwidth = 'stft' | 'waterfall';

export type ViewLikeForBandwidth = {
  xDomain: { min: number; max: number };
  yDomain: { min: number; max: number };
};

/** STFT: frequency on Y; Waterfall: frequency on X (MainChartHost fullViewFor). */
export function freqDomainFromView(
  mode: ChartModeForBandwidth,
  view: ViewLikeForBandwidth,
): { min: number; max: number } {
  return mode === 'stft' ? view.yDomain : view.xDomain;
}

/**
 * Visible frequency span → bandwidthHz for resolveAnalysisSamples.
 * Clamps to (0, sampleRateHz] when sampleRateHz is known and positive.
 */
export function visibleBandwidthHz(
  mode: ChartModeForBandwidth,
  view: ViewLikeForBandwidth,
  sampleRateHz: number,
): number {
  const fallback =
    Number.isFinite(sampleRateHz) && sampleRateHz > 0 ? sampleRateHz : 1_000_000;
  const freq = freqDomainFromView(mode, view);
  const span = freq.max - freq.min;
  if (!Number.isFinite(span) || !(span > 0)) return fallback;
  return Math.min(span, fallback);
}
