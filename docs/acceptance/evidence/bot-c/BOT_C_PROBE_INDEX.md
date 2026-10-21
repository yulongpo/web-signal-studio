# Bot-C probe evidence index

> Owner of status PASS: **WSS-QA-G** only. This package places **WIP** evidence; Bot-C does **not** claim PASS.

Updated: 2026-10-21 (Asia/Shanghai)  
Worktree: `D:\\project\\wss-wt-c` · branch `work/bot-c-charts`  
Synced main tip: **`175054d`**  
This commit: QA-G re-review — healthy WebGL screenshots + live GPU / DPR / context-restore (WIP).

## Unit test count (single source of truth)

Run: `cd packages/charts && npm test`  
**Current `@wss/charts` vitest count = 52** (also in `p2c_charts_gate_2026-10-21.json` → `samples[0].meta.tests`).

## Dual placement

| Kind | Tracked / review path | Runtime / CI log path |
|------|------------------------|------------------------|
| Screenshots + JSON probes | `docs/acceptance/evidence/bot-c/` | `artifacts/validation/bot-c/` |
| Playwright HTML / traces | — | `artifacts/validation/p1g/playwright-report/` |

The charts QA evidence spec writes **both** docs + artifacts copies.

## What each probe / evidence file measures

| File (tracked here) | Gate | Measures |
|---------------------|------|----------|
| `m03_psd_stft_golden_meta_2026-10-21.json` | M-03 | Points at `packages/charts/src/dsp/psdStftGolden.test.ts` Float32 golden bins |
| `m03_spectrum_chart.png` / `m03_chart_main.png` | M-03 | Playwright screenshot with `data-webgl-state=ok` (heatmap + axes) |
| `m03_screenshot_meta_2026-10-21.json` | M-03 | Meta for healthy shot + gpuAvailable |
| `m04_playwright_pan_zoom_2026-10-21.json` | M-04 | Playwright pan/zoom → `data-interaction-mode` |
| `charts_probe_gpu_webgl_lut_2026-10-21.json` | C-01 | **Live** page-eval GPU probe (`gpuAvailable`, version, LUT, vendor) |
| `c02_display_only_schema_2026-10-21.json` | C-02 | displayOnly JSON + forbidden keys |
| `c03_resize_dpr_2026-10-21.json` + `c03_resize_chart.png` | C-03 | Viewport + CDP `deviceScaleFactor=2`; buffer ≈ css×dpr |
| `charts_probe_context_restore_2026-10-21.json` | C-04 | **Live** `WEBGL_lose_context` lost→restored/ok |
| `charts_probe_interaction_p95_2026-10-21.json` | C-04 related | CPU synthetic P50/P95 (annotated no GPU) |
| `p2c_charts_gate_2026-10-21.json` | gate | typecheck + test count **52** |

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

Playwright Chromium launch args (see `apps/web/playwright.config.ts`): `--use-gl=angle`, `--use-angle=swiftshader-webgl`, `--enable-webgl`, `--ignore-gpu-blocklist`, `--enable-unsafe-swiftshader`.

## CI note for QA logs

- `packages/charts` unit + typecheck: job `packages-charts` in `.github/workflows/ci.yml` (when present) or local `npm test -w @wss/charts`.
- Charts Playwright evidence is **local / HH-laptop** (WebGL ANGLE). CI `e2e` job is currently `if: false`; QA should pull screenshots from `docs/acceptance/evidence/bot-c/` and/or `artifacts/validation/bot-c/` committed from Bot-C worktree runs.

**Do not set PASS here.** QA verifies against these paths.
