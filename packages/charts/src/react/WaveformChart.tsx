import {
  useEffect,
  useRef,
  type CSSProperties,
} from "react";
import { applyCanvasDpr, resolveDevicePixelRatio } from "../dpi/canvasSizing.js";
import { PhysicalAxis } from "../axis/physicalAxis.js";
import { AxisOverlay } from "../overlay/axisOverlay.js";
import type { ViewDomain } from "../interaction/viewTransform.js";

export type WaveformKind = "waveform" | "psd";

export interface WaveformChartProps {
  /** Y samples (amplitude or PSD power). */
  y: Float32Array;
  xDomain: ViewDomain;
  yDomain?: ViewDomain;
  kind?: WaveformKind;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  testId?: string;
  /** Optional linked window highlight in xDomain units. */
  windowX?: { min: number; max: number } | null;
  stroke?: string;
  /** G18 linked cursor X in xDomain units (time for wave, freq for PSD). */
  linkedX?: number | null;
  /** Click-to-pin on plot (desktop aux pinAt). */
  onPinX?: (xValue: number) => void;
  /** Override axis titles (desktop narrowband_workspace axis labels). */
  xLabel?: string;
  yLabel?: string;
}

const MARGIN = { left: 52, right: 12, top: 10, bottom: 28 };

/**
 * Canvas2D waveform / PSD line chart (G04 aux real path).
 * Display only — no detection / demod.
 */
export function WaveformChart(props: WaveformChartProps) {
  const {
    y,
    xDomain,
    yDomain: yDomainProp,
    kind = "waveform",
    height = 205,
    className,
    style,
    testId = "waveform-chart",
    windowX = null,
    stroke = kind === "psd" ? "#7dd3fc" : "#86efac",
    linkedX = null,
    onPinX,
    xLabel,
    yLabel,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const axisOverlay = useRef(new AxisOverlay()).current;

  const yDomain: ViewDomain = yDomainProp ?? (() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < y.length; i++) {
      const v = y[i]!;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
      return {
        min: kind === "psd" ? -80 : -1,
        max: kind === "psd" ? 0 : 1,
        unit: kind === "psd" ? "dB" : "",
        label: kind === "psd" ? "功率谱密度 (dBFS/Hz)" : "幅度",
      };
    }
    const pad = (max - min) * 0.08 || 0.1;
    return {
      min: min - pad,
      max: max + pad,
      unit: kind === "psd" ? "dB" : "",
      label: kind === "psd" ? "功率谱密度 (dBFS/Hz)" : "幅度",
    };
  })();

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH =
        typeof height === "number" ? height : Math.max(1, wrap.clientHeight || 205);
      const dpr = resolveDevicePixelRatio(window.devicePixelRatio);
      const size = applyCanvasDpr(canvas, {
        cssWidth: cssW,
        cssHeight: cssH,
        devicePixelRatio: dpr,
      });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#0f1218";
      ctx.fillRect(0, 0, cssW, cssH);

      const plotL = MARGIN.left;
      const plotR = cssW - MARGIN.right;
      const plotT = MARGIN.top;
      const plotB = cssH - MARGIN.bottom;
      const plotH = Math.max(1, plotB - plotT);

      const xDomainDraw = xLabel
        ? { ...xDomain, label: xLabel }
        : xDomain;
      const yDomainDraw = yLabel
        ? { ...yDomain, label: yLabel }
        : yDomain;
      const xAxis = new PhysicalAxis({
        orientation: "horizontal",
        domain: xDomainDraw,
        pixelMin: plotL,
        pixelMax: plotR,
      });
      const yAxis = new PhysicalAxis({
        orientation: "vertical",
        domain: yDomainDraw,
        pixelMin: plotT,
        pixelMax: plotB,
        invertPixel: true,
      });

      if (windowX) {
        const wx0 = xAxis.toPixel(windowX.min);
        const wx1 = xAxis.toPixel(windowX.max);
        ctx.fillStyle = "rgba(96, 165, 250, 0.15)";
        ctx.fillRect(
          Math.min(wx0, wx1),
          plotT,
          Math.abs(wx1 - wx0),
          plotH,
        );
      }

      const n = y.length;
      if (linkedX != null && Number.isFinite(linkedX)) {
        const lx = xAxis.toPixel(linkedX);
        ctx.save();
        ctx.strokeStyle = "rgba(255, 120, 80, 0.95)";
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(lx, plotT);
        ctx.lineTo(lx, plotB);
        ctx.stroke();
        ctx.restore();
      }

      if (n > 1) {
        ctx.beginPath();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.25;
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1);
          const xv = xDomain.min + t * (xDomain.max - xDomain.min);
          const px = xAxis.toPixel(xv);
          const py = yAxis.toPixel(y[i]!);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      axisOverlay.draw({
        ctx,
        width: cssW,
        height: cssH,
        margin: MARGIN,
        xAxis,
        yAxis,
      });

      wrap.setAttribute("data-kind", kind);
      wrap.setAttribute("data-points", String(n));
    };

    draw();
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    const ro = RO ? new RO(() => draw()) : null;
    ro?.observe(wrap);
    window.addEventListener("resize", draw);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", draw);
    };
  }, [y, xDomain.min, xDomain.max, xDomain.label, xDomain.unit, yDomain.min, yDomain.max, yDomain.label, yDomain.unit, xLabel, yLabel, height, kind, stroke, windowX?.min, windowX?.max, linkedX, axisOverlay]);

  return (
    <div
      ref={wrapRef}
      className={className}
      data-testid={testId}
      data-chart-kind={kind}
      data-linked-x={linkedX == null ? "" : String(linkedX)}
      data-linked-cursor-pinned={linkedX == null ? "false" : "true"}
      style={{
        position:
          typeof height === "string" && height.includes("%")
            ? "absolute"
            : "relative",
        inset:
          typeof height === "string" && height.includes("%") ? 0 : undefined,
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        minHeight: 0,
        overflow: "hidden",
        background: "#0f1218",
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%" }}
        onPointerUp={(ev) => {
          if (!onPinX || ev.button !== 0) return;
          const wrap = wrapRef.current;
          if (!wrap) return;
          const rect = wrap.getBoundingClientRect();
          const xCss = ev.clientX - rect.left;
          const plotL = MARGIN.left;
          const plotR = rect.width - MARGIN.right;
          if (xCss < plotL || xCss > plotR) return;
          const t = (xCss - plotL) / Math.max(1e-9, plotR - plotL);
          const xValue = xDomain.min + t * (xDomain.max - xDomain.min);
          onPinX(xValue);
        }}
      />
    </div>
  );
}
