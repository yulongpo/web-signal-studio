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
  PhysicalAxis,
  type AxisDomain,
  type AxisOrientation,
  type AxisMapping,
} from "./axis/physicalAxis.js";

export {
  COLORMAPS,
  buildLutRgba8,
  type ColormapName,
} from "./lut/colormaps.js";

export {
  extractDisplayGrid,
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
} from "./overlay/cursorOverlay.js";

export {
  writePerformanceProbe,
  PerformanceProbeSession,
  type ProbeSample,
  type ProbeWriteResult,
} from "./probe/performanceProbe.js";

export { SpectrumHeatmapDemo } from "./react/SpectrumHeatmapDemo.js";
export { HeatmapDemo } from "./react/HeatmapDemo.js";
