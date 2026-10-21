import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createWebGL2Context, type WebGL2ContextHandle } from "../webgl/context.js";
import { HeatmapRenderer, type HeatmapOrientation } from "../webgl/heatmapRenderer.js";
import { buildLutRgba8, type ColormapName } from "../lut/colormaps.js";
import { PhysicalAxis } from "../axis/physicalAxis.js";
import { AxisOverlay } from "../overlay/axisOverlay.js";
import { CursorOverlay, type CursorOverlayState } from "../overlay/cursorOverlay.js";
import { applyCanvasDpr } from "../dpi/canvasSizing.js";
import { PreviewRefineController } from "../interaction/previewRefine.js";
import { extractDisplayGrid } from "../tile/displayExtract.js";

export interface HeatmapCanvasProps {
  /** Row-major scalar intensities. */
  scalar: Float32Array;
  widthBins: number;
  heightBins: number;
  orientation?: HeatmapOrientation;
  colormap?: ColormapName;
  levels?: { min: number; max: number };
  xDomain?: { min: number; max: number; unit?: string; label?: string };
  yDomain?: { min: number; max: number; unit?: string; label?: string };
  className?: string;
  style?: CSSProperties;
  /** CSS height; width fills container. */
  height?: number | string;
  showCursor?: boolean;
  testId?: string;
  onCursor?: (state: {
    xValue: number;
    yValue: number;
    xCss: number;
    yCss: number;
  }) => void;
}

const MARGIN = { left: 52, right: 12, top: 10, bottom: 36 };

/**
 * Embeddable WebGL2 heatmap + independent axis/cursor overlays for Bot-B.
 */
export function HeatmapCanvas(props: HeatmapCanvasProps) {
  const {
    scalar,
    widthBins,
    heightBins,
    orientation = "stft",
    colormap = "viridis",
    levels: levelsProp,
    xDomain = { min: 0, max: 1, label: "X" },
    yDomain = { min: 0, max: 1, label: "Y" },
    className,
    style,
    height = 280,
    showCursor = true,
    testId = "heatmap-canvas",
    onCursor,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const axisRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLCanvasElement>(null);

  const handleRef = useRef<WebGL2ContextHandle | null>(null);
  const rendererRef = useRef<HeatmapRenderer | null>(null);
  const axisOverlay = useRef(new AxisOverlay()).current;
  const cursorOverlay = useRef(new CursorOverlay()).current;
  const preview = useRef<PreviewRefineController | null>(null);

  const [cursor, setCursor] = useState<CursorOverlayState>({
    xCss: null,
    yCss: null,
  });
  const [error, setError] = useState<string | null>(null);

  const levels =
    levelsProp ??
    (() => {
      let min = Infinity;
      let max = -Infinity;
      for (let i = 0; i < scalar.length; i++) {
        const v = scalar[i]!;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
        return { min: 0, max: 1 };
      }
      return { min, max };
    })();

  // Init GL once
  useEffect(() => {
    const canvas = glRef.current;
    if (!canvas) return;
    try {
      const handle = createWebGL2Context(canvas, {
        onContextLost: () => setError("WebGL context lost"),
        onContextRestored: () => {
          setError(null);
          // force re-upload on next paint via revision bump path
          rendererRef.current?.dispose();
          rendererRef.current = new HeatmapRenderer(handle.gl, orientation);
        },
      });
      handleRef.current = handle;
      rendererRef.current = new HeatmapRenderer(handle.gl, orientation);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
    preview.current = new PreviewRefineController({
      onPreview: () => {
        /* Bot-B / host can swap to coarser extract */
      },
      onRefine: () => {
        /* full-res path */
      },
    });
    return () => {
      preview.current?.dispose();
      rendererRef.current?.dispose();
      handleRef.current?.dispose();
      rendererRef.current = null;
      handleRef.current = null;
    };
    // orientation change rebuilds
  }, [orientation]);

  // Resize + draw
  useEffect(() => {
    const wrap = wrapRef.current;
    const glCanvas = glRef.current;
    const axisCanvas = axisRef.current;
    const cursorCanvas = cursorRef.current;
    const renderer = rendererRef.current;
    const handle = handleRef.current;
    if (!wrap || !glCanvas || !axisCanvas || !cursorCanvas || !renderer || !handle) return;
    if (handle.isLost) return;

    const cssW = Math.max(1, wrap.clientWidth);
    const cssH =
      typeof height === "number"
        ? height
        : Math.max(1, wrap.clientHeight || 280);
    const dpr = window.devicePixelRatio || 1;

    const glSize = applyCanvasDpr(glCanvas, {
      cssWidth: cssW,
      cssHeight: cssH,
      devicePixelRatio: dpr,
    });
    applyCanvasDpr(axisCanvas, {
      cssWidth: cssW,
      cssHeight: cssH,
      devicePixelRatio: dpr,
    });
    applyCanvasDpr(cursorCanvas, {
      cssWidth: cssW,
      cssHeight: cssH,
      devicePixelRatio: dpr,
    });

    const plotW = Math.max(1, cssW - MARGIN.left - MARGIN.right);
    const plotH = Math.max(1, cssH - MARGIN.top - MARGIN.bottom);

    // Display extract for CSS plot size (preview path); full scalar still owned by caller
    const extracted = extractDisplayGrid({
      source: scalar,
      sourceWidth: widthBins,
      sourceHeight: heightBins,
      srcX: 0,
      srcY: 0,
      srcW: widthBins,
      srcH: heightBins,
      outW: Math.min(widthBins, Math.max(32, Math.round(plotW))),
      outH: Math.min(heightBins, Math.max(32, Math.round(plotH))),
      reduce: "peak",
    });

    const t0 = performance.now();
    renderer.uploadScalar({
      data: extracted.data,
      width: extracted.width,
      height: extracted.height,
    });
    const lut = buildLutRgba8(colormap, 256);
    renderer.uploadLut({ rgba: lut, size: 256 });

    const gl = handle.gl;
    gl.viewport(0, 0, glSize.bufferWidth, glSize.bufferHeight);
    // letterbox: clear full, then scissor to plot area in buffer pixels
    const bx0 = Math.round(MARGIN.left * glSize.dpr);
    const by0 = Math.round(MARGIN.top * glSize.dpr);
    const bw = Math.round(plotW * glSize.dpr);
    const bh = Math.round(plotH * glSize.dpr);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, glSize.bufferWidth, glSize.bufferHeight);
    gl.clearColor(0.06, 0.07, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // WebGL Y is bottom-up
    gl.scissor(bx0, glSize.bufferHeight - by0 - bh, bw, bh);
    gl.viewport(bx0, glSize.bufferHeight - by0 - bh, bw, bh);
    renderer.draw({ levels, clear: true, clearColor: [0.06, 0.07, 0.1, 1] });
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, glSize.bufferWidth, glSize.bufferHeight);
    void t0;

    const xAxis = new PhysicalAxis({
      orientation: "horizontal",
      domain: xDomain,
      pixelMin: MARGIN.left,
      pixelMax: cssW - MARGIN.right,
    });
    const yAxis = new PhysicalAxis({
      orientation: "vertical",
      domain: yDomain,
      pixelMin: MARGIN.top,
      pixelMax: cssH - MARGIN.bottom,
      invertPixel: true,
    });

    const axisCtx = axisCanvas.getContext("2d");
    if (axisCtx) {
      axisCtx.setTransform(glSize.dpr, 0, 0, glSize.dpr, 0, 0);
      axisOverlay.draw({
        ctx: axisCtx,
        width: cssW,
        height: cssH,
        margin: MARGIN,
        xAxis,
        yAxis,
      });
    }

    const cCtx = cursorCanvas.getContext("2d");
    if (cCtx) {
      cCtx.setTransform(glSize.dpr, 0, 0, glSize.dpr, 0, 0);
      cursorOverlay.draw({
        ctx: cCtx,
        width: cssW,
        height: cssH,
        margin: MARGIN,
        state: showCursor ? cursor : { xCss: null, yCss: null },
      });
    }
  }, [
    scalar,
    widthBins,
    heightBins,
    colormap,
    levels.min,
    levels.max,
    xDomain.min,
    xDomain.max,
    xDomain.label,
    xDomain.unit,
    yDomain.min,
    yDomain.max,
    yDomain.label,
    yDomain.unit,
    height,
    cursor,
    showCursor,
    axisOverlay,
    cursorOverlay,
  ]);

  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    preview.current?.noteInteraction();
    const rect = wrap.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;
    const cssW = rect.width;
    const cssH = rect.height;
    const xAxis = new PhysicalAxis({
      orientation: "horizontal",
      domain: xDomain,
      pixelMin: MARGIN.left,
      pixelMax: cssW - MARGIN.right,
    });
    const yAxis = new PhysicalAxis({
      orientation: "vertical",
      domain: yDomain,
      pixelMin: MARGIN.top,
      pixelMax: cssH - MARGIN.bottom,
      invertPixel: true,
    });
    const xValue = xAxis.toValue(xCss);
    const yValue = yAxis.toValue(yCss);
    const next: CursorOverlayState = {
      xCss,
      yCss,
      labelX: `${xValue.toPrecision(6)}${xDomain.unit ? " " + xDomain.unit : ""}`,
      labelY: `${yValue.toPrecision(6)}${yDomain.unit ? " " + yDomain.unit : ""}`,
      visible: true,
    };
    setCursor(next);
    onCursor?.({ xValue, yValue, xCss, yCss });
  };

  const onPointerLeave = () => {
    setCursor({ xCss: null, yCss: null, visible: false });
    preview.current?.requestRefine();
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      data-testid={testId}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        background: "#0f1218",
        ...style,
      }}
    >
      <canvas
        ref={glRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <canvas
        ref={axisRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={cursorRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      {error ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#f88",
            fontSize: 13,
            padding: 12,
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
