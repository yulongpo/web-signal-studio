# Bot-C STATUS — packages/charts

Updated: 2026-10-21 Asia/Shanghai  
Branch: `work/bot-c-charts`  
Worktree: `D:\project\wss-wt-c` only (do not write shared `web_signal_studio` tree).  
Synced main tip: `8e4bf5f` (includes Bot-B MainChartHost + SpectrumChart wiring)
Latest Bot-C commit on work/bot-c-charts: report via CAO (see git log -1).
Commit (this package): `b5b03d5` (`b5b03d5cc40595cd919a324a8cf618b29542b9ca`)

## Embed API for Bot-B (`apps/web`)

```ts
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
  panView,
  zoomViewAt,
  wheelDeltaToZoomFactor,
  extractDisplayGrid,
  extractViewportTile,
  suggestExtractOutSize,
  assertDisplayOnlyExtract,
  writePerformanceProbe,
  writeChartsValidationProbe,
  PerformanceProbeSession,
  runSyntheticInteractionProbe,
  percentile,
  aggregateMsStats,
  nextWebGlUiState,
  planHeatmapContextRestore,
} from "@wss/charts";

// Or path exports:
import { HeatmapCanvas } from "@wss/charts/HeatmapCanvas";
import { SpectrumChart } from "@wss/charts/SpectrumChart";
```

### Key APIs (this package)

| API | Role |
|-----|------|
| `HeatmapCanvas` / `SpectrumChart` | Embeddable WebGL2 heatmap + axis/cursor. Optional `interactionEnabled`, `onViewChange`, keeps `onCursor`. `data-webgl-state` / `data-interaction-mode`. |
| `panView` / `zoomViewAt` / `wheelDeltaToZoomFactor` | Pure physical-domain pan/zoom math (no detection coords). |
| `extractDisplayGrid` / `extractViewportTile` | Display-pixel / viewport tile extract. **Display-only** — no Hz, markers, or detection coords. |
| `suggestExtractOutSize` | Preview (coarse) vs refine/idle (denser) out grid. |
| `sizeCanvasForDpr` / `applyCanvasDpr` / `attachCanvasResize` | DPR sizing + ResizeObserver path. |
| `PreviewRefineController` | Cheap preview during pan/zoom; refine after idle. |
| `planHeatmapContextRestore` / `nextWebGlUiState` | Context-loss restore plan + `data-webgl-state` machine. |
| `writeChartsValidationProbe` / `runSyntheticInteractionProbe` | Writes JSON under `artifacts/validation/bot-c/` with **P50/P95** `frameMs` / `extractMs`. |

### Interaction (Bot-B can adopt later)

```tsx
<SpectrumChart
  power={stftLinearPower}
  binCount={binCount}
  frameCount={frameCount}
  mode="stft"
  interactionEnabled
  onCursor={({ xValue, yValue }) => setStatusCursor(...)}
  onViewChange={({ xDomain, yDomain }) => {
    // physical axis ranges only — do not push into detection coords
  }}
/>
```

- Pointer drag → pan; wheel → zoom about cursor.
- Both call `PreviewRefineController.noteInteraction` / `requestRefine` on idle/up.
- Existing `onCursor` used by MainChartHost is unchanged.

### WebGL restore

- On `webglcontextlost` → `data-webgl-state="lost"`.
- On `webglcontextrestored` → dispose/rebuild `HeatmapRenderer`, re-upload scalar+LUT, `data-webgl-state="restored"` then `"ok"`.

## Layering

| Layer | Tech | Responsibility |
|-------|------|----------------|
| Heatmap | WebGL2 scalar R32F + 1D RGBA LUT | Intensity only |
| Axis overlay | 2D canvas | Physical ticks / labels |
| Cursor overlay | 2D canvas | Crosshair + readout |
| View transform | CPU | Pan/zoom physical domains |
| Display extract | CPU | Preview/refine downsample (**no** detection coords) |

## Commands

```powershell
cd D:\project\wss-wt-c\packages\charts
npm install
npm run typecheck
npm test
# write real interaction P95 probe into worktree artifacts:
$env:WSS_PROBE_REPO="D:\project\wss-wt-c"; npm test -- src/probe/performanceProbe.test.ts
```

Probe evidence:

- `artifacts/validation/bot-c/charts_probe_interaction_p95_2026-10-21.json` — synthetic pan/zoom loop with `summary.frameMs.{p50,p95}` and `summary.extractMs.{p50,p95}`.

## Working vs stub

| Item | Status |
|------|--------|
| WebGL2 heatmap + independent LUT | Working |
| Axis + cursor overlay APIs | Working |
| HeatmapCanvas / SpectrumChart pan-zoom + onViewChange | Working |
| WebGL context loss restore + `data-webgl-state` | Working |
| DPI sizing + ResizeObserver helper | Working + tests |
| Tile / viewport display extract | Working + tests (display-only contract) |
| Preview/refine controller | Working + tests |
| Performance probe P50/P95 + synthetic interaction loop | Working; evidence under artifacts/validation/bot-c |
| Waveform / PSD line GL path | Stub type only |
| Tile streaming / ring buffer | Stub (CPU extract only) |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns `packages/charts` and `docs/implementation/bot-c/`.
- Bot-B owns `apps/web` shell; consume embeddable exports only — **do not rewrite apps/web from Bot-C**.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.


