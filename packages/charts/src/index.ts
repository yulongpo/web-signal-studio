/**
 * @wss/charts — Bot-C public surface
 * Custom WebGL2 charts; no third-party chart library as primary path.
 */

export {
  createWebGL2Context,
  type WebGL2ContextHandle,
  type WebGL2ContextOptions,
} from "./webgl/context.js";

export {
  HeatmapRenderer,
  type HeatmapOrientation,
  type HeatmapScalarUpload,
  type HeatmapLutUpload,
  type HeatmapDrawOptions,
} from "./webgl/heatmapRenderer.js";

export {
  HEATMAP_VERT,
  HEATMAP_FRAG,
  compileShader,
  linkProgram,
} from "./webgl/shaders.js";

export {
  PhysicalAxis,
  type AxisDomain,
  type AxisOrientation,
  type AxisMapping,
} from "./axis/physicalAxis.js";

export {
  COLORMAPS,
  buildLutRgba8,
  mapScalarThroughLut,
  type ColormapName,
} from "./lut/colormaps.js";

export {
  extractDisplayGrid,
  extractViewportTile,
  suggestExtractOutSize,
  assertDisplayOnlyExtract,
  DisplayExtract,
  FORBIDDEN_DISPLAY_EXTRACT_KEYS,
  type DisplayReduce,
  type DisplayExtractRequest,
  type DisplayExtractResult,
  type ViewportTileRequest,
} from "./tile/displayExtract.js";

export {
  PreviewRefineController,
  createPreviewRefineController,
  type PreviewRefineMode,
  type PreviewRefineHooks,
  type PreviewRefineOptions,
} from "./interaction/previewRefine.js";

export {
  sizeCanvasForDpr,
  applyCanvasDpr,
  resolveDevicePixelRatio,
  needsCanvasResize,
  attachCanvasResize,
  type CanvasDprSize,
  type CanvasDprInput,
  type CanvasResizeHandle,
  type AttachCanvasResizeOptions,
} from "./dpi/canvasSizing.js";

export {
  AxisOverlay,
  type AxisOverlayDrawInput,
} from "./overlay/axisOverlay.js";

export {
  CursorOverlay,
  type CursorOverlayState,
  type CursorOverlayDrawInput,
} from "./overlay/cursorOverlay.js";

export {
  writePerformanceProbe,
  writeChartsValidationProbe,
  PerformanceProbeSession,
  type ProbeSample,
  type ProbeWriteResult,
  type ProbeWriteOptions,
  type ProbePayload,
  type ChartsProbeFields,
  type ProbeMode,
} from "./probe/performanceProbe.js";

export { HeatmapCanvas, type HeatmapCanvasProps } from "./react/HeatmapCanvas.js";
export { SpectrumChart, type SpectrumChartProps } from "./react/SpectrumChart.js";
export { SpectrumHeatmapDemo } from "./react/SpectrumHeatmapDemo.js";
export { HeatmapDemo } from "./react/HeatmapDemo.js";

/** Stub: waveform / PSD line path — filled by later Bot-C iteration. */
export interface WaveformSeriesStub {
  /** Interleaved or Y-only samples for display. */
  y: Float32Array;
  xMin: number;
  xMax: number;
  kind: "waveform" | "psd";
}
