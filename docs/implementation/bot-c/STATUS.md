# Bot-C STATUS — packages/charts

Updated: 2026-10-21 Asia/Shanghai  
Branch: `work/bot-c-charts`  
Worktree: `D:\project\wss-wt-c` only.  
Synced main tip: `625eb89`.  
Latest: QA-G evidence gaps M-03/M-04 + C-01..C-04 (WIP, never self-PASS) + minimal `createSpectrogramTileSource` / ring buffer.

## Embed API additions (this commit)

```ts
import {
  createSpectrogramTileSource,
  SpectrogramRingBuffer,
  collectGpuWebglProbe,
  runContextRestoreProbe,
} from "@wss/charts";
```

| API | Role |
|-----|------|
| `createSpectrogramTileSource` | Physical-view crop → display-only tile via extract helpers |
| `SpectrogramRingBuffer` | Fixed-capacity frame append without reallocating history |
| `collectGpuWebglProbe` | C-01 schema (`gpuAvailable`, lutSize, textureFormat, …) |
| `runContextRestoreProbe` | C-04 lost→restored transition JSON (`gpu:false` headless) |

## Acceptance evidence (WIP)

See `docs/acceptance/evidence/bot-c/BOT_C_PROBE_INDEX.md`. Matrix rows M-03/M-04/C-01..C-04 remain **WIP**.

## Working vs stub

| Item | Status |
|------|--------|
| WebGL2 heatmap + independent LUT | Working |
| Axis + cursor overlay APIs | Working |
| HeatmapCanvas / SpectrumChart pan-zoom + onViewChange | Working |
| WebGL context loss restore + `data-webgl-state` | Working |
| DPI sizing + data-dpr / data-buffer-* attrs | Working |
| Tile / viewport display extract (display-only) | Working + C-02 schema tests |
| Spectrogram tile source + ring buffer | Working (minimal) + tests |
| M-03 PSD/STFT Float32 golden vs dsp-wasm | Working (vitest) |
| M-04 Playwright pan/zoom | Evidence via `apps/web/e2e/charts-qa-evidence.spec.ts` |
| C-01 GPU/WebGL/LUT probe JSON | Working (`gpuAvailable:false` in Node) |
| C-03 Playwright resize | Evidence via e2e |
| C-04 context-restore probe | Working (simulated; gpu:false) |
| Waveform / PSD line GL path | Stub type only |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns `packages/charts` and `docs/implementation/bot-c/`.
- Bot-B owns `apps/web` shell; e2e specs under `apps/web/e2e` for QA evidence only.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.
- **Never set matrix PASS** — WSS-QA-G only.

