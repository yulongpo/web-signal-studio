# Bot-C probe evidence index

> Owner of status PASS: **WSS-QA-G** only. Bot-C places evidence; does **not** claim PASS for open gates.

Updated: 2026-10-21 (Asia/Shanghai)  
Worktree: `D:\project\wss-wt-c` · branch `work/bot-c-charts`  
Synced main tip: **`c007943`** (QA-G already PASS: M-03 / C-01 / C-03 / C-04)  
This commit: CI `charts-playwright` hard-enable + C-02 dual-write (**M-04 / C-02 remain WIP**).

## Unit test count (single source of truth)

Run: `cd packages/charts && npm test`  
**Current `@wss/charts` vitest count = 55** (C-02 dual-write case included; see `p2c_charts_gate_2026-10-21.json` after re-run).

## Dual placement

| Kind | Tracked / review path | Runtime / CI log path |
|------|------------------------|------------------------|
| Screenshots + JSON probes | `docs/acceptance/evidence/bot-c/` | `artifacts/validation/bot-c/` |
| Playwright HTML / traces | — | `artifacts/validation/p1g/playwright-report/` |

Helpers: `dualWriteEvidenceJson` / Playwright `writeBoth`. Vitest C-02 / C-01 / C-04 writers and `writePerformanceProbe` mirror into both trees when repo root is known (`WSS_PROBE_REPO` or walk-up).

## What each probe / evidence file measures

| File | Gate | Measures |
|------|------|----------|
| `m03_psd_stft_golden_meta_2026-10-21.json` | M-03 | Float32 golden bins (PASS by G) |
| `m03_spectrum_chart.png` / `m03_chart_main.png` | M-03 | Healthy WebGL screenshot (PASS by G) |
| `m04_playwright_pan_zoom_2026-10-21.json` | **M-04 WIP** | Playwright pan/zoom; also produced in CI job `charts-playwright` |
| `charts_probe_gpu_webgl_lut_2026-10-21.json` | C-01 | Live / schema GPU probe (PASS by G) |
| `c02_display_only_schema_2026-10-21.json` | **C-02 WIP** | displayOnly JSON + forbidden keys — **dual-written** docs + artifacts |
| `c03_resize_dpr_2026-10-21.json` + `c03_resize_chart.png` | C-03 | buffer ∝ css×dpr (PASS by G) |
| `charts_probe_context_restore_2026-10-21.json` | C-04 | Live lose_context restore (PASS by G) |
| `charts_probe_interaction_p95_2026-10-21.json` | C-04 related | CPU synthetic P50/P95 |
| `p2c_charts_gate_2026-10-21.json` | gate | typecheck + test count |

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

## CI

- `packages-charts`: unit + typecheck
- **`charts-playwright`**: runs `e2e/charts-qa-evidence.spec.ts`, uploads `bot-c-charts-qa-evidence` artifact (docs + `artifacts/validation/bot-c/`). **Not** gated by `if: false`.
- Legacy `e2e` job: still `if: false` for **non-charts** specs only.

**Do not set M-04 / C-02 PASS here.** QA verifies against these paths.
