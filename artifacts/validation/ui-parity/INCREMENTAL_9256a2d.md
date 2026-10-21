# INCREMENTAL_9256a2d — B wave21 G02 window/overlap from D uiStore (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:45 Asia/Shanghai |
| Web tip (audit subject) | **`9256a2d`** = Bot-B wave21 SpecParamStrip window/overlap on main that folded D `4cf4f64` / merge `8eae73e` + A `0954188` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; SpectralSettingsWidget 窗函数 / 重叠 %) |
| Prior Bot-A | `INCREMENTAL_e8f0881.md` @ Web `e8f0881` / audit tip `0954188` |
| Scope | **G02** live window/overlap residual (B strip + D FFT publish); confirm **G18** still PARTIAL; skim D `8eae73e`/`4cf4f64` |
| Rule | Read-only; **no matrix PASS**; `data-native-qfiledialog=false` honest |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `9256a2d47dc4602be4994566f5d29da6c19b17a5` | `origin/main` tip = audit subject (B wave21) |
| `8eae73e` / `4cf4f64` | Bot-D merge / fix: publish real FFT window/overlap to uiStore |
| `0954188` / `e8f0881` | Prior A audit / C G18 dwell-only (ancestry) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G02 window/overlap chrome = B `9256a2d`; G02 store publish = D `4cf4f64`. Tip `9256a2d`.

## Diff vs prior (`e8f0881` → `9256a2d`)

1. **D G02 FFT publish (`4cf4f64` / `8eae73e`):** uiStore fields `dspFftWindow` / `dspFftOverlap` / `dspFftHopSize` / `dspFftSizeActive` + `setDspFftAnalysisParams`. Source of truth = real main/file STFT path (today Hann + hop → overlap 0.75), published from `MainChartHost` on STFT success; cleared on loading/demo-fallback. Tests on compute + store. **Not invented UI defaults.** Note: UI `stftN` chrome still not passed into compute — `dspFftSizeActive` is the FFT the STFT actually ran.
2. **B G02 SpecParamStrip wave21 (`9256a2d`):** Subscribes to D fields; window + overlap QLabels show real values when present (overlap as `%`); Hop + FFTn stamps; missing → honest `—` + `data-strip-partial` / reason. `data-strip-wave` includes wave21; overflow mirrors. Prior residual “live window/overlap” **MET** for store-backed strip chrome after STFT settles.
3. **G02 not CLOSED:** Pre-STFT / cleared paths still `—`; no editable SpectralSettingsWidget-style window/overlap controls; `stftN` UI↔compute wire residual (D note). → **PARTIAL**.
4. **G18 confirm:** No C delta this tip. Dwell-only recovery retained from `e8f0881`; full multi-view polish residual unchanged → **still PARTIAL**.
5. **G07 skim:** D publish is G02 strip coupling, not Qt Detect Worker deepen — G07 residual unchanged.
6. **ChartMarkOverlay:** backticks **16**. **G06/G17:** stay **BLOCKED**. **G19:** `data-native-qfiledialog="false"` retained.

Bot notes: `bot-b/BOT_B_WAVE21_G02_WINDOW_OVERLAP.md`, `bot-d/BOT_D_G02_FFT_WINDOW_OVERLAP_e8f0881.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`e8f0881`) | Now (`9256a2d`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (live window/overlap residual) | **PARTIAL (deepened)** | D publish + B strip real window/overlap/Hop/FFTn **MET**; pre-STFT `—` / editable SpectralSettings / stftN wire → **not CLOSED** |
| **G18** | PARTIAL (multi-view polish residual) | **unchanged PARTIAL** | dwell-only retained; full polish → **not CLOSED** |
| G07 / G08 / G11 / G19 | PARTIAL | **unchanged** | Worker / shell re-shot / PlotWidget / native QFileDialog |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G02 — window/overlap from D store — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior DSP/FFT/detectRunFeed stamps | MET (retained) | wave19 |
| D publish real STFT window/overlap/hop/fftSize | **MET** | `uiStore` + MainChartHost; compute tests |
| B strip live window % / Hop / FFTn | **MET** | `data-strip-wave` wave21; store-backed labels |
| Pre-STFT honest `—` | MET (honest) | `data-strip-partial` when null |
| Editable SpectralSettings / stftN→compute wire | residual | D note → **not CLOSED** |

### G18 — confirm — **PARTIAL (unchanged)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Dwell-only peak/center + scrubber | MET (retained) | `e8f0881` |
| Full multi-view polish beyond PSD vline | residual | no C delta @ tip |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (`data-native-qfiledialog=false`)
4. **G18 residual** — full multi-view polish beyond PSD vline
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — editable SpectralSettings / stftN→compute wire (store-backed strip readout **done** @ wave21)
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains PARTIAL (deepened), not CLOSED. G18 remains PARTIAL. G06/G17 stay **BLOCKED**. ChartMarkOverlay backticks = **16**.