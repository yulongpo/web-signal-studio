# INCREMENTAL_ab48064 — D G02 residual: real auto N/B + removeMean DSP (UI strip still unwired) (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:34 Asia/Shanghai |
| Web tip (audit subject) | **`ab48064`** = `ab480646fbeefeb8fc523f6399199fb0d2bd4dfd` (A merge of `b1ea3a9` after D `f731cfd` / `fac1e48`) |
| Desktop | **`17471a6`** (`SpectralSettingsWidget` + `spectral_analysis.cpp`) |
| Prior Bot-A | `INCREMENTAL_ab32f6e/` @ Web `ab32f6e` / audit tip `b1ea3a9` (`b1ea3a99940fd89d89ac0e16f84078f942082925`); also vs `INCREMENTAL_ca28052` auto-N honesty chrome |
| Scope | **G02 DSP contract** `resolveAnalysisSamples` / `removeMean` / store publish; UI strip wiring status; soft G08 |
| Rule | Read-only; **no matrix PASS**; Multitaper/Burg stay BLOCKED; do **not** CLOSED while strip unwired |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_ab48064/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `ab480646fbeefeb8fc523f6399199fb0d2bd4dfd` | `origin/main` tip = audit subject (short `ab48064`) |
| `f731cfddec425ca102f6377116e7456e322ad30a` | merge: D G02 auto-N/removeMean residual |
| `fac1e4835f596b52d2d2b50e6af2935339a63ab9` | Bot-D feat: real removeMean + auto N/B contract |
| `b1ea3a9` | Prior Bot-A INCREMENTAL_ab32f6e (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G02 DSP residual = D `fac1e48` / `f731cfd`. Tip `ab48064` = A merge atop that.

## Diff vs prior (`ab32f6e` / `ca28052` honesty → `ab48064`)

1. **D `fac1e48` DSP true paths (aligns with `BOT_D_G02_RESIDUAL_ab32f6e.md`):**
   - `resolveAnalysisSamples` + `webFftSizeFromAnalysisSamples` — desktop sizing formula + honest PoT adaptation
   - `StftRequest.segmentMilliseconds === 0` auto N/B when `bandwidthHz` + `analysisPoints` provided; **throws** if missing (no silent fake)
   - `StftRequest.removeMean` — real complex-mean subtract pre-window in `computeStft`
   - Store: `dspRemoveMean` / `dspAutoNb` via `setDspFftAnalysisParams`; MainChartHost publishes from compute result
   - Worker/client/handler/protocol + main/file/chunked spectrogram wrappers wired
2. **Still BLOCKED / not MET (honest):**
   - Multitaper / Burg / Periodogram / Bartlett — still `STFT_BLOCKED_METHODS` (throw)
   - SpectrumStatistic — still `NA_PSD_ONLY`
   - Full non-PoT window length (PoT round-up adaptation only)
   - Full band-limited DDC/decimate STFT pipeline (decimation used for analysisSamples **length** only)
3. **UI strip still unwired (critical honesty):** `ChartParamStrip` still stamps `data-auto-n="na"` / `data-auto-n-status="BLOCKED"` and has **no** `dspRemoveMean` / `dspAutoNb` / removeMean pref controls. Bot-D: “Chrome prefs for duration=0 / removeMean toggle remain Bot-B”. → DSP contract **MET**; SpecParamStrip chrome for auto-N/removeMean **PARTIAL/OPEN residual** — **do not fake CLOSED**.
4. **G08 soft:** `data-g08-shortcuts=wave23` retained; full-shell evidence from `INCREMENTAL_ab32f6e` still holds — carry PARTIAL.
5. **G18 / G06 / G17:** no tip delta; G06/G17 **BLOCKED**. `data-native-qfiledialog="false"`. ChartMarkOverlay backticks **16**.

Bot notes: `artifacts/validation/bot-d/BOT_D_G02_RESIDUAL_ab32f6e.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior | Now (`ab48064`) | One-liner |
|----|-------|-------------------|-----------|
| **G02** | PARTIAL (contract strip + auto-N **honesty** NA/BLOCKED) | **PARTIAL (deepened DSP)** | auto N/B + removeMean **compute MET**; strip still unwired / Multitaper·Burg **BLOCKED** → **not CLOSED** |
| **G08** | PARTIAL (full-shell evidence) | **unchanged PARTIAL** | soft retain wave23 / six-menu evidence |
| **G18** | PARTIAL | **unchanged PARTIAL** | no regression; recog residual |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no invent / no elevate |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail — G02 DSP vs UI

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| `resolveAnalysisSamples` / PoT adapt | **MET (DSP)** | `packages/contracts/src/spectral.ts` |
| `StftRequest.removeMean` true path | **MET (DSP)** | `packages/dsp-wasm/src/stft.ts` |
| Auto N/B when `segmentMilliseconds===0` (+ throw if incomplete) | **MET (DSP)** | contract + `stft.method.test.ts` |
| Store `dspRemoveMean` / `dspAutoNb` | **MET (publish)** | `uiStore` + MainChartHost |
| SpecParamStrip auto-N / removeMean prefs | **UI unwired** | still `data-auto-n=na` BLOCKED; no strip fields — residual |
| Multitaper / Burg | **BLOCKED** | throw — **not MET** |
| Full Qt SpectralSettings parity | residual | → **not CLOSED** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — **UI strip wire** for auto-N/removeMean prefs (DSP ready); Multitaper/Burg compute; non-PoT; full DDC/decimate STFT
7. **G08 residual** — desktop Qt pixel / full `buildMenus` parity
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** (DSP deepen; UI unwired), **not CLOSED**. Multitaper/Burg **BLOCKED**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.