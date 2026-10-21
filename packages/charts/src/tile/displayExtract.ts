/** Display-path tile / grid extract. Must not invent detection business coordinates. */

export interface DisplayExtractRequest {
  /** Row-major source intensities. */
  source: Float32Array;
  sourceWidth: number;
  sourceHeight: number;
  /** Inclusive source window in source pixels. */
  srcX: number;
  srcY: number;
  srcW: number;
  srcH: number;
  /** Output grid size (CSS/display pixels mapped). */
  outW: number;
  outH: number;
  /** peak | mean | nearest */
  reduce?: "peak" | "mean" | "nearest";
}

export interface DisplayExtractResult {
  data: Float32Array;
  width: number;
  height: number;
  /** Echo of source window only — display pixels, not detection domain. */
  sourceWindow: { x: number; y: number; w: number; h: number };
}

/**
 * Extract a display-sized grid from a larger scalar matrix (CPU).
 * Used for interactive preview downsampling; does not attach Hz/sample labels.
 */
export function extractDisplayGrid(req: DisplayExtractRequest): DisplayExtractResult {
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
  };
}

/** @deprecated alias kept for early README mentions */
export const DisplayExtract = { extractDisplayGrid };
