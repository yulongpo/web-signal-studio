/**
 * Chart gesture helpers shared by the main host and unit tests.
 * Sample indexes stay decimal strings. Mapping matches HeatmapCanvas margins.
 */
import { HEATMAP_PLOT_MARGIN } from '@wss/charts/react/plotMargin';

export const VIEW_HISTORY_LIMIT = 40;
export const PLOT_MARGIN = HEATMAP_PLOT_MARGIN;

export function pushCapped<T>(stack: readonly T[], item: T, limit = VIEW_HISTORY_LIMIT): T[] {
  const next = stack.concat([item]);
  return next.length > limit ? next.slice(next.length - limit) : next;
}

/** Map a chart time to a decimal sample index. Refuses non-safe integers. */
export function secondsToSampleIndex(sec: number, sampleRateHz: number): string | null {
  if (!(sampleRateHz > 0) || !Number.isFinite(sec)) return null;
  const n = Math.round(sec * sampleRateHz);
  if (!Number.isSafeInteger(n) || n < 0) return null;
  return String(n);
}

export function halfOpenEnd(start: string, end: string): string | null {
  try {
    const a = BigInt(start);
    let b = BigInt(end);
    if (b <= a) b = a + 1n;
    if (b > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return b.toString();
  } catch {
    return null;
  }
}

export function cssToValue(
  css: number,
  pixelMin: number,
  pixelMax: number,
  domainMin: number,
  domainMax: number,
  invert: boolean,
): number {
  const span = pixelMax - pixelMin;
  if (span === 0) return domainMin;
  const t = invert ? (pixelMax - css) / span : (css - pixelMin) / span;
  return domainMin + t * (domainMax - domainMin);
}

export function valueToCss(
  value: number,
  pixelMin: number,
  pixelMax: number,
  domainMin: number,
  domainMax: number,
  invert: boolean,
): number {
  const span = domainMax - domainMin;
  if (span === 0) return (pixelMin + pixelMax) / 2;
  const t = (value - domainMin) / span;
  if (invert) return pixelMax - t * (pixelMax - pixelMin);
  return pixelMin + t * (pixelMax - pixelMin);
}

export function plotAxes(
  cssW: number,
  cssH: number,
  mode: 'stft' | 'waterfall',
  xDomain: { min: number; max: number },
  yDomain: { min: number; max: number },
): { timeSec: number; freqHz: number } extends never
  ? never
  : {
      time: { pixelMin: number; pixelMax: number; min: number; max: number; invert: boolean };
      freq: { pixelMin: number; pixelMax: number; min: number; max: number; invert: boolean };
    } {
  const x = {
    pixelMin: PLOT_MARGIN.left,
    pixelMax: cssW - PLOT_MARGIN.right,
    min: xDomain.min,
    max: xDomain.max,
    invert: false,
  };
  const y = {
    pixelMin: PLOT_MARGIN.top,
    pixelMax: cssH - PLOT_MARGIN.bottom,
    min: yDomain.min,
    max: yDomain.max,
    invert: true,
  };
  return mode === 'stft' ? { time: x, freq: y } : { time: y, freq: x };
}

export function cssToTimeFreq(
  xCss: number,
  yCss: number,
  cssW: number,
  cssH: number,
  mode: 'stft' | 'waterfall',
  xDomain: { min: number; max: number },
  yDomain: { min: number; max: number },
): { timeSec: number; freqHz: number } {
  const axes = plotAxes(cssW, cssH, mode, xDomain, yDomain);
  return {
    timeSec: cssToValue(
      mode === 'stft' ? xCss : yCss,
      axes.time.pixelMin,
      axes.time.pixelMax,
      axes.time.min,
      axes.time.max,
      axes.time.invert,
    ),
    freqHz: cssToValue(
      mode === 'stft' ? yCss : xCss,
      axes.freq.pixelMin,
      axes.freq.pixelMax,
      axes.freq.min,
      axes.freq.max,
      axes.freq.invert,
    ),
  };
}

export function markContains(
  mark: { start: string; end: string; lowerHz?: number; upperHz?: number },
  timeSec: number,
  freqHz: number,
  sampleRateHz: number,
): boolean {
  if (!(sampleRateHz > 0)) return false;
  let start: bigint;
  let end: bigint;
  try {
    start = BigInt(mark.start);
    end = BigInt(mark.end);
  } catch {
    return false;
  }
  if (end < start) {
    const swap = start;
    start = end;
    end = swap;
  }
  const t0 = Number(start) / sampleRateHz;
  const t1 = Number(end) / sampleRateHz;
  if (!Number.isFinite(t0) || !Number.isFinite(t1)) return false;
  const f0 = mark.lowerHz ?? Number.NEGATIVE_INFINITY;
  const f1 = mark.upperHz ?? Number.POSITIVE_INFINITY;
  return (
    timeSec >= Math.min(t0, t1) &&
    timeSec <= Math.max(t0, t1) &&
    freqHz >= Math.min(f0, f1) &&
    freqHz <= Math.max(f0, f1)
  );
}

/**
 * Translate mark body by dt/df keeping span (desktop MarkEdit Move @ 17471a6).
 * Optional bounds clamp keeps the full span inside [tMin,tMax] x [fMin,fMax]
 * (view or file full-range), matching desktop offsetSample / std::clamp.
 */
export function applyMarkBodyDelta(opts: {
  t0: number;
  t1: number;
  f0: number;
  f1: number;
  dtSec: number;
  dfHz: number;
  /** Inclusive time bounds (seconds). Omit to skip time clamp. */
  tMin?: number;
  tMax?: number;
  /** Inclusive frequency bounds (Hz). Omit to skip freq clamp. */
  fMin?: number;
  fMax?: number;
}): { t0: number; t1: number; f0: number; f1: number } {
  const spanT = opts.t1 - opts.t0;
  const spanF = opts.f1 - opts.f0;
  let nextT0 = opts.t0 + opts.dtSec;
  let nextF0 = opts.f0 + opts.dfHz;
  if (
    opts.tMin != null &&
    opts.tMax != null &&
    Number.isFinite(opts.tMin) &&
    Number.isFinite(opts.tMax) &&
    opts.tMax - opts.tMin >= spanT
  ) {
    const maxT0 = opts.tMax - spanT;
    nextT0 = Math.min(Math.max(nextT0, opts.tMin), maxT0);
  }
  if (
    opts.fMin != null &&
    opts.fMax != null &&
    Number.isFinite(opts.fMin) &&
    Number.isFinite(opts.fMax) &&
    opts.fMax - opts.fMin >= spanF
  ) {
    const maxF0 = opts.fMax - spanF;
    nextF0 = Math.min(Math.max(nextF0, opts.fMin), maxF0);
  }
  return {
    t0: nextT0,
    t1: nextT0 + spanT,
    f0: nextF0,
    f1: nextF0 + spanF,
  };
}
