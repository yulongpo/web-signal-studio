# ACTIONABLE update @ `2aea4cb` (supersedes da9fdab board)

## Status board

| # | ID | Now @ `2aea4cb` | Owner |
|---|----|-------------------|-------|
| ① A1 SegmentMs | **LANDED** | B (done) |
| ② A2 visible BW | **MET** | C (done) |
| ③ B1 Ctrl+A | **LANDED** | B (done) |
| A3 dspAnalysisSamples | **MET** (D publish + **B stamp**) | D+B (done) |
| A4 NA_PSD_ONLY | reinforced | — |
| ⑤ A5 spectral_settings_json | **MET** (F + B open/save) | F+B (done) |
| A6 tooltips | **LANDED** | B (done) |
| ⑥ non-PoT/STFT-DDC | **D BLOCKED** | D (fence) |
| B3/B4/C1/C2/D2 | **LANDED** | — |
| **D4 G09** bottom scale | **OPEN** | **B** primary (BottomPanel scale chrome); **C** if chart axis bind needed; **D** N/A (UI) |
| **D5 G16** mode-wheel | **OPEN** | **B** primary (mode-wheel shell / MenuBar); **C** mode consumers on chart; wait desktop mode matrix; **D** only if new DSP mode enum (not scheduled) |

## Next priority (owners)

1. **B — D4 G09** bottom scale OPEN: implement BottomPanel scale chrome after desktop `17471a6` design read; **C** assist only if MainChartHost axis bind required.
2. **B — D5 G16** mode-wheel OPEN: shell + shortcuts after desktop mode matrix; **C** wire chart mode consumers; do not invent modes.
3. **B/C optional — A2 fixed-SegmentMs BW:** use `analysisBandwidthHz` when auto-N off (today fs) — residual only.
4. **Do not** schedule Multitaper/Burg/non-PoT/STFT-DDC / G06 / G17 invent (⑥ **D BLOCKED**; G18 written BLOCKED retained).

**matrix_pass_claimed: false**