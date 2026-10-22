import type { PhysicalAxis } from "../axis/physicalAxis.js";
import type { AxisDomain } from "../axis/physicalAxis.js";
import {
  displayUnit,
  formatPhysicalRange,
  type PhysicalKind,
} from "../axis/physicalCaption.js";

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

function inferKind(unit?: string, label?: string): PhysicalKind {
  const u = (unit ?? "").toLowerCase();
  const l = (label ?? "").toLowerCase();
  if (
    u === "hz" ||
    u === "khz" ||
    u === "mhz" ||
    l.includes("freq") ||
    l.includes("频率")
  ) {
    return "frequency";
  }
  if (
    u === "s" ||
    u === "ms" ||
    u === "us" ||
    u === "\u00b5s" ||
    l.includes("time") ||
    l.includes("时间")
  ) {
    return "time";
  }
  return "other";
}

function toBase(value: number, unit?: string): number {
  const u = (unit ?? "").toLowerCase();
  if (u === "mhz") return value * 1e6;
  if (u === "khz") return value * 1e3;
  if (u === "ms") return value * 1e-3;
  if (u === "us" || u === "\u00b5s") return value * 1e-6;
  return value;
}

/** Desktop axisScale tick text: scaled number without unit suffix. */
function formatTick(v: number, domain: AxisDomain): string {
  const kind = inferKind(domain.unit, domain.label);
  if (kind === "other") {
    const a = Math.abs(v);
    if (a !== 0 && (a >= 1e4 || a < 1e-2)) return v.toExponential(2);
    return String(Number(v.toPrecision(6)));
  }
  const lo = toBase(domain.min, domain.unit);
  const hi = toBase(domain.max, domain.unit);
  const span = Math.abs(hi - lo);
  const scaled = displayUnit(kind, span > 0 ? span : Math.max(Math.abs(lo), Math.abs(hi), 1));
  const base = toBase(v, domain.unit);
  const sv = base * scaled.scale;
  const stepScaled = (span * scaled.scale) / 5;
  let decimals = 2;
  if (!(stepScaled > 0) || !Number.isFinite(stepScaled)) decimals = 2;
  else if (stepScaled >= 100) decimals = 0;
  else if (stepScaled >= 10) decimals = 1;
  else if (stepScaled >= 1) decimals = 2;
  else if (stepScaled >= 0.1) decimals = 3;
  else decimals = 4;
  const fixed = sv.toFixed(decimals);
  return decimals <= 0
    ? fixed
    : fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

/** Desktop axis.label: `频率 (MHz)` / `时间 (ms)`. */
function axisTitle(domain: AxisDomain): string {
  const formatted = formatPhysicalRange(domain.min, domain.max, {
    unit: domain.unit,
    label: domain.label,
  });
  if (formatted.kind === "other") {
    return domain.label ?? domain.unit ?? "";
  }
  return formatted.unitName
    ? `${formatted.title} (${formatted.unitName})`
    : formatted.title;
}

/**
 * Independent 2D-canvas axis overlay — separate from WebGL heatmap layer.
 * Tick/title scaling mirrors desktop plot_widget axisScale / displayUnit.
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
      ctx.fillText(formatTick(v, xAxis.mapping.domain), px, plotB + 6);
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
      ctx.fillText(formatTick(v, yAxis.mapping.domain), plotL - 6, py);
    }

    const xLabel = axisTitle(xAxis.mapping.domain);
    const yLabel = axisTitle(yAxis.mapping.domain);
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
