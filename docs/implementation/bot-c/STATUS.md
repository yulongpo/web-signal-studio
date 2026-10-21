# Bot-C STATUS — packages/charts

Updated: 2026-10-21 Asia/Shanghai  
Branch: work/bot-c-charts  
Worktree: D:\project\wss-wt-c only (do not write shared web_signal_studio tree).  
Synced main: 682721a

## Embed API for Bot-B (pps/web)

`	sx
import {
  HeatmapCanvas,
  SpectrumChart,
  SpectrumHeatmapDemo,
  HeatmapDemo,
  createWebGL2Context,
  HeatmapRenderer,
  PhysicalAxis,
  AxisOverlay,
  CursorOverlay,
  buildLutRgba8,
  COLORMAPS,
  sizeCanvasForDpr,
  applyCanvasDpr,
  attachCanvasResize,
  resolveDevicePixelRatio,
  PreviewRefineController,
  createPreviewRefineController,
  extractDisplayGrid,
  extractViewportTile,
  suggestExtractOutSize,
  assertDisplayOnlyExtract,
  writePerformanceProbe,
  writeChartsValidationProbe,
  PerformanceProbeSession,
} from "@wss/charts";

// Or path exports:
import { HeatmapCanvas } from "@wss/charts/HeatmapCanvas";
import { SpectrumChart } from "@wss/charts/SpectrumChart";
`

### Key APIs (this package)

| API | Role |
|-----|------|
| extractDisplayGrid / extractViewportTile | Display-pixel / viewport tile extract. **Display-only** — no Hz, markers, or detection coords (displayOnly: true, ssertDisplayOnlyExtract). |
| suggestExtractOutSize | Preview (coarse) vs refine/idle (denser) out grid for Bot-B / HeatmapCanvas. |
| sizeCanvasForDpr / pplyCanvasDpr / ttachCanvasResize | DPR sizing + ResizeObserver path; clamps maxDimension. |
| PreviewRefineController / createPreviewRefineController | Cheap preview during pan/zoom; schedules refine after idleSettleMs. Hooks: onPreview, onRefine, onIdle, onModeChange. |
| writeChartsValidationProbe / PerformanceProbeSession | Writes JSON under rtifacts/validation/bot-c/ with rameMs, extractMs, dpr, mode. |

### Wiring sketch

1. pps/web/package.json: "@wss/charts": "file:../../packages/charts"
2. Replace chart placeholder with:

`	sx
<SpectrumChart
  power={stftLinearPower}
  binCount={binCount}
  frameCount={frameCount}
  mode={mainMode === "waterfall" ? "waterfall" : "stft"}
  colormap="viridis"
  freqHz={{ min: -sr / 2, max: sr / 2 }}
  timeSec={{ min: t0, max: t1 }}
  height={420}
/>
`

3. LUT / level UI should call props only — **do not** re-run FFT when colormap changes.
4. For custom pan/zoom hosts:

`	s
const ctrl = createPreviewRefineController({
  onPreview: () => setMode("preview"),
  onRefine: () => setMode("refine"),
}, { idleSettleMs: 180 });
el.addEventListener("pointermove", () => ctrl.noteInteraction());
el.addEventListener("pointerup", () => ctrl.requestRefine());
`

## Layering

| Layer | Tech | Responsibility |
|-------|------|----------------|
| Heatmap | WebGL2 scalar R32F + 1D RGBA LUT | Intensity only |
| Axis overlay | 2D canvas | Physical ticks / labels |
| Cursor overlay | 2D canvas | Crosshair + readout |
| Display extract | CPU | Preview/refine downsample (**no** detection coords) |

## Commands

`powershell
cd D:\project\wss-wt-c\packages\charts
npm install
npm run typecheck
npm test
`

Probes (Node):

`	s
await writeChartsValidationProbe({
  name: "paint",
  frameMs: 4.2,
  extractMs: 1.1,
  dpr: 2,
  mode: "refine",
}, { repoRoot: "D:\\project\\wss-wt-c" });
// -> artifacts/validation/bot-c/charts_probe_*.json
`

## Working vs stub

| Item | Status |
|------|--------|
| WebGL2 heatmap + independent LUT | Working |
| Axis + cursor overlay APIs | Working |
| HeatmapCanvas / SpectrumChart | Working (preview/refine extract wired) |
| DPI sizing + ResizeObserver helper | Working + tests |
| Tile / viewport display extract | Working + tests (display-only contract) |
| Preview/refine controller | Working + tests + Bot-B hooks |
| Performance probe writer | Working; evidence under artifacts/validation/bot-c |
| Waveform / PSD line GL path | Stub type only |
| Tile streaming / ring buffer | Stub (CPU extract only) |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns packages/charts and docs/implementation/bot-c/.
- Bot-B owns pps/web shell; consume embeddable exports only.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.
