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
        label: kind === "psd" ? "PSD" : "Amplitude",
      };
    }
    const pad = (max - min) * 0.08 || 0.1;
    return {
      min: min - pad,
      max: max + pad,
      unit: kind === "psd" ? "dB" : "",
      label: kind === "psd" ? "PSD" : "Amplitude",
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

      const xAxis = new PhysicalAxis({
        orientation: "horizontal",
        domain: xDomain,
        pixelMin: plotL,
        pixelMax: plotR,
      });
      const yAxis = new PhysicalAxis({
        orientation: "vertical",
        domain: yDomain,
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
  }, [y, xDomain.min, xDomain.max, yDomain.min, yDomain.max, height, kind, stroke, windowX?.min, windowX?.max, axisOverlay]);

  return (
    <div
      ref={wrapRef}
      className={className}
      data-testid={testId}
      data-chart-kind={kind}
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        background: "#0f1218",
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
