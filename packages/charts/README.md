# @wss/charts (Bot-C)

Custom **WebGL2** charts for Web Signal Studio: spectrum heatmap / waterfall display path, physical axes, DPI sizing, interactive preview vs idle refine, and performance probes.

**Not** based on echarts / plotly / chart.js / uPlot.

## Embed (Bot-B)

```ts
import { HeatmapCanvas, SpectrumChart } from "@wss/charts";
// or
import { SpectrumHeatmapDemo } from "@wss/charts/react";
```

See `docs/implementation/bot-c/STATUS.md`.

## Dev

```powershell
cd D:\project\wss-wt-c\packages\charts
npm install
npm run typecheck
npm test
```

## Rules

- Scalar intensity texture + **independent LUT** (colormap/levels must not rewrite scalar / imply FFT)
- Axis + cursor are separate 2D overlay layers
- Display extract (extractDisplayGrid / extractViewportTile) must not pollute detection / Hz / marker coordinates\n- PreviewRefineController: cheap preview while interacting; refine after idle\n- DPI: sizeCanvasForDpr / ttachCanvasResize\n- Probes: writeChartsValidationProbe -> rtifacts/validation/bot-c/
- Probes → `artifacts/validation/bot-c/`
