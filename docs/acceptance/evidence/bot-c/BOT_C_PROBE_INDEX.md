# Bot-C probe evidence index

> Owner of status PASS: **WSS-QA-G** only. This package places **WIP** evidence; Bot-C does **not** claim PASS.

Updated: 2026-10-21 (Asia/Shanghai)  
Worktree: `D:\project\wss-wt-c` 路 branch `work/bot-c-charts`  
Synced main tip: **`625eb89`**  
This commit: QA-G evidence gaps M-03/M-04 + C-01..C-04 (WIP) + minimal spectrogram tile source.

## Unit test count (single source of truth)

Run: `cd packages/charts && npm test`  
**Current `@wss/charts` vitest count is recorded in `p2c_charts_gate_2026-10-21.json` 鈫?`samples[0].meta.tests` (updated this commit to match the live run; stale meta=10 removed).**

## What each probe / evidence file measures

| File (tracked here) | Gate | Measures |
|---------------------|------|----------|
| `m03_psd_stft_golden_meta_2026-10-21.json` | M-03 | Points at `packages/charts/src/dsp/psdStftGolden.test.ts` Float32 golden bins |
| `m03_spectrum_chart.png` / `m03_chart_main.png` | M-03 | Playwright screenshot of MainChartHost / SpectrumChart |
| `m04_playwright_pan_zoom_2026-10-21.json` | M-04 | Playwright pan/zoom 鈫?`data-interaction-mode` (not Node CPU alone) |
| `charts_probe_gpu_webgl_lut_2026-10-21.json` | C-01 | `gpuAvailable`, `webglVersion`, `lutSize`, `textureFormat`, vendor fields |
| `c02_display_only_schema_2026-10-21.json` | C-02 | displayOnly JSON + forbidden keys (`hz`, `markerId`, `detectionId`, 鈥? |
| `c03_resize_dpr_2026-10-21.json` + `c03_resize_chart.png` | C-03 | Playwright resize 鈫?canvas buffer + dpr |
| `charts_probe_context_restore_2026-10-21.json` | C-04 | lost鈫抮estored transitions; `gpu:false` / `gpuAvailable:false` |
| `charts_probe_interaction_p95_2026-10-21.json` | C-04 related | CPU synthetic P50/P95 (annotated no GPU) |
| `bot_c_tile_dpi_preview_2026-10-21.json` | prior | Tile/DPI/preview |
| `CONDENSED_interaction_p95.json` / `CONDENSED_tile_dpi_preview.json` | prior | Condensed numbers |
| `p2c_charts_gate_2026-10-21.json` | gate | typecheck + **aligned** test count |

## How to re-run

```powershell
cd D:\project\wss-wt-c\packages\charts
npm install
npm run typecheck
$env:WSS_PROBE_REPO="D:\project\wss-wt-c"
npm test
cd D:\project\wss-wt-c\apps\web
npx playwright test e2e/charts-qa-evidence.spec.ts
```

**Do not set PASS here.** QA verifies against these paths.

