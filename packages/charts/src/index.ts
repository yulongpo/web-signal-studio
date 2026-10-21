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
  nextWebGlUiState,
  planHeatmapContextRestore,
  attachWebGlContextLifecycle,
  type WebGlUiState,
  type WebGlUiEvent,
  type HeatmapRestorePlan,
  type ContextLifecycleCallbacks,
} from "./webgl/contextRestore.js";

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
  panDomain,
  zoomDomain,
  panView,
  zoomViewAt,
  wheelDeltaToZoomFactor,
  clampZoomSpan,
  domainsEqual,
  domainSpan,
  type ViewDomain,
  type ViewState,
  type PixelSpan,
} from "./interaction/viewTransform.js";

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
  runSyntheticInteractionProbe,
  percentile,
  aggregateMsStats,
  type ProbeSample,
  type ProbeWriteResult,
  type ProbeWriteOptions,
  type ProbePayload,
  type ChartsProbeFields,
  type ProbeMode,
  type MsPercentiles,
  type SyntheticInteractionLoopOptions,
} from "./probe/performanceProbe.js";

export { HeatmapCanvas, type HeatmapCanvasProps } from "./react/HeatmapCanvas.js";
export { SpectrumChart, type SpectrumChartProps } from "./react/SpectrumChart.js";
export { SpectrumHeatmapDemo } from "./react/SpectrumHeatmapDemo.js";
export { HeatmapDemo } from "./react/HeatmapDemo.js";


export {
  createSpectrogramTileSource,
  SpectrogramRingBuffer,
  physicalRangeToSourceWindow,
  viewToSourceWindow,
  type SpectrogramOrientation,
  type FreqTimeExtent,
  type SpectrogramGridSnapshot,
  type SpectrogramGrid,
  type SpectrogramTileRequest,
  type SpectrogramTileSource,
  type CreateSpectrogramTileSourceOptions,
} from "./tile/spectrogramGrid.js";


export {
  dualWriteEvidenceFile,
  dualWriteEvidenceJson,
  dualCopyEvidenceFile,
  ensureEvidenceDirs,
  evidenceDirs,
  resolveProbeRepoRoot,
  DOCS_EVIDENCE_REL,
  ARTIFACTS_EVIDENCE_REL,
  type DualWriteOptions,
} from "./probe/dualWriteEvidence.js";

export {
  collectGpuWebglProbe,
  collectGpuWebglProbeFromEnvironment,
  type GpuWebglProbeFields,
  type CollectGpuWebglProbeOptions,
} from "./probe/gpuWebglProbe.js";

export {
  runContextRestoreProbe,
  type ContextRestoreProbePayload,
  type ContextRestoreTransition,
} from "./probe/contextRestoreProbe.js";

export {
  runC02LiveDisplayOnlyExtractProbe,
  buildLiveProbeSource,
  C02_LIVE_EXTRACT_FILE,
  type C02LiveExtractPayload,
  type C02ExtractSummary,
  type RunC02LiveExtractOptions,
} from "./probe/c02DisplayOnlyExtractProbe.js";

export {
  runIdleSettleInteractionP95Probe,
  solidifyInteractionP95Evidence,
  writeCondensedInteractionP95,
  INTERACTION_P95_FILE,
  INTERACTION_P95_CONDENSED_FILE,
  IDLE_REFINE_EVIDENCE_FILE,
  type IdleSettleProbeOptions,
} from "./probe/interactionP95Probe.js";

export { WaveformChart, type WaveformChartProps, type WaveformKind } from "./react/WaveformChart.js";
export { NavigationChart, type NavigationChartProps } from "./react/NavigationChart.js";
export { VerticalSplitter, type VerticalSplitterProps } from "./react/VerticalSplitter.js";
