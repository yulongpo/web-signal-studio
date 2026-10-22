# INCREMENTAL_0f1183a — A2 visibleBandwidthHz + A5 spectral_settings_json audit (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 08:04 Asia/Shanghai |
| Web tip | **`0f1183a`** = `0f1183af9972ddc70a995ceb64474f0d4bac940b` |
| Desktop | **`17471a6`** |
| Prior A | `INCREMENTAL_ab82146` @ `11627a9` (`11627a990a11d51d5af05949a98cf71bd3550bec`) |
| Scope | Substantive: C A2 + F A5 (+ B wave33 / D A3 already on tip) — not empty refresh |
| Rule | Docs-only; **matrix_pass_claimed=false**; G06/G17 BLOCKED; no Multitaper/Burg/non-PoT/STFT-DDC flip |
| Evidence | `docs/acceptance/evidence/bot-a/INCREMENTAL_0f1183a/` + `artifacts/validation/ui-parity/INCREMENTAL_0f1183a/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `0f1183af9972ddc70a995ceb64474f0d4bac940b` | `origin/main` tip |
| `ef6a0ef` / `f223270` | C A2 visibleBandwidthHz |
| `331d2fb` / `6bf49bb` | F A5 spectral_settings_json |
| `3f2fb2b` / `2ce34a9` | B wave33 ACTIONABLE UI |
| `5116e56` / `38facc8` | D A3 dspAnalysisSamples |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop |

## A2 — `visibleBandwidthHz` / `bandwidthHz` (C)

**Cite:** `apps/web/src/dsp/visibleBandwidthHz.ts` (+ test); `MainChartHost.tsx` seed + `onViewCommit`; `bot-c/WAVE33-A2-BANDWIDTH-HANDOFF.md`.

| Check | Result |
|-------|--------|
| Helper STFT→Y / Waterfall→X span, fallback fs, clamp | **MET** |
| Host seed from fitted view + update on view commit | **MET** |
| Auto-N `StftRequest.bandwidthHz` uses `analysisBandwidthHz` with fs fallback | **MET** (no longer hardcode-only on auto-N) |
| Still no STFT-DDC / band-limited STFT | **honest** (sizing input only) |
| Fixed SegmentMs (auto-N **off**) path | Still passes `session.sampleRateHz` / synthetic `1e6` as `bandwidthHz` when resolving fixed duration — **residual** (auto-N was A2 primary) |

**A2 verdict:** **MET** for ACTIONABLE auto-N display-BW wiring (C→DSP consume). G02 stays **PARTIAL** (fence + fixed-path residual + blocked methods).

## A5 — `spectral_settings_json` (F) vs B open/save

**Cite:** `packages/project-io/src/spectral-settings-json.ts` (+ tests); `apps/web/src/projectIo/index.ts` re-exports; `bot-f/A5-spectral-settings-json.md`.

| Check | Result |
|-------|--------|
| Schema / encode-decode / chrome prefs bridge / desktop `spectrogramSettings` bridge | **MET** (F) |
| Thin re-exports `applySpectralChromePrefsToProject` / `readSpectralChromePrefsFromFile` | **MET** in `apps/web/src/projectIo` |
| MenuBar / open / save actually call apply/read | **OPEN** — callers = re-export file only; `MenuBar.tsx` has **no** spectral persist hook |

**A5 verdict:** **schema MET / B persist OPEN**. Update ACTIONABLE accordingly.

## Other ACTIONABLE landings already on tip (status refresh)

| ID | Status @ `0f1183a` |
|----|----------------------|
| **① A1** SegmentMs fixed | **B landed** (wave33 `select-stft-segment-ms`) |
| **② A2** visible BW | **C landed** (auto-N MET; see above) |
| **③ B1** Ctrl+A SelectAll | **B landed** (wave33) |
| **A3** dspAnalysisSamples | **D landed** publish; strip chrome stamp still absent → **B stamp OPEN** |
| **A4** STFT NA_PSD_ONLY | reinforced (wave33) |
| **⑤ A5** spectral_settings_json | **F schema MET / B open-save OPEN** |
| **A6** validation tooltips | **B landed** |
| **B3/B4** honesty / recent a11y | **B landed** |
| **C1/C2** Detect honesty + `data-native-worker=false` | **B landed** |
| **D2** save picker polish | **B landed**; qfiledialog stays false |
| **⑥** non-PoT / STFT-DDC | **D BLOCKED** (unchanged) |
| C D3 G11 | C: no tip (already MET evidence) |
| C D4 G09 / D5 G16 | C: **no tip** (design / mode-matrix blockers) |

## Soft fences

| ID | Status |
|----|--------|
| G02 | **PARTIAL** — PoT auto-N/removeMean + A1/A2/A3 deepen; Multitaper/Burg/**non-PoT**/**STFT-DDC** **BLOCKED** |
| G08 | **PARTIAL** — SelectAll deepen; desktop pixel residual |
| G07 | **PARTIAL** — Detect honesty deepen; full Qt Worker residual |
| G18 | **PARTIAL** — recog STFT **written BLOCKED** retained |
| G06 / G17 | **BLOCKED** |
| G19 | **PARTIAL** — `data-native-qfiledialog=false` |
| G09 / G16 | **OPEN** |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**  
**backticks:** **16**

## Explicit

**matrix_pass_claimed: false** · **ui_parity_pass_claimed: false** · **pass_claimed: false**