# Bot-C STATUS — packages/charts

Updated: 2026-10-21 Asia/Shanghai  
Branch: `work/bot-c-charts`  
Worktree: `D:\project\wss-wt-c` only (do not write shared `web_signal_studio` tree).  
Synced main tip: `610a79c` (`610a79c464493cf600ad6b109704ca372cb2958b`) (CAO merge includes `694dc10` / prior Bot-C packages + Bot-B host).
Feature commits: tile/DPI/preview `7b21dff`; interaction P95 `694dc10`.
Acceptance evidence (tracked, WIP only): `docs/acceptance/evidence/bot-c/BOT_C_PROBE_INDEX.md`.

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


### SpectrumChart embed props (Bot-B)

- `interactionEnabled?: boolean` — pointer-drag pan + wheel zoom (default `true`). Inherited from `HeatmapCanvasProps`; set `false` for read-only host.
- `onViewChange?: (view: ViewState) => void` — physical `xDomain`/`yDomain` only (no detection coords). Safe for MainChartHost to adopt later; `onCursor` unchanged.
- Acceptance packaging: evidence under `docs/acceptance/evidence/bot-c/`; matrix M-03/M-04/C-01..C-04 are **WIP** (QA verifies PASS).

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
| Performance probe P50/P95 + synthetic interaction loop | Working; evidence under artifacts/validation/bot-c + docs/acceptance/evidence/bot-c (38 vitest) |
| Waveform / PSD line GL path | Stub type only |
| Tile streaming / ring buffer | Stub (CPU extract only) |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns `packages/charts` and `docs/implementation/bot-c/`.
- Bot-B owns `apps/web` shell; consume embeddable exports only — **do not rewrite apps/web from Bot-C**.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.



