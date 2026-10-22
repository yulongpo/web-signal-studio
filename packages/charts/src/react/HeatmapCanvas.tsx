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
import {
  ColorbarOverlay,
  colorScaleTickLabels,
  type ColorScaleDb,
} from "../overlay/colorbarOverlay.js";
import { CursorOverlay, type CursorOverlayState } from "../overlay/cursorOverlay.js";
import { applyCanvasDpr, resolveDevicePixelRatio } from "../dpi/canvasSizing.js";
import {
  PreviewRefineController,
  type PreviewRefineMode,
} from "../interaction/previewRefine.js";
import {
  BOX_ZOOM_MIN_EDGE_PX,
  isBoxZoomLargeEnough,
  panView,
  viewFromPhysicalBox,
  zoomViewAt,
  wheelDeltaToZoomFactor,
  type ViewDomain,
  type ViewState,
} from "../interaction/viewTransform.js";
import {
  hitChartZone,
  resolvePointerDragMode,
  resolveInteractionCursor,
  type ChartDragMode,
  type InteractionCursor,
} from "../interaction/chartHitZone.js";
import { formatPhysicalCaptionPair } from "../axis/physicalCaption.js";
import {
  HEATMAP_COLORBAR,
  heatmapPlotMargin,
  stripOffsetForMargin,
} from "./plotMargin.js";
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
  /** Desktop colorScale strip; host wires uiStore.display.showColorScale. */
  showColorScale?: boolean;
  /** dB annotations for the colorScale strip. */
  colorScaleDb?: ColorScaleDb;
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
  /**
   * `uniform` zooms X and Y together.
   * `desktop-axis` matches Qt Signal Studio @ 17471a6: wheel on the plot or
   * bottom axis zooms X only; wheel on the left axis zooms Y only. Drag on an
   * axis pans that axis only (axis-only pan). Plot-body drag never pans under
   * this model — it follows {@link gesture} (zoom-box / box).
   */
  wheelModel?: "uniform" | "desktop-axis";
  /**
   * Plot-body drag when the pointer is inside the plot rect:
   * - `zoom-box`: zoom the view into a box (both edges >= {@link BOX_ZOOM_MIN_EDGE_PX})
   * - `box`: selection / ROI box
   * - `pan`: with `desktop-axis`, plot-body pan is disabled (axis-only); with
   *   `uniform`, legacy pan-both remains for demos.
   * Axis-region drags always pan that axis.
   */
  gesture?: "pan" | "box" | "zoom-box";
  /**
   * External view apply. `seq` must change to take effect (nav, fit, history).
   * Does not echo `onViewChange`.
   */
  viewCommand?: { seq: number; view: ViewState } | null;
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
  /** Pointer-up after a pan/zoom gesture; `before` is the view at pointer-down. */
  onViewCommit?: (before: ViewState) => void;
  /**
   * Box gesture commit in physical axis units (half-open is not implied;
   * both edges are inclusive display bounds). `null` clears.
   */
  onBoxCommit?: (
    box: { xMin: number; xMax: number; yMin: number; yMax: number } | null,
  ) => void;
  /** G18 linked / pinned cursor in physical axis units. */
  linkedCursor?: { xValue: number; yValue: number; pinned?: boolean } | null;
  /** Click-to-pin on plot (desktop pinAt); too-small box / tiny pan. */
  onPinCursor?: (state: { xValue: number; yValue: number }) => void;
}

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
    showColorScale = false,
    colorScaleDb,
    xDomain = { min: 0, max: 1, label: "X" },
    yDomain = { min: 0, max: 1, label: "Y" },
    className,
    style,
    height = 280,
    showCursor = true,
    testId = "heatmap-canvas",
    interactionEnabled = true,
    wheelZoomFactor = 1.1,
    wheelModel = "uniform",
    gesture = "pan",
    viewCommand = null,
    onCursor,
    onViewChange,
    onViewCommit,
    onBoxCommit,
    linkedCursor = null,
    onPinCursor,
  } = props;

  const margin = heatmapPlotMargin(Boolean(showColorScale && colorScaleDb));
  const MARGIN = margin;
  const wrapRef = useRef<HTMLDivElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const axisRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLCanvasElement>(null);

  const handleRef = useRef<WebGL2ContextHandle | null>(null);
  const rendererRef = useRef<HeatmapRenderer | null>(null);
  const axisOverlay = useRef(new AxisOverlay()).current;
  const colorbarOverlay = useRef(new ColorbarOverlay()).current;
  const cursorOverlay = useRef(new CursorOverlay()).current;
  const preview = useRef<PreviewRefineController | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    lastX: number;
    lastY: number;
    originX: number;
    originY: number;
    mode: Exclude<ChartDragMode, "none">;
    before: ViewState;
  } | null>(null);
  const [boxCss, setBoxCss] = useState<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  } | null>(null);
  /** CSS cursor: grab/grabbing on axes (OpenHand/ClosedHand), crosshair on plot ZoomBox. */
  const [interactionCursor, setInteractionCursor] = useState<InteractionCursor | null>(null);
  const gestureRef = useRef(gesture);
  gestureRef.current = gesture;
  const wheelModelRef = useRef(wheelModel);
  wheelModelRef.current = wheelModel;
  const onViewCommitRef = useRef(onViewCommit);
  onViewCommitRef.current = onViewCommit;
  const onBoxCommitRef = useRef(onBoxCommit);
  onBoxCommitRef.current = onBoxCommit;
  const viewCommandRef = useRef(viewCommand);
  viewCommandRef.current = viewCommand;
  const viewRef = useRef<ViewState>({
    xDomain: toViewDomain(xDomain),
    yDomain: toViewDomain(yDomain),
  });
  const onViewChangeRef = useRef(onViewChange);
  onViewChangeRef.current = onViewChange;
  const onCursorRef = useRef(onCursor);
  onCursorRef.current = onCursor;
  const onPinCursorRef = useRef(onPinCursor);
  onPinCursorRef.current = onPinCursor;

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

  const commandSeq = viewCommand?.seq ?? 0;
  useEffect(() => {
    const cmd = viewCommandRef.current;
    if (!cmd || cmd.seq !== commandSeq || commandSeq === 0) return;
    if (dragRef.current) return;
    viewRef.current = cmd.view;
    setView(cmd.view);
  }, [commandSeq]);

  useEffect(() => {
    if (gesture !== "box" && gesture !== "zoom-box") setBoxCss(null);
  }, [gesture]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (dragRef.current?.mode === "box" || dragRef.current?.mode === "zoom-box") {
        dragRef.current = null;
        setBoxCss(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      devicePixelRatio: glSize.dpr,
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
      if (showColorScale && colorScaleDb) {
        colorbarOverlay.draw({
          ctx: axisCtx,
          width: cssW,
          height: cssH,
          margin: MARGIN,
          colormap,
          levelsDb: colorScaleDb,
        });
      }
    }

    const cCtx = cursorCanvas.getContext("2d");
    if (cCtx) {
      cCtx.setTransform(glSize.dpr, 0, 0, glSize.dpr, 0, 0);
      if (linkedCursor && linkedCursor.pinned !== false) {
        const px = xAxis.toPixel(linkedCursor.xValue);
        const py = yAxis.toPixel(linkedCursor.yValue);
        cursorOverlay.draw({
          ctx: cCtx,
          width: cssW,
          height: cssH,
          margin: MARGIN,
          state: {
            xCss: px,
            yCss: py,
            visible: true,
            labelX: `pin ${linkedCursor.xValue.toPrecision(6)}`,
            labelY: linkedCursor.yValue.toPrecision(6),
          },
          strokeStyle: "rgba(255, 120, 80, 0.95)",
          labelStyle: "rgba(255, 200, 160, 0.95)",
          lineDash: [],
        });
      } else {
        cursorOverlay.draw({
          ctx: cCtx,
          width: cssW,
          height: cssH,
          margin: MARGIN,
          state: { xCss: null, yCss: null },
        });
      }
      if (showCursor) {
        cursorOverlay.draw({
          ctx: cCtx,
          width: cssW,
          height: cssH,
          margin: MARGIN,
          state: cursor,
          clear: false,
        });
      }
    }
  }, [
    scalar,
    widthBins,
    heightBins,
    colormap,
    showColorScale,
    colorScaleDb?.referenceLevelDb,
    colorScaleDb?.dynamicRangeDb,
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
    linkedCursor?.xValue,
    linkedCursor?.yValue,
    linkedCursor?.pinned,
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


  const updateInteractionCursor = (
    xCss: number,
    yCss: number,
    cssW: number,
    cssH: number,
    dragMode: ChartDragMode | null,
  ) => {
    if (!interactionEnabled) {
      setInteractionCursor(null);
      return;
    }
    const desktop = wheelModelRef.current === "desktop-axis";
    if (!desktop) {
      if (gestureRef.current === "zoom-box" || gestureRef.current === "box") {
        setInteractionCursor("crosshair");
      } else {
        setInteractionCursor(null);
      }
      return;
    }
    const zone = hitChartZone(xCss, yCss, cssW, cssH, MARGIN);
    const pan =
      dragMode === "pan-x" || dragMode === "pan-y" || dragMode === "pan-both";
    const selecting = dragMode === "box" || dragMode === "zoom-box";
    setInteractionCursor(resolveInteractionCursor({ zone, pan, selecting }));
  };

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactionEnabled || ev.button !== 0) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;
    const cssW = rect.width;
    const cssH = rect.height;
    const desktop = wheelModelRef.current === "desktop-axis";
    const zone = desktop
      ? hitChartZone(xCss, yCss, cssW, cssH, MARGIN)
      : "plot";
    const mode = resolvePointerDragMode({
      zone,
      gesture: gestureRef.current,
      axisOnlyPan: desktop,
    });
    if (mode === "none") {
      // Axis-only pan: ignore plot-body pan and non-hit corners under desktop-axis.
      emitCursor(xCss, yCss, cssW, cssH);
      updateInteractionCursor(xCss, yCss, cssW, cssH, null);
      return;
    }
    wrap.setPointerCapture(ev.pointerId);
    dragRef.current = {
      pointerId: ev.pointerId,
      lastX: ev.clientX,
      lastY: ev.clientY,
      originX: xCss,
      originY: yCss,
      mode,
      before: {
        xDomain: { ...viewRef.current.xDomain },
        yDomain: { ...viewRef.current.yDomain },
      },
    };
    if (mode === "box" || mode === "zoom-box") {
      setBoxCss({ x0: xCss, y0: yCss, x1: xCss, y1: yCss });
    }
    updateInteractionCursor(xCss, yCss, cssW, cssH, mode);
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
      if (drag.mode === "box" || drag.mode === "zoom-box") {
        setBoxCss({ x0: drag.originX, y0: drag.originY, x1: xCss, y1: yCss });
      } else if (
        drag.mode === "pan-x" ||
        drag.mode === "pan-y" ||
        drag.mode === "pan-both"
      ) {
        const { xAxis, yAxis } = readAxes(cssW, cssH);
        const next = panView(
          viewRef.current,
          drag.mode === "pan-y" ? 0 : dx,
          drag.mode === "pan-x" ? 0 : dy,
          { pixelMin: xAxis.mapping.pixelMin, pixelMax: xAxis.mapping.pixelMax },
          { pixelMin: yAxis.mapping.pixelMin, pixelMax: yAxis.mapping.pixelMax },
        );
        commitView(next);
      }
    } else {
      preview.current?.noteInteraction();
    }
    emitCursor(xCss, yCss, cssW, cssH);
    updateInteractionCursor(
      xCss,
      yCss,
      cssW,
      cssH,
      drag && drag.pointerId === ev.pointerId ? drag.mode : null,
    );
  };

  const endDrag = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== ev.pointerId) return;
    dragRef.current = null;
    preview.current?.requestRefine();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const xCss = ev.clientX - rect.left;
    const yCss = ev.clientY - rect.top;
    updateInteractionCursor(xCss, yCss, rect.width, rect.height, null);
    if (drag.mode === "box" || drag.mode === "zoom-box") {
      const w = Math.abs(xCss - drag.originX);
      const h = Math.abs(yCss - drag.originY);
      const tooSmall =
        drag.mode === "zoom-box"
          ? !isBoxZoomLargeEnough(w, h)
          : w < 4 && h < 4;
      if (tooSmall) {
        setBoxCss(null);
        if (drag.mode === "box") onBoxCommitRef.current?.(null);
        const zone = hitChartZone(xCss, yCss, rect.width, rect.height, MARGIN);
        if (zone === "plot" && onPinCursorRef.current) {
          const { xAxis, yAxis } = readAxes(rect.width, rect.height);
          onPinCursorRef.current({
            xValue: xAxis.toValue(xCss),
            yValue: yAxis.toValue(yCss),
          });
        }
        return;
      }
      const { xAxis, yAxis } = readAxes(rect.width, rect.height);
      const xA = xAxis.toValue(drag.originX);
      const xB = xAxis.toValue(xCss);
      const yA = yAxis.toValue(drag.originY);
      const yB = yAxis.toValue(yCss);
      const box = {
        xMin: Math.min(xA, xB),
        xMax: Math.max(xA, xB),
        yMin: Math.min(yA, yB),
        yMax: Math.max(yA, yB),
      };
      if (drag.mode === "zoom-box") {
        const next = viewFromPhysicalBox(drag.before, box);
        if (next) {
          onViewCommitRef.current?.(drag.before);
          commitView(next);
        }
      }
      onBoxCommitRef.current?.(box);
      setBoxCss(null);
      return;
    }
    const moved =
      Math.abs(ev.clientX - drag.lastX) > 0 ||
      Math.abs(xCss - drag.originX) > 2 ||
      Math.abs(yCss - drag.originY) > 2;
    if (moved) onViewCommitRef.current?.(drag.before);
    else if (onPinCursorRef.current) {
      const zone = hitChartZone(xCss, yCss, rect.width, rect.height, MARGIN);
      if (zone === "plot") {
        const { xAxis, yAxis } = readAxes(rect.width, rect.height);
        onPinCursorRef.current({
          xValue: xAxis.toValue(xCss),
          yValue: yAxis.toValue(yCss),
        });
      }
    }
  };

  const onPointerLeave = () => {
    if (!dragRef.current) {
      setCursor({ xCss: null, yCss: null, visible: false });
      setInteractionCursor(null);
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
    const desktop = wheelModelRef.current === "desktop-axis";
    const wheelZone = desktop
      ? hitChartZone(xCss, yCss, rect.width, rect.height, MARGIN)
      : "plot";
    const onLeftAxis = wheelZone === "y-axis";
    const before = {
      xDomain: { ...viewRef.current.xDomain },
      yDomain: { ...viewRef.current.yDomain },
    };
    const next = zoomViewAt(
      viewRef.current,
      xCss,
      yCss,
      factor,
      { pixelMin: xAxis.mapping.pixelMin, pixelMax: xAxis.mapping.pixelMax },
      { pixelMin: yAxis.mapping.pixelMin, pixelMax: yAxis.mapping.pixelMax },
      undefined,
      desktop ? (onLeftAxis ? { x: false, y: true } : { x: true, y: false }) : undefined,
    );
    if (desktop) onViewCommitRef.current?.(before);
    commitView(next);
    emitCursor(xCss, yCss, rect.width, rect.height);
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      data-testid={testId}
      data-gesture={gesture}
      data-wheel-model={wheelModel}
      data-axis-only-pan={wheelModel === "desktop-axis" ? "true" : "false"}
      data-interaction-cursor={interactionCursor ?? ""}
      data-linked-cursor-pinned={linkedCursor && linkedCursor.pinned !== false ? "true" : "false"}
      data-box-zoom-min-px={BOX_ZOOM_MIN_EDGE_PX}
      data-box-zoom-min-edge-px={BOX_ZOOM_MIN_EDGE_PX}
      data-view-x-min={view.xDomain.min}
      data-view-x-max={view.xDomain.max}
      data-view-y-min={view.yDomain.min}
      data-view-y-max={view.yDomain.max}
      data-interaction-mode={interactionMode}
      data-webgl-state={webglState}
      data-color-scale={showColorScale ? "true" : "false"}
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
        touchAction: interactionEnabled ? "none" : undefined,
        ...style,
        cursor:
          interactionCursor ??
          (gesture === "zoom-box" || gesture === "box"
            ? "crosshair"
            : style?.cursor),
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

      {/* G02 charts-side physical caption (not Bot-B chrome / f9f05bb strip). */}
      {(() => {
        const pair = formatPhysicalCaptionPair(view.xDomain, view.yDomain);
        return (
          <div
            data-testid="chart-physical-caption"
            data-x-label={pair.x.title}
            data-y-label={pair.y.title}
            data-x-unit={pair.x.unitName}
            data-y-unit={pair.y.unitName}
            data-x-min={view.xDomain.min}
            data-x-max={view.xDomain.max}
            data-y-min={view.yDomain.min}
            data-y-max={view.yDomain.max}
            data-x-min-scaled={pair.x.minScaled}
            data-x-max-scaled={pair.x.maxScaled}
            data-y-min-scaled={pair.y.minScaled}
            data-y-max-scaled={pair.y.maxScaled}
            style={{
              position: "absolute",
              left: 8,
              top: 6,
              zIndex: 2,
              pointerEvents: "none",
              font: "11px ui-sans-serif, system-ui, sans-serif",
              color: "rgba(210,220,235,0.92)",
              background: "rgba(15,18,24,0.55)",
              borderRadius: 4,
              padding: "2px 6px",
              maxWidth: "70%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {pair.text}
          </div>
        );
      })()}

      {/* Desktop colorScale DOM legend: Playwright display-colorscale + tick text.
          Canvas ColorbarOverlay still paints the LUT strip; this node is the visible control. */}
      {showColorScale && colorScaleDb ? (
        <div
          data-testid="display-colorscale"
          data-color-scale-dom="true"
          data-colorbar-flush="true"
          aria-label="color scale"
          style={{
            position: "absolute",
            right: 0,
            top: MARGIN.top,
            bottom: MARGIN.bottom,
            width: MARGIN.right,
            zIndex: 2,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            justifyContent: "flex-start",
            paddingLeft: Math.max(
              0,
              MARGIN.right - stripOffsetForMargin(MARGIN.right),
            ),
            boxSizing: "border-box",
          }}
        >
          <div
            data-testid="display-colorscale-strip"
            style={{
              width: Math.max(HEATMAP_COLORBAR.stripWidth, 15),
              marginTop: 4,
              marginBottom: 4,
              flexShrink: 0,
              border: "1px solid rgba(129,151,177,0.95)",
              background:
                "linear-gradient(to bottom, #fde725, #5ec962, #21918c, #3b528b, #440154)",
            }}
          />
          <div
            data-testid="display-colorscale-ticks"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              marginLeft: HEATMAP_COLORBAR.labelGap,
              marginTop: 4,
              marginBottom: 4,
              font: "11px Consolas, ui-monospace, monospace",
              color: "rgba(186,213,235,0.95)",
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            {colorScaleTickLabels(colorScaleDb, 7).map((t, i) => (
              <span key={`tick-${i}`}>{t}</span>
            ))}
            <span>dB</span>
          </div>
        </div>
      ) : null}

      {boxCss ? (
        <div
          data-testid="chart-box-select"
          style={{
            position: "absolute",
            left: Math.min(boxCss.x0, boxCss.x1),
            top: Math.min(boxCss.y0, boxCss.y1),
            width: Math.abs(boxCss.x1 - boxCss.x0),
            height: Math.abs(boxCss.y1 - boxCss.y0),
            border: "1px solid #e3bf70",
            background: "rgba(227, 191, 112, 0.16)",
            pointerEvents: "none",
          }}
        />
      ) : null}
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
