# Bot-C STATUS — packages/charts

Updated: 2026-10-21 Asia/Shanghai  
Branch: `work/bot-c-charts`  
Worktree: `D:\project\wss-wt-c` only.  
Synced main tip: `c007943` (QA-G PASS on M-03/C-01/C-03/C-04).  
Latest: enable CI `charts-playwright` (M-04) + C-02 dual-write to `artifacts/validation/bot-c/` (**M-04 / C-02 remain WIP — never self-PASS**).

## Embed API additions

```ts
import {
  createSpectrogramTileSource,
  SpectrogramRingBuffer,
  collectGpuWebglProbe,
  runContextRestoreProbe,
  dualWriteEvidenceJson,
} from "@wss/charts";
```

| API | Role |
|-----|------|
| `createSpectrogramTileSource` | Physical-view crop → display-only tile via extract helpers |
| `SpectrogramRingBuffer` | Fixed-capacity frame append without reallocating history |
| `collectGpuWebglProbe` | C-01 schema (`gpuAvailable`, lutSize, textureFormat, …) |
| `runContextRestoreProbe` | C-04 lost→restored transition JSON |
| `dualWriteEvidenceJson` / `dualWriteEvidenceFile` | Mirror probes to docs + artifacts |

## Acceptance evidence

See `docs/acceptance/evidence/bot-c/BOT_C_PROBE_INDEX.md` (mirrored under `artifacts/validation/bot-c/`).

| Gate | Status owner | Notes |
|------|--------------|-------|
| M-03 / C-01 / C-03 / C-04 | **PASS by WSS-QA-G** @ `3ad9035` | Do not flip back |
| **M-04** | **WIP** | CI job `charts-playwright` now runs `apps/web/e2e/charts-qa-evidence.spec.ts` (no `if: false` on this path). Non-charts e2e job remains `if: false`. |
| **C-02** | **WIP** | display-only schema JSON dual-written to docs + `artifacts/validation/bot-c/c02_display_only_schema_2026-10-21.json` |

## CI notes

- Job `packages-charts`: typecheck + unit.
- Job **`charts-playwright`**: Playwright Chromium + ANGLE/SwiftShader args from `apps/web/playwright.config.ts`; uploads `artifacts/validation/bot-c/` + docs evidence. Hard-enabled (no `continue-on-error`). If GH-hosted WebGL fails, failure is visible in logs + partial artifact upload (`if: always()`).
- Job `e2e`: still `if: false` for **non-charts** specs only.

## Working vs stub

| Item | Status |
|------|--------|
| WebGL2 heatmap + independent LUT | Working |
| Axis + cursor overlay APIs | Working |
| HeatmapCanvas / SpectrumChart pan-zoom + onViewChange | Working |
| WebGL context loss restore + `data-webgl-state` | Working |
| DPI sizing + data-dpr / data-buffer-* attrs | Working |
| Tile / viewport display extract (display-only) | Working + C-02 schema dual-write |
| M-04 Playwright pan/zoom | Evidence + **CI charts-playwright** |
| Waveform / PSD line GL path | Stub type only |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns `packages/charts` and `docs/implementation/bot-c/`.
- Bot-B owns `apps/web` shell; e2e specs under `apps/web/e2e` for QA evidence only.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.
- **Never set matrix PASS** — WSS-QA-G only. M-04 / C-02 stay WIP until G re-review.
