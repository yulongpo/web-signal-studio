# Bot-C STATUS — packages/charts (P2-C)

Updated: 2026-10-21 Asia/Shanghai  
Branch: `work/bot-c-charts`  
Worktree: `D:\project\wss-wt-c` only (do not write shared `web_signal_studio` tree).

## Embed API for Bot-B (`apps/web`)

```tsx
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
  PreviewRefineController,
  extractDisplayGrid,
  writePerformanceProbe,
  PerformanceProbeSession,
} from "@wss/charts";

// Or path exports:
import { HeatmapCanvas } from "@wss/charts/HeatmapCanvas";
import { SpectrumChart } from "@wss/charts/SpectrumChart";
```

### Wiring sketch

1. `apps/web/package.json`: `"@wss/charts": "file:../../packages/charts"`
2. Replace `ChartPlaceholder` in main chart pane with:

```tsx
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
```

3. LUT / level UI should call props only — **do not** re-run FFT when colormap changes.

## Layering

| Layer | Tech | Responsibility |
|-------|------|----------------|
| Heatmap | WebGL2 scalar R32F + 1D RGBA LUT | Intensity only |
| Axis overlay | 2D canvas | Physical ticks / labels |
| Cursor overlay | 2D canvas | Crosshair + readout |
| Display extract | CPU | Preview downsample (no detection coords) |

## Commands

```powershell
cd D:\project\wss-wt-c\packages\charts
npm install
npm run typecheck
npm test
```

Probes (Node):

```ts
await writePerformanceProbe({ name: "paint", durationMs: 4.2 }, {
  repoRoot: "D:\\project\\wss-wt-c",
});
// -> artifacts/validation/bot-c/probe_*.json
```

## Working vs stub

| Item | Status |
|------|--------|
| WebGL2 heatmap + independent LUT | Working |
| Axis + cursor overlay APIs | Working |
| HeatmapCanvas / SpectrumChart | Working (needs GPU/browser) |
| DPI sizing | Working + tests |
| Preview/refine controller | Working (hooks only) |
| Performance probe writer | Working (Node fs) |
| Waveform / PSD line GL path | Stub type only |
| Tile streaming / ring buffer | Stub (CPU extract only) |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns `packages/charts` and `docs/implementation/bot-c/`.
- Bot-B owns `apps/web` shell; consume embeddable exports only.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.
