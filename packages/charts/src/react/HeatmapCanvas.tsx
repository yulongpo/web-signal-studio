import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createWebGL2Context, type WebGL2ContextHandle } from "../webgl/context.js";
import { HeatmapRenderer, type HeatmapOrientation } from "../webgl/heatmapRenderer.js";
import {
  nextWebGlUiState,
  planHeatmapContextRestore,
  type WebGlUiState,
} from "../webgl/contextRestore.js";
import { buildLutRgba8, type ColormapName } from "../lut/colormaps.js";
import { PhysicalAxis } from "../axis/physicalAxis.js";
import { AxisOverlay } from "../overlay/axisOverlay.js";
import { CursorOverlay, type CursorOverlayState } from "../overlay/cursorOverlay.js";
import { applyCanvasDpr, resolveDevicePixelRatio } from "../dpi/canvasSizing.js";
import {
  PreviewRefineController,
  type PreviewRefineMode,
} from "../interaction/previewRefine.js";
import {
  panView,
  zoomViewAt,
  wheelDeltaToZoomFactor,
  type ViewDomain,
  type ViewState,
} from "../interaction/viewTransform.js";
import {
  extractDisplayGrid,
  suggestExtractOutSize,
} from "../tile/displayExtract.js";

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
  /** Enable pointer-drag pan + wheel zoom. Default true. */
  interactionEnabled?: boolean;
  /** Zoom factor per wheel notch ( >1 ). Default 1.1. */
  wheelZoomFactor?: number;
  /** Cursor readout in physical units (MainChartHost). */
  onCursor?: (state: {
    xValue: number;
    yValue: number;
    xCss: number;
    yCss: number;
  }) => void;
  /**
   * Fired when pan/zoom updates physical axis ranges.
   * Does not carry detection coords — view domains only.
   */
  onViewChange?: (view: ViewState) => void;
}

const MARGIN = { left: 52, right: 12, top: 10, bottom: 36 };

function toViewDomain(
  d: { min: number; max: number; unit?: string; label?: string },
): ViewDomain {
  return { min: d.min, max: d.max, unit: d.unit, label: d.label };
}

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
    interactionEnabled = true,
    wheelZoomFactor = 1.1,
    onCursor,
    onViewChange,
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
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const viewRef = useRef<ViewState>({
    xDomain: toViewDomain(xDomain),
    yDomain: toViewDomain(yDomain),
  });
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const onCursorRef = useRef(onCursor);
  onCursorRef.current = onCursor;

  const [cursor, setCursor] = useState<CursorOverlayState>({
    xCss: null,
    yCss: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [webglState, setWebglState] = useState<WebGlUiState>("ok");
  const [restoreEpoch, setRestoreEpoch] = useState(0);
  const [layoutEpoch, setLayoutEpoch] = useState(0);
  const [interactionMode, setInteractionMode] = useState<PreviewRefineMode>("idle");
  const [view, setView] = useState<ViewState>(() => ({
    xDomain: toViewDomain(xDomain),
    yDomain: toViewDomain(yDomain),
  }));
  const lastExtractMs = useRef(0);

  // Sync prop domains into local view when host changes them (not mid-drag).
  useEffect(() => {
    if (dragRef.current) return;
    const next: ViewState = {
      xDomain: toViewDomain(xDomain),
      yDomain: toViewDomain(yDomain),
    };
    viewRef.current = next;
    setView(next);
  }, [
    xDomain.min,
    xDomain.max,
    xDomain.unit,
    xDomain.label,
    yDomain.min,
    yDomain.max,
    yDomain.unit,
    yDomain.label,
  ]);

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

  const commitView = (next: ViewState) => {
    viewRef.current = next;
    setView(next);
    onViewChangeRef.current?.(next);
  };

  // Init GL once
  useEffect(() => {
    const canvas = glRef.current;
    if (!canvas) return;
    try {
      const handle = createWebGL2Context(canvas, {
        // Keep color buffer for Playwright / host screenshots of the GL layer.
        preserveDrawingBuffer: true,
        onContextLost: () => {
          const plan = planHeatmapContextRestore("lost", !!rendererRef.current);
          setWebglState(plan.uiState);
          setError("WebGL context lost");
        },
        onContextRestored: () => {
          const plan = planHeatmapContextRestore(
            "restored",
            !!rendererRef.current,
          );
          setWebglState(plan.uiState);
          if (plan.disposeRenderer) {
            try {
              rendererRef.current?.dispose();
            } catch {
              // GL may already be invalid
            }
          }
          const gl = handle.restore() ?? handle.gl;
          if (plan.createRenderer) {
            rendererRef.current = new HeatmapRenderer(gl, orientation);
          }
          setError(null);
          setRestoreEpoch((n) => n + 1);
          // After one frame of "restored", settle to ok for steady-state hosts.
          setTimeout(() => {
            setWebglState((s) => (s === "restored" ? "ok" : s));
          }, 0);
        },
      });
      handleRef.current = handle;
      rendererRef.current = new HeatmapRenderer(handle.gl, orientation);
      setWebglState(nextWebGlUiState("ok", "init-ok"));
      setError(null);
    } catch (e) {
      setWebglState(nextWebGlUiState("ok", "init-fail"));
      setError(e instanceof Error ? e.message : String(e));
    }
    preview.current = new PreviewRefineController({
      onPreview: () => setInteractionMode("preview"),
      onRefine: () => setInteractionMode("refine"),
      onIdle: () => setInteractionMode("idle"),
      onModeChange: (mode) => setInteractionMode(mode),
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

  // Re-measure CSS box + DPR on container resize / window resize (C-03).
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setLayoutEpoch((n) => n + 1));
    };
    bump();
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    const ro = RO ? new RO(bump) : null;
    ro?.observe(wrap);
    window.addEventListener("resize", bump);
    // CDP / OS DPR changes do not always fire resize or ResizeObserver.
    let lastDpr = window.devicePixelRatio;
    const dprTimer = window.setInterval(() => {
      if (window.devicePixelRatio !== lastDpr) {
        lastDpr = window.devicePixelRatio;
        bump();
      }
    }, 100);
    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      window.removeEventListener("resize", bump);
      window.clearInterval(dprTimer);
    };
  }, []);

  // Resize + draw
  useEffect(() => {
    const wrap = wrapRef.current;
    const glCanvas = glRef.current;
    const axisCanvas = axisRef.current;
    const cursorCanvas = cursorRef.current;
    const renderer = rendererRef.current;
    const handle = handleRef.current;
    if (!wrap || !glCanvas || !axisCanvas || !cursorCanvas || !renderer || !handle) return;
    if (handle.isLost || webglState === "lost") return;

    const cssW = Math.max(1, wrap.clientWidth);
    const cssH =
      typeof height === "number"
        ? height
        : Math.max(1, wrap.clientHeight || 280);
    const dpr = resolveDevicePixelRatio(window.devicePixelRatio);

    const glSize = applyCanvasDpr(glCanvas, {
      cssWidth: cssW,
      cssHeight: cssH,
      devicePixelRatio: dpr,
    });
    wrap.setAttribute("data-dpr", String(glSize.dpr));
    wrap.setAttribute("data-buffer-width", String(glSize.bufferWidth));
    wrap.setAttribute("data-buffer-height", String(glSize.bufferHeight));
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

    const viewNow = viewRef.current;

    // Display-only extract: preview = coarse, refine/idle = denser. Never attaches Hz/markers.
    const outSize = suggestExtractOutSize({
      sourceWidth: widthBins,
      sourceHeight: heightBins,
      plotCssWidth: plotW,
      plotCssHeight: plotH,
      mode: interactionMode === "preview" ? "preview" : "refine",
    });
    const extracted = extractDisplayGrid({
      source: scalar,
      sourceWidth: widthBins,
      sourceHeight: heightBins,
      srcX: 0,
      srcY: 0,
      srcW: widthBins,
      srcH: heightBins,
      outW: outSize.outW,
      outH: outSize.outH,
      reduce: interactionMode === "preview" ? "nearest" : "peak",
    });
    lastExtractMs.current = extracted.extractMs;

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
    const bx0 = Math.round(MARGIN.left * glSize.dpr);
    const by0 = Math.round(MARGIN.top * glSize.dpr);
    const bw = Math.round(plotW * glSize.dpr);
    const bh = Math.round(plotH * glSize.dpr);
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(0, 0, glSize.bufferWidth, glSize.bufferHeight);
    gl.clearColor(0.06, 0.07, 0.1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.scissor(bx0, glSize.bufferHeight - by0 - bh, bw, bh);
    gl.viewport(bx0, glSize.bufferHeight - by0 - bh, bw, bh);
    renderer.draw({ levels, clear: true, clearColor: [0.06, 0.07, 0.1, 1] });
    gl.disable(gl.SCISSOR_TEST);
    gl.viewport(0, 0, glSize.bufferWidth, glSize.bufferHeight);
    void (performance.now() - t0);

    const xAxis = new PhysicalAxis({
      orientation: "horizontal",
      domain: viewNow.xDomain,
      pixelMin: MARGIN.left,
      pixelMax: cssW - MARGIN.right,
    });
    const yAxis = new PhysicalAxis({
      orientation: "vertical",
      domain: viewNow.yDomain,
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
    view.xDomain.min,
    view.xDomain.max,
    view.xDomain.label,
    view.xDomain.unit,
    view.yDomain.min,
    view.yDomain.max,
    view.yDomain.label,
    view.yDomain.unit,
    height,
    cursor,
    showCursor,
    interactionMode,
    axisOverlay,
    cursorOverlay,
    restoreEpoch,
    layoutEpoch,
    webglState,
  ]);

  const readAxes = (cssW: number, cssH: number) => {
    const v = viewRef.current;
    const xAxis = new PhysicalAxis({
      orientation: "horizontal",
      domain: v.xDomain,
      pixelMin: MARGIN.left,
      pixelMax: cssW - MARGIN.right,
    });
    const yAxis = new PhysicalAxis({
      orientation: "vertical",
      domain: v.yDomain,
      pixelMin: MARGIN.top,
      pixelMax: cssH - MARGIN.bottom,
      invertPixel: true,
    });
    return { xAxis, yAxis, xSpan: xAxis.mapping, ySpan: yAxis.mapping };
  };

  const emitCursor = (xCss: number, yCss: number, cssW: number, cssH: number) => {
    const { xAxis, yAxis } = readAxes(cssW, cssH);
    const xValue = xAxis.toValue(xCss);
    const yValue = yAxis.toValue(yCss);
    const xd = viewRef.current.xDomain;
    const yd = viewRef.current.yDomain;
    const next: CursorOverlayState = {
      xCss,
      yCss,
      labelX: `${xValue.toPrecision(6)}${xd.unit ? " " + xd.unit : ""}`,
      labelY: `${yValue.toPrecision(6)}${yd.unit ? " " + yd.unit : ""}`,
      visible: true,
    };
    setCursor(next);
    onCursorRef.current?.({ xValue, yValue, xCss, yCss });
  };

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactionEnabled || ev.button !== 0) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.setPointerCapture(ev.pointerId);
    dragRef.current = {
      pointerId: ev.pointerId,
      lastX: ev.clientX,
      lastY: ev.clientY,
    };
    preview.current?.noteInteraction();
  };

  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;
    const cssW = rect.width;
    const cssH = rect.height;

    const drag = dragRef.current;
    if (interactionEnabled && drag && drag.pointerId === ev.pointerId) {
      const dx = ev.clientX - drag.lastX;
      const dy = ev.clientY - drag.lastY;
      drag.lastX = ev.clientX;
      drag.lastY = ev.clientY;
      preview.current?.noteInteraction();
      const { xAxis, yAxis } = readAxes(cssW, cssH);
      const next = panView(
        viewRef.current,
        dx,
        dy,
        { pixelMin: xAxis.mapping.pixelMin, pixelMax: xAxis.mapping.pixelMax },
        { pixelMin: yAxis.mapping.pixelMin, pixelMax: yAxis.mapping.pixelMax },
      );
      commitView(next);
    } else {
      preview.current?.noteInteraction();
    }
    emitCursor(xCss, yCss, cssW, cssH);
  };

  const endDrag = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === ev.pointerId) {
      dragRef.current = null;
      preview.current?.requestRefine();
    }
  };

  const onPointerLeave = () => {
    if (!dragRef.current) {
      setCursor({ xCss: null, yCss: null, visible: false });
      preview.current?.requestRefine();
    }
  };

  const onWheel = (ev: ReactWheelEvent<HTMLDivElement>) => {
    if (!interactionEnabled) return;
    ev.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    preview.current?.noteInteraction();
    const rect = wrap.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;
    const { xAxis, yAxis } = readAxes(rect.width, rect.height);
    const factor = wheelDeltaToZoomFactor(ev.deltaY, wheelZoomFactor);
    const next = zoomViewAt(
      viewRef.current,
      xCss,
      yCss,
      factor,
      { pixelMin: xAxis.mapping.pixelMin, pixelMax: xAxis.mapping.pixelMax },
      { pixelMin: yAxis.mapping.pixelMin, pixelMax: yAxis.mapping.pixelMax },
    );
    commitView(next);
    emitCursor(xCss, yCss, rect.width, rect.height);
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      data-testid={testId}
      data-interaction-mode={interactionMode}
      data-webgl-state={webglState}
      data-dpr="1"
      data-buffer-width="0"
      data-buffer-height="0"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={onPointerLeave}
      onWheel={onWheel}
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        background: "#0f1218",
        touchAction: interactionEnabled ? "none" : undefined,
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
