# @wss/charts (Bot-C)

Custom **WebGL2** charts for Web Signal Studio: spectrum heatmap / waterfall / STFT display path, physical axes, DPI sizing, interactive preview vs idle refine, and performance probes.

**Not** based on echarts / plotly / chart.js / uPlot.

## Public surface

```ts
import {
  createWebGL2Context,
  HeatmapRenderer,
  PhysicalAxis,
  DisplayExtract,
  PreviewRefineController,
  sizeCanvasForDpr,
  writePerformanceProbe,
  COLORMAPS,
} from "@wss/charts";

import { SpectrumHeatmapDemo } from "@wss/charts/react";
```

## Wire into `apps/web`

1. In `apps/web/package.json` add dependency:
   `"@wss/charts": "file:../../packages/charts"`
2. In `apps/web/vite.config.ts` resolve the package (alias already used in this repo after Bot-C wiring).
3. Import demo:
   ```tsx
   import { SpectrumHeatmapDemo } from "@wss/charts/react";
   ```
4. Run:
   ```powershell
   cd D:\project\web_signal_studio\packages\charts
   npm install --cache ..\..\.work\cache\npm
   cd D:\project\web_signal_studio\apps\web
   npm install --cache ..\..\.work\cache\npm
   npm run dev
   ```
   Open the heatmap demo page (default App after wiring).

## Ownership rules (product)

- Waterfall: X = frequency, Y = time (down)
- STFT spectrogram: X = time, Y = frequency
- Scalar intensity texture + **independent LUT** — colormap / level change must **not** rewrite scalar data or imply FFT
- Display tile/extract for pixels must **not** pollute detection business coordinates
- Interactive preview vs idle refinement hooks
- Probes write under `artifacts/validation/bot-c/`

## What works now vs stub

| Area | Status |
|------|--------|
| WebGL2 context create / loss / restore | Implemented |
| Heatmap scalar texture + independent LUT | Implemented (demo) |
| Physical axis mapping | Implemented + unit tests |
| DPI / devicePixelRatio canvas sizing | Implemented + unit tests |
| Display extract (peakReduce2D-style) | Implemented (CPU; no detection coords) |
| Preview vs refine controller | Implemented (timer hooks) |
| Axis / cursor overlay (2D canvas) | Implemented in demo |
| Waveform / PSD line paths | Stub interfaces only |
| Tile streaming / ring history | Stub interfaces |
| Real STFT/PSD data from Bot-D | Not owned — synthetic demo matrix |
