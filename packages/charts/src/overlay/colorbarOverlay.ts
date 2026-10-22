/**
 * Desktop-aligned color scale strip (plot_widget.cpp colorScale @ 17471a6).
 * Independent 2D overlay — does not touch WebGL scalar / LUT upload path.
 */
import { buildLutRgba8, type ColormapName } from "../lut/colormaps.js";
import {
  HEATMAP_COLORBAR,
  stripOffsetForMargin,
} from "../react/plotMargin.js";

export type ColorScaleDb = {
  /** Desktop referenceLevelDb (top of bar). */
  referenceLevelDb: number;
  /** Desktop dynamicRangeDb (top − bottom). */
  dynamicRangeDb: number;
};

export interface ColorbarOverlayDrawInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  colormap: ColormapName;
  levelsDb: ColorScaleDb;
  tickCount?: number;
  strokeStyle?: string;
  labelStyle?: string;
}

function formatDbTick(v: number): string {
  if (!Number.isFinite(v)) return String(v);
  const a = Math.abs(v);
  if (a >= 100) return v.toFixed(0);
  if (a >= 10) return v.toFixed(0);
  return Number(v.toFixed(1)).toString();
}

/** dB tick labels for DOM legend / Playwright (top = reference, bottom = ref - range). */
export function colorScaleTickLabels(
  levelsDb: ColorScaleDb,
  tickCount = 7,
): string[] {
  const ref = levelsDb.referenceLevelDb;
  const dyn = Math.max(1e-6, levelsDb.dynamicRangeDb);
  const n = Math.max(2, tickCount);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const frac = i / (n - 1);
    out.push(formatDbTick(ref - dyn * frac));
  }
  return out;
}

/**
 * Draw vertical LUT strip + dB ticks to the right of the plot
 * (desktop: left = width-38, width=13, ticks at left+17).
 */
export class ColorbarOverlay {
  draw(input: ColorbarOverlayDrawInput): void {
    const {
      ctx,
      width,
      height,
      margin,
      colormap,
      levelsDb,
      tickCount = 5,
      strokeStyle = "rgba(129,151,177,0.95)",
      labelStyle = "rgba(186,213,235,0.95)",
    } = input;

    const plotT = margin.top;
    const plotB = height - margin.bottom;
    const span = Math.max(1, plotB - plotT - 8);
    const top = plotT + 4;
    const left = width - stripOffsetForMargin(margin.right);
    const stripW = HEATMAP_COLORBAR.stripWidth;

    const lut = buildLutRgba8(colormap, 256);
    for (let i = 0; i < span; i++) {
      const t = 1 - i / span;
      const idx = Math.min(255, Math.max(0, Math.round(t * 255))) * 4;
      const r = lut[idx] ?? 0;
      const g = lut[idx + 1] ?? 0;
      const b = lut[idx + 2] ?? 0;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(left, top + i, stripW, 1);
    }

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, stripW - 1, span - 1);

    const ref = levelsDb.referenceLevelDb;
    const dyn = Math.max(1e-6, levelsDb.dynamicRangeDb);
    const n = Math.max(2, tickCount);
    ctx.fillStyle = labelStyle;
    ctx.font = "11px Consolas, ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    for (let i = 0; i < n; i++) {
      const frac = i / (n - 1);
      const db = ref - dyn * frac;
      const y = top + frac * span;
      ctx.fillText(
        formatDbTick(db),
        left + stripW + HEATMAP_COLORBAR.labelGap,
        y,
      );
    }

    // Unit caption under strip (desktop ticks are bare dB numbers).
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = labelStyle;
    ctx.fillText("dB", left + stripW / 2, top + span + 2);
  }
}
