# INCREMENTAL_762b876 — B wave29 G02 UI wire: auto N/B + removeMean SpecParamStrip (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 02:37 Asia/Shanghai |
| Web tip (audit subject) | **`762b876`** = `762b87645948cf03662c1f969ad69adaef3910ee` |
| Desktop | **`17471a6`** (`SpectralSettingsWidget` auto N/B + RemoveMean) |
| Prior Bot-A | `INCREMENTAL_ab48064/` @ Web `ab48064` / audit tip `cfb9f1c` (`cfb9f1c9cad8aee746210ffe8e8ae00867199d4c`); merged → `156be02` |
| Scope | **G02 UI wiring** of D DSP residual; soft G08; Multitaper/Burg stay BLOCKED |
| Rule | Read-only; **no matrix PASS**; CLOSED only if full residual gone (it is **not**) |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Folder | `artifacts/validation/ui-parity/INCREMENTAL_762b876/` |

## Verified SHAs

| SHA | Role |
|-----|------|
| `762b87645948cf03662c1f969ad69adaef3910ee` | `origin/main` tip = audit subject (short `762b876`) |
| `d88dad7cb77eec201f0f94995784654582df3b31` | Bot-B wave29: auto N/B + removeMean SpecParamStrip |
| `156be02` | merge: A INCREMENTAL_ab48064 (`cfb9f1c`) |
| `cfb9f1c` | Prior Bot-A INCREMENTAL_ab48064 (base) |
| `fac1e48` / `f731cfd` | Prior D DSP residual (compute ready) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G02 UI wire = B `d88dad7`. Tip `762b876`.

## Diff vs prior (`ab48064` → `762b876`)

1. **B wave29 (`d88dad7`) closes prior “UI unwired” residual for auto-N/removeMean:**
   - Prefs: `stftAutoNbPref` / `stftRemoveMeanPref` in `uiStore`
   - `MainChartHost`: when auto on → `segmentMilliseconds: 0` + `bandwidthHz=fs` (or synthetic 1e6) + `analysisPoints=stftN` → D `resolveAnalysisSamples` / `webFftSizeFromAnalysisSamples`; `removeMean` → `StftRequest.removeMean`
   - Settle publish: D `setDspFftAnalysisParams` → `dspAutoNb` / `dspRemoveMean` (plus existing fields)
2. **Strip chrome no longer NA-only:**
   - `data-auto-n` is now `"on"|"off"` from pref (was `"na"` + `data-auto-n-status="BLOCKED"`)
   - Toolbar AutoN / Mean0 from D store; overflow toggle + removeMean checkbox + publish readout
   - Wave stamps include `wave29`
3. **Still BLOCKED / not MET:** Multitaper/Burg/Periodogram/Bartlett greyed (`data-blocked`); SpectrumStatistic `NA_PSD_ONLY`. Deferred: non-PoT window length; full STFT DDC/decimate pipeline; full Qt SpectralSettings → **not CLOSED**.
4. **Soft G08:** `data-g08-shortcuts=wave23` retained — **no regression**.
5. **G06 / G17:** **BLOCKED** unchanged. `data-native-qfiledialog="false"`. ChartMarkOverlay backticks **16**.

Bot notes: `bot-b/BOT_B_WAVE29_G02_AUTO_N_REMOVE_MEAN.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`ab48064`) | Now (`762b876`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G02** | PARTIAL (DSP MET; UI unwired) | **PARTIAL (deepened)** | UI→DSP auto-N/removeMean **MET**; Multitaper/Burg + non-PoT + full DDC residual → **not CLOSED** |
| **G08** | PARTIAL | **unchanged PARTIAL** | soft no regression |
| **G18** | PARTIAL | **unchanged PARTIAL** | recog residual |
| **G19** | PARTIAL | **unchanged PARTIAL** | native QFileDialog residual |
| **G17** / **G06** | PARTIAL — BLOCKED | **unchanged — BLOCKED** | no invent / no elevate |
| G07 / G11 | PARTIAL | **unchanged** | residuals retained |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail — G02 UI wire

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| auto-N: segmentMs=0 + bandwidthHz + analysisPoints from UI | **MET** | `MainChartHost` + `toggle-stft-auto-nb` |
| removeMean → StftRequest | **MET** | pref → host → compute |
| settle → `dspAutoNb` / `dspRemoveMean` | **MET** | strip AutoN/Mean0 + `data-dsp-*` |
| strip no longer only NA/BLOCKED | **MET** | `data-auto-n=on|off` (`na`/`BLOCKED` status gone) |
| Multitaper/Burg greyed | **BLOCKED** | `data-blocked` — **not MET** |
| SpectrumStatistic | **NA_PSD_ONLY** | retained |
| non-PoT / full DDC-decimate / full Qt SpectralSettings | residual | → **not CLOSED** |

## TOP residual (max 8)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream **BLOCKED**
3. **G19 residual** — **true native QFileDialog** (`=false`)
4. **G18 residual** — recognition STFT panes
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — Multitaper/Burg compute; non-PoT length; full STFT DDC/decimate; full Qt SpectralSettings
7. **G08 residual** — desktop Qt pixel / full `buildMenus` parity
8. **G11 residual** — PlotWidget paint *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**ui_parity_pass_claimed: false**  
**pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G02 remains **PARTIAL** (UI wire deepen), **not CLOSED**. Multitaper/Burg **BLOCKED**. G06/G17 **BLOCKED**. ChartMarkOverlay backticks = **16**.