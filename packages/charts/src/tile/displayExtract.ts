/**
 * Display-path tile / viewport extract (Bot-C).
 *
 * CONTRACT — display-only grid:
 * - Output is intensity samples for painting (CSS/display or source-pixel windows).
 * - MUST NOT invent or attach detection business coordinates, frequency (Hz),
 *   time (s), marker ids, or any domain labels.
 * - `sourceWindow` is expressed in **source matrix pixels only** (bin/frame indices
 *   as stored in the scalar buffer), never remapped to physical units here.
 * - Callers that need Hz / markers must map through PhysicalAxis / domain props
 *   separately; never read those from this module's result.
 */

export type DisplayReduce = "peak" | "mean" | "nearest";

export interface DisplayExtractRequest {
  /** Row-major source intensities. */
  source: Float32Array;
  sourceWidth: number;
  sourceHeight: number;
  /** Inclusive-start source window in source pixels. */
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  /** Output grid size (display / paint resolution). */
  outW: number;
  outH: number;
  reduce?: DisplayReduce;
}

/**
 * Viewport described in CSS/display pixels of the plot area, mapped onto a
 * source matrix that is assumed to cover that same plot area at full resolution.
 * Still returns only display intensities + source-pixel window — no Hz/markers.
 */
export interface ViewportTileRequest {
  source: Float32Array;
  sourceWidth: number;
  sourceHeight: number;
  /** Plot CSS width/height that the full source matrix is painted into. */
  plotCssWidth: number;
  plotCssHeight: number;
  /** Viewport rectangle in plot CSS pixels (origin = plot top-left). */
  viewCssX: number;
  viewCssY: number;
  viewCssW: number;
  viewCssH: number;
  /** Desired output grid (preview = coarse, refine = denser). */
  outW: number;
  outH: number;
  reduce?: DisplayReduce;
}

export interface DisplayExtractResult {
  data: Float32Array;
  width: number;
  height: number;
  /**
   * Echo of the clamped source-pixel window used for the extract.
   * Display/source pixels only — not detection domain, not Hz, not markers.
   */
  sourceWindow: { x: number; y: number; w: number; h: number };
  /** Always true; documents the display-only contract for consumers/tests. */
  displayOnly: true;
  reduce: DisplayReduce;
  /** Wall time for this extract (ms), for probes. */
  extractMs: number;
}

/** Keys that must never appear on a display-extract result (pollution guard). */
export const FORBIDDEN_DISPLAY_EXTRACT_KEYS = [
  "freqHz",
  "frequencyHz",
  "frequency",
  "marker",
  "markers",
  "detection",
  "detections",
  "timeSec",
  "sampleIndex",
  "businessCoords",
] as const;

/**
 * Extract a display-sized grid from a larger scalar matrix (CPU).
 * Used for interactive preview downsampling; does not attach Hz/sample labels.
 */
export function extractDisplayGrid(req: DisplayExtractRequest): DisplayExtractResult {
  const t0 = performance.now();
  const {
    source,
    sourceWidth,
    sourceHeight,
    srcX,
    srcY,
    srcW,
    srcH,
    outW,
    outH,
    reduce = "peak",
  } = req;
  if (outW < 1 || outH < 1) throw new Error("extractDisplayGrid: invalid out size");
  if (srcW < 1 || srcH < 1) throw new Error("extractDisplayGrid: invalid src size");
  if (sourceWidth < 1 || sourceHeight < 1) {
    throw new Error("extractDisplayGrid: invalid source size");
  }
  if (source.length < sourceWidth * sourceHeight) {
    throw new Error("extractDisplayGrid: source buffer too short");
  }

  const x0 = Math.max(0, Math.floor(srcX));
  const y0 = Math.max(0, Math.floor(srcY));
  const x1 = Math.min(sourceWidth, Math.ceil(srcX + srcW));
  const y1 = Math.min(sourceHeight, Math.ceil(srcY + srcH));
  const winW = Math.max(1, x1 - x0);
  const winH = Math.max(1, y1 - y0);

  const out = new Float32Array(outW * outH);
  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      const sx0 = x0 + Math.floor((ox / outW) * winW);
      const sx1 = x0 + Math.floor(((ox + 1) / outW) * winW);
      const sy0 = y0 + Math.floor((oy / outH) * winH);
      const sy1 = y0 + Math.floor(((oy + 1) / outH) * winH);
      const xa = Math.min(sourceWidth - 1, Math.max(x0, sx0));
      const xb = Math.min(sourceWidth, Math.max(xa + 1, sx1));
      const ya = Math.min(sourceHeight - 1, Math.max(y0, sy0));
      const yb = Math.min(sourceHeight, Math.max(ya + 1, sy1));

      let v = 0;
      if (reduce === "nearest") {
        const mx = Math.min(sourceWidth - 1, Math.floor((xa + xb) / 2));
        const my = Math.min(sourceHeight - 1, Math.floor((ya + yb) / 2));
        v = source[my * sourceWidth + mx] ?? 0;
      } else if (reduce === "mean") {
        let sum = 0;
        let n = 0;
        for (let y = ya; y < yb; y++) {
          for (let x = xa; x < xb; x++) {
            sum += source[y * sourceWidth + x] ?? 0;
            n++;
          }
        }
        v = n ? sum / n : 0;
      } else {
        let peak = -Infinity;
        for (let y = ya; y < yb; y++) {
          for (let x = xa; x < xb; x++) {
            const s = source[y * sourceWidth + x] ?? -Infinity;
            if (s > peak) peak = s;
          }
        }
        v = Number.isFinite(peak) ? peak : 0;
      }
      out[oy * outW + ox] = v;
    }
  }

  return {
    data: out,
    width: outW,
    height: outH,
    sourceWindow: { x: x0, y: y0, w: winW, h: winH },
    displayOnly: true,
    reduce,
    extractMs: performance.now() - t0,
  };
}

/**
 * Map a CSS viewport inside the plot area onto source pixels, then extract.
 * Display-only: does not attach frequency / marker / detection coordinates.
 */
export function extractViewportTile(req: ViewportTileRequest): DisplayExtractResult {
  const {
    source,
    sourceWidth,
    sourceHeight,
    plotCssWidth,
    plotCssHeight,
    viewCssX,
    viewCssY,
    viewCssW,
    viewCssH,
    outW,
    outH,
    reduce = "peak",
  } = req;
  if (plotCssWidth <= 0 || plotCssHeight <= 0) {
    throw new Error("extractViewportTile: invalid plot CSS size");
  }
  if (viewCssW < 1 || viewCssH < 1) {
    throw new Error("extractViewportTile: invalid viewport CSS size");
  }

  const srcX = (viewCssX / plotCssWidth) * sourceWidth;
  const srcY = (viewCssY / plotCssHeight) * sourceHeight;
  const srcW = (viewCssW / plotCssWidth) * sourceWidth;
  const srcH = (viewCssH / plotCssHeight) * sourceHeight;

  return extractDisplayGrid({
    source,
    sourceWidth,
    sourceHeight,
    srcX,
    srcY,
    srcW,
    srcH,
    outW,
    outH,
    reduce,
  });
}

/**
 * Suggest output grid size for preview (cheap) vs refine (idle) modes.
 * Caps at source dimensions; preview targets ~plot CSS, refine up to 2× CSS or source.
 */
export function suggestExtractOutSize(input: {
  sourceWidth: number;
  sourceHeight: number;
  plotCssWidth: number;
  plotCssHeight: number;
  mode: "preview" | "refine" | "idle";
  /** Optional devicePixelRatio — refine targets CSS×DPR for 4K density. */
  devicePixelRatio?: number;
}): { outW: number; outH: number } {
  const {
    sourceWidth,
    sourceHeight,
    plotCssWidth,
    plotCssHeight,
    mode,
    devicePixelRatio = 1,
  } = input;
  const cssW = Math.max(1, Math.round(plotCssWidth));
  const cssH = Math.max(1, Math.round(plotCssHeight));
  const dpr = Math.max(1, Math.min(3, devicePixelRatio || 1));
  if (mode === "preview") {
    // Was 0.5×CSS — too blocky/pale on 4K; keep cheap but closer to plot pixels.
    return {
      outW: Math.min(sourceWidth, Math.max(32, Math.round(cssW * 0.85))),
      outH: Math.min(sourceHeight, Math.max(32, Math.round(cssH * 0.85))),
    };
  }
  // refine + idle: paint near buffer density (CSS × DPR), capped by source.
  return {
    outW: Math.min(sourceWidth, Math.max(64, Math.round(cssW * dpr))),
    outH: Math.min(sourceHeight, Math.max(64, Math.round(cssH * dpr))),
  };
}

/** Runtime guard used by tests / Bot-B integration checks. */
export function assertDisplayOnlyExtract(result: DisplayExtractResult): void {
  if (result.displayOnly !== true) {
    throw new Error("assertDisplayOnlyExtract: displayOnly flag missing");
  }
  const rec = result as unknown as Record<string, unknown>;
  for (const key of FORBIDDEN_DISPLAY_EXTRACT_KEYS) {
    if (Object.prototype.hasOwnProperty.call(rec, key) && rec[key] != null) {
      throw new Error(`assertDisplayOnlyExtract: forbidden key present: ${key}`);
    }
  }
}

/** @deprecated alias kept for early README mentions */
export const DisplayExtract = {
  extractDisplayGrid,
  extractViewportTile,
  suggestExtractOutSize,
  assertDisplayOnlyExtract,
};
