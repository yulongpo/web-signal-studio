/**
 * G09 D4: map live chart ViewState domains → physical time/freq spans.
 * Same axis assignment as MainChartHost.fullViewFor / visibleBandwidthHz
 * (STFT: X=time Y=freq; Waterfall: X=freq Y=time). Sizing/readout only.
 */
export type ChartModeForSpans = 'stft' | 'waterfall';

export type DomainLike = { min: number; max: number };

export type ViewLikeForSpans = {
  xDomain: DomainLike;
  yDomain: DomainLike;
};

export type PhysicalViewSpans = {
  timeSec: DomainLike;
  freqHz: DomainLike;
};

/** Invert fullViewFor: view axes → semantic time/freq. */
export function physicalSpansFromView(
  mode: ChartModeForSpans,
  view: ViewLikeForSpans,
): PhysicalViewSpans {
  if (mode === 'waterfall') {
    return {
      freqHz: { min: view.xDomain.min, max: view.xDomain.max },
      timeSec: { min: view.yDomain.min, max: view.yDomain.max },
    };
  }
  return {
    timeSec: { min: view.xDomain.min, max: view.xDomain.max },
    freqHz: { min: view.yDomain.min, max: view.yDomain.max },
  };
}

export function spanAbs(d: DomainLike): number {
  if (!Number.isFinite(d.min) || !Number.isFinite(d.max)) return NaN;
  return Math.abs(d.max - d.min);
}
