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
  DisplayExtract,
  type DisplayExtractRequest,
  type DisplayExtractResult,
} from "./tile/displayExtract.js";

export {
  PreviewRefineController,
  type PreviewRefineMode,
  type PreviewRefineHooks,
} from "./interaction/previewRefine.js";

export {
  sizeCanvasForDpr,
  applyCanvasDpr,
  type CanvasDprSize,
  type CanvasDprInput,
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
  PerformanceProbeSession,
  type ProbeSample,
  type ProbeWriteResult,
  type ProbeWriteOptions,
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
