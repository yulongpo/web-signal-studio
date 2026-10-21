# INCREMENTAL_ba3bb76 — D G02 StftRequest contract (welch + BLOCKED methods + store publish) (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:13 Asia/Shanghai |
| Web tip (audit subject) | **`ba3bb76`** = `ba3bb7672d5744765f3dba06ed826245471fbe12` (D `3aaac7d` + A `188df0b`/`7095086`) |
| Desktop | **`17471a6`** (`SpectralSettingsWidget` + `domain/project.h`) |
| Prior Bot-A | `INCREMENTAL_bb9b1ef/` @ Web `bb9b1ef` / audit tip `7095086` (`70950869ad4149ed23553537f1d1b94d5d49bcf1`) |
| Scope | **G02** StftRequest method/segment/statistic/kaiserBeta contract + uiStore publish |
| Rule | Read-only; **no matrix PASS**; BLOCKED methods stay BLOCKED (never claim MET) |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_ba3bb76/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `ba3bb7672d5744765f3dba06ed826245471fbe12` | `origin/main` tip = audit subject (short `ba3bb76`) |
| `3aaac7d` | Bot-D: G02 StftRequest method/segment/statistic contract + uiStore publish |
| `188df0b` | merge: A INCREMENTAL_bb9b1ef (`7095086`) |
| `7095086` | Prior Bot-A INCREMENTAL_bb9b1ef (base) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G02 StftRequest = D `3aaac7d`. Tip `ba3bb76`.

## Diff vs prior (`bb9b1ef` → `ba3bb76`)

1. **D G02 StftRequest contract (`3aaac7d`):** `packages/contracts` extends `StftRequest` with `method?: 'welch'`, `segmentMilliseconds?`, `kaiserBeta?`. `STFT_SUPPORTED_METHODS = ['welch']`; `STFT_BLOCKED_METHODS = periodogram/bartlett/multitaper/burg` — passing BLOCKED **throws** (no silent fallback). `STFT_SPECTRUM_STATISTIC_STATUS = NA_PSD_ONLY` (desktop STFT omits statistic). Kaiser β real path via `makeWindow`. Tests: `stft.method.test.ts`, `uiStore.dspFftAnalysisParams.test.ts`, `computeMainSpectrogram.test.ts`.
2. **Store publish:** `dspSpectralMethod` / `dspSegmentMs` / `dspSpectrumStatistic` (always null on STFT) / `dspKaiserBeta` via `setDspFftAnalysisParams` from `MainChartHost` / spectrogram compute — for SpecParamStrip consumption (chrome stamps still Bot-B/C).
3. **Honest BLOCKED / NA (must not claim MET):**
   - Methods: **periodogram, bartlett, multitaper, burg** → **BLOCKED**
   - Desktop auto N/B (`segmentMilliseconds=0`) → **BLOCKED/NA** (web sizes by `fftSize`; derived `dspSegmentMs` only)
   - `removeMean` → **BLOCKED** (not in StftRequest)
   - `SpectrumStatistic` on STFT → **NA_PSD_ONLY** (`dspSpectrumStatistic: null`)
   - Multitaper DPSS NW/tapers → **BLOCKED**; Burg order → **BLOCKED**
4. **G02 deepen PARTIAL:** welch true path + kaiserBeta + store contract **MET** beyond prior window/overlap/stftN soft prefs — **not CLOSED** (blocked methods + auto N/B + removeMean + SpecParamStrip chrome for new stamps residual vs full Qt SpectralSettingsWidget).
5. **G08 / G18:** carry forward PARTIAL (shortcuts MET; mod STFT MET; recog panes residual). **No tip delta.**
6. **G06 / G17:** **BLOCKED** unchanged — Bot-D explicitly out of scope; no invent.
7. **G19:** `data-native-qfiledialog="false"`. ChartMarkOverlay backticks **16**.

Bot notes: `artifacts/validation/bot-d/BOT_D_G02_STFT_CONTRACT_bb9b1ef.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`bb9b1ef`) | Now (`ba3bb76`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (SpectralSettings soft / Qt residual) | **PARTIAL (deepened)** | welch+kaiser+store publish **MET**; blocked methods stay **BLOCKED** → **not CLOSED** |
| **G08** | PARTIAL (shortcuts MET; shell re-shot residual) | **unchanged PARTIAL** | carry forward |
| **G18** | PARTIAL (recog panes residual) | **unchanged PARTIAL** | mod STFT MET retained; no recog invent |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no elevate / no invent |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail — G02 StftRequest

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Welch STFT true path | **MET** | `StftSupportedMethod='welch'`; compute throws otherwise |
| Kaiser β driveable | **MET** | `kaiserBeta` → `makeWindow`; `dspKaiserBeta` |
| segmentMs derived publish | **MET (derived)** | `dspSegmentMs`; framing still `fftSize` |
| Store publish fields | **MET** | `dspSpectralMethod` / `dspSegmentMs` / `dspSpectrumStatistic=null` / `dspKaiserBeta` |
| periodogram / bartlett / multitaper / burg | **BLOCKED** | `STFT_BLOCKED_METHODS`; RangeError — **do not claim MET** |
| SpectrumStatistic on STFT | **NA_PSD_ONLY** | desktop STFT omits; null forever on main STFT |
| Auto N/B segment / removeMean / DPSS / Burg order | **BLOCKED** | Bot-D table |
| Full Qt SpectralSettingsWidget parity | residual | → **not CLOSED** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes (mod STFT **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — BLOCKED methods (multitaper/burg/…) + auto N/B + removeMean + SpecParamStrip chrome for new stamps
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** (deepened), **not CLOSED**. BLOCKED methods **not MET**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.