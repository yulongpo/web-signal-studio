# Bot-C STATUS — packages/charts

Updated: 2026-10-21 Asia/Shanghai  
Branch: `work/bot-c-charts`  
Worktree: `D:\project\wss-wt-c` only.  
Synced main tip: `f9f4616` (QA-G: M-03/M-04/C-01/C-03/C-04 PASS; C-02 WIP).  
Latest: **C-P3** — C-02 live display-only tile extract dual-write + interaction p95 / idle-settle evidence (**C-02 remains WIP — never self-PASS**).

## Embed API additions

```ts
import {
  createSpectrogramTileSource,
  SpectrogramRingBuffer,
  collectGpuWebglProbe,
  runContextRestoreProbe,
  dualWriteEvidenceJson,
  runC02LiveDisplayOnlyExtractProbe,
  runIdleSettleInteractionP95Probe,
} from "@wss/charts";
```

| API | Role |
|-----|------|
| `createSpectrogramTileSource` | Physical-view crop → display-only tile via extract helpers |
| `SpectrogramRingBuffer` | Fixed-capacity frame append without reallocating history |
| `collectGpuWebglProbe` | C-01 schema (`gpuAvailable`, lutSize, textureFormat, …) |
| `runContextRestoreProbe` | C-04 lost→restored transition JSON |
| `dualWriteEvidenceJson` / `dualWriteEvidenceFile` | Mirror probes to docs + artifacts |
| `runC02LiveDisplayOnlyExtractProbe` | **C-02 live** grid/viewport/spectrogram extract + dual-write |
| `runIdleSettleInteractionP95Probe` | C-P3 p95 + idle-timer refine evidence |

## Acceptance evidence

See `docs/acceptance/evidence/bot-c/BOT_C_PROBE_INDEX.md` (mirrored under `artifacts/validation/bot-c/`).

| Gate | Status owner | Notes |
|------|--------------|-------|
| M-03 / M-04 / C-01 / C-03 / C-04 | **PASS by WSS-QA-G** | Do not flip back (M-04 PASS @ 0898ec7/b82e324) |
| **C-02** | **WIP** | Live extract evidence: `c02_display_only_extract_live_2026-10-21.json` (dual-written). Schema file kept. **Not PASS.** |

## CI notes

- Job `packages-charts`: typecheck + unit.
- Job **`charts-playwright`**: Playwright Chromium + ANGLE/SwiftShader; uploads bot-c evidence. Hard-enabled.
- Job `e2e`: still `if: false` for **non-charts** specs only.

## Working vs stub

| Item | Status |
|------|--------|
| WebGL2 heatmap + independent LUT | Working |
| Axis + cursor overlay APIs | Working |
| HeatmapCanvas / SpectrumChart pan-zoom + onViewChange | Working |
| WebGL context loss restore + `data-webgl-state` | Working |
| DPI sizing + data-dpr / data-buffer-* attrs | Working |
| Tile / viewport display extract (display-only) | Working + **C-02 live dual-write** |
| M-04 Playwright pan/zoom | PASS by G |
| Interaction p95 + idle settle evidence | C-P3 dual-write (WIP pointers) |
| Waveform / PSD line GL path | Stub type only |
| Bot-D live STFT wiring | Not owned |

## Ownership

- Bot-C owns `packages/charts` and `docs/implementation/bot-c/`.
- Bot-B owns `apps/web` shell; e2e specs under `apps/web/e2e` for QA evidence only.
- Forbidden: echarts / plotly / chart.js / uPlot as primary renderer.
- **Never set matrix PASS** — WSS-QA-G only. C-02 stays WIP until G re-review.
