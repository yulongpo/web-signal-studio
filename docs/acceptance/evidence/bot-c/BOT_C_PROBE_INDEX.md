# Bot-C probe evidence index

> Owner of status PASS: **WSS-QA-G** only. Bot-C places evidence; does **not** claim PASS for open gates.

Updated: 2026-10-21 (Asia/Shanghai)  
Worktree: `D:\project\wss-wt-c` · branch `work/bot-c-charts`  
Synced main tip: **`f9f4616`** (QA-G: M-03/M-04/C-01/C-03/C-04 PASS; **C-02 still WIP**)  
This commit: **C-P3** — C-02 live display-only tile extract dual-write + interaction p95/idle-settle solidification (**C-02 remains WIP — never self-PASS**).

## Unit test count (single source of truth)

Run: `cd packages/charts && npm test`  
**Current `@wss/charts` vitest count** = re-run and read `p2c_charts_gate_2026-10-21.json` (expect prior 55 + C-02 live + idle-settle cases).

## Dual placement

| Kind | Tracked / review path | Runtime / CI log path |
|------|------------------------|------------------------|
| Screenshots + JSON probes | `docs/acceptance/evidence/bot-c/` | `artifacts/validation/bot-c/` |
| Playwright HTML / traces | — | `artifacts/validation/p1g/playwright-report/` |

Helpers: `dualWriteEvidenceJson` / Playwright `writeBoth`. Vitest C-02 live / C-01 / C-04 writers and `writePerformanceProbe` / `runIdleSettleInteractionP95Probe` mirror into both trees when repo root is known (`WSS_PROBE_REPO` or walk-up).

## What each probe / evidence file measures

| File | Gate | Measures |
|------|------|----------|
| `m03_psd_stft_golden_meta_2026-10-21.json` | M-03 | Float32 golden bins (PASS by G) |
| `m03_spectrum_chart.png` / `m03_chart_main.png` | M-03 | Healthy WebGL screenshot (PASS by G) |
| `m04_playwright_pan_zoom_2026-10-21.json` | M-04 | Playwright pan/zoom (PASS by G @ 0898ec7/b82e324) |
| `m04_idle_refine_settle_2026-10-21.json` | C-P3 / M-04 chain | Idle-timer preview→refine timeline + byMode p95 pointers (**WIP evidence**, not PASS claim) |
| `charts_probe_gpu_webgl_lut_2026-10-21.json` | C-01 | Live / schema GPU probe (PASS by G) |
| `c02_display_only_schema_2026-10-21.json` | C-02 | Legacy schema assert (kept) |
| `c02_display_only_extract_live_2026-10-21.json` | **C-02 WIP** | **Live** grid + viewport + spectrogram tile extract (preview+refine); real extractMs/sourceWindow/dataFnv1a; dual-written |
| `c03_resize_dpr_2026-10-21.json` + `c03_resize_chart.png` | C-03 | buffer ≈ css×dpr (PASS by G) |
| `charts_probe_context_restore_2026-10-21.json` | C-04 | Live lose_context restore (PASS by G) |
| `charts_probe_interaction_p95_2026-10-21.json` | C-P3 | Real extract P50/P95 (preview+refine samples) |
| `CONDENSED_interaction_p95.json` | C-P3 | Condensed byMode p50/p95 dual-write |
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

**Do not set C-02 PASS here.** QA verifies against live extract + dual-write paths. M-04 is already PASS by WSS-QA-G.
