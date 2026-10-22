import type { PhysicalAxis } from "../axis/physicalAxis.js";

export interface AxisOverlayDrawInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  /** Plot inset in CSS pixels. */
  margin: { left: number; right: number; top: number; bottom: number };
  xAxis: PhysicalAxis;
  yAxis: PhysicalAxis;
  strokeStyle?: string;
  labelStyle?: string;
  background?: string;
}

/**
 * Independent 2D-canvas axis overlay — separate from WebGL heatmap layer.
 */
export class AxisOverlay {
  draw(input: AxisOverlayDrawInput): void {
    const {
      ctx,
      width,
      height,
      margin,
      xAxis,
      yAxis,
      strokeStyle = "rgba(180,190,210,0.85)",
      labelStyle = "rgba(210,220,235,0.95)",
      background,
    } = input;

    ctx.save();
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    const plotL = margin.left;
    const plotT = margin.top;
    const plotR = width - margin.right;
    const plotB = height - margin.bottom;

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(plotL, plotT);
    ctx.lineTo(plotL, plotB);
    ctx.lineTo(plotR, plotB);
    ctx.stroke();

    ctx.fillStyle = labelStyle;
    ctx.font = "10px Consolas, ui-monospace, monospace";

    const xTicks = xAxis.ticks(6);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const v of xTicks) {
      const px = xAxis.toPixel(v);
      if (px < plotL - 1 || px > plotR + 1) continue;
      ctx.beginPath();
      ctx.moveTo(px, plotB);
      ctx.lineTo(px, plotB + 4);
      ctx.stroke();
      ctx.fillText(formatTick(v), px, plotB + 6);
    }

    const yTicks = yAxis.ticks(6);
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (const v of yTicks) {
      const py = yAxis.toPixel(v);
      if (py < plotT - 1 || py > plotB + 1) continue;
      ctx.beginPath();
      ctx.moveTo(plotL - 4, py);
      ctx.lineTo(plotL, py);
      ctx.stroke();
      ctx.fillText(formatTick(v), plotL - 6, py);
    }

    const xLabel = xAxis.mapping.domain.label ?? xAxis.mapping.domain.unit;
    const yLabel = yAxis.mapping.domain.label ?? yAxis.mapping.domain.unit;
    if (xLabel) {
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(xLabel, (plotL + plotR) / 2, height - 2);
    }
    if (yLabel) {
      ctx.save();
      ctx.translate(12, (plotT + plotB) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    ctx.restore();
  }
}

function formatTick(v: number): string {
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e4 || a < 1e-2)) return v.toExponential(2);
  return String(Number(v.toPrecision(6)));
}
