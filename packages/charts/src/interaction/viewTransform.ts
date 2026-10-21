/** Pure view pan/zoom math for physical chart domains (no detection coords). */

export interface ViewDomain {
  min: number;
  max: number;
  unit?: string;
  label?: string;
}

export interface ViewState {
  xDomain: ViewDomain;
  yDomain: ViewDomain;
}

export interface PixelSpan {
  /** CSS pixel range of the plot (not full canvas). */
  pixelMin: number;
  pixelMax: number;
}

const EPS = 1e-15;

export function domainSpan(d: ViewDomain): number {
  return d.max - d.min;
}

export function clampZoomSpan(
  span: number,
  opts: { minSpan?: number; maxSpan?: number } = {},
): number {
  const minSpan = opts.minSpan ?? EPS;
  const maxSpan = opts.maxSpan ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(span) || span <= 0) return minSpan;
  return Math.min(maxSpan, Math.max(minSpan, span));
}

/** Shift a domain by a CSS-pixel delta along its axis. */
export function panDomain(
  domain: ViewDomain,
  pixelDelta: number,
  span: PixelSpan,
  opts: { invertPixel?: boolean } = {},
): ViewDomain {
  const pSpan = span.pixelMax - span.pixelMin;
  if (pSpan === 0) return { ...domain };
  const valuePerPx = domainSpan(domain) / pSpan;
  // Drag right → content moves right → domain decreases (standard map pan).
  const signed = opts.invertPixel ? pixelDelta : -pixelDelta;
  const shift = signed * valuePerPx;
  return {
    ...domain,
    min: domain.min + shift,
    max: domain.max + shift,
  };
}

/**
 * Zoom domain around an anchor CSS pixel. factor > 1 zooms in (smaller span).
 * factor < 1 zooms out.
 */
export function zoomDomain(
  domain: ViewDomain,
  anchorPixel: number,
  factor: number,
  span: PixelSpan,
  opts: {
    invertPixel?: boolean;
    minSpan?: number;
    maxSpan?: number;
  } = {},
): ViewDomain {
  if (!(factor > 0) || !Number.isFinite(factor)) return { ...domain };
  const pSpan = span.pixelMax - span.pixelMin;
  if (pSpan === 0) return { ...domain };

  const t = opts.invertPixel
    ? (span.pixelMax - anchorPixel) / pSpan
    : (anchorPixel - span.pixelMin) / pSpan;
  const anchorValue = domain.min + t * domainSpan(domain);

  const nextSpan = clampZoomSpan(domainSpan(domain) / factor, opts);
  const newMin = anchorValue - t * nextSpan;
  return {
    ...domain,
    min: newMin,
    max: newMin + nextSpan,
  };
}

/** Pan both axes from a CSS-pixel drag delta inside the plot. */
export function panView(
  view: ViewState,
  dxCss: number,
  dyCss: number,
  xSpan: PixelSpan,
  ySpan: PixelSpan,
): ViewState {
  return {
    xDomain: panDomain(view.xDomain, dxCss, xSpan),
    yDomain: panDomain(view.yDomain, dyCss, ySpan, { invertPixel: true }),
  };
}

/**
 * Zoom both axes about a plot-local CSS point.
 * wheelZoomFactor is typically >1 for zoom-in on wheel-up (deltaY < 0).
 */
export function zoomViewAt(
  view: ViewState,
  anchorXCss: number,
  anchorYCss: number,
  factor: number,
  xSpan: PixelSpan,
  ySpan: PixelSpan,
  clamp?: { minSpanX?: number; maxSpanX?: number; minSpanY?: number; maxSpanY?: number },
): ViewState {
  return {
    xDomain: zoomDomain(view.xDomain, anchorXCss, factor, xSpan, {
      minSpan: clamp?.minSpanX,
      maxSpan: clamp?.maxSpanX,
    }),
    yDomain: zoomDomain(view.yDomain, anchorYCss, factor, ySpan, {
      invertPixel: true,
      minSpan: clamp?.minSpanY,
      maxSpan: clamp?.maxSpanY,
    }),
  };
}

/** Convert wheel deltaY to a zoom factor (>1 zoom in). */
export function wheelDeltaToZoomFactor(
  deltaY: number,
  baseFactor = 1.1,
): number {
  if (deltaY === 0 || !Number.isFinite(deltaY)) return 1;
  // trackpad / mouse: negative deltaY → zoom in
  return deltaY < 0 ? baseFactor : 1 / baseFactor;
}

export function domainsEqual(
  a: ViewDomain,
  b: ViewDomain,
  eps = 1e-12,
): boolean {
  return (
    Math.abs(a.min - b.min) <= eps &&
    Math.abs(a.max - b.max) <= eps &&
    a.unit === b.unit &&
    a.label === b.label
  );
}
