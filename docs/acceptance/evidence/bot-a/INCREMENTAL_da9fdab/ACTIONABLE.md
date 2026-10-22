# ACTIONABLE update @ `da9fdab` (supersedes 0f1183a board)

## Status board

| # | ID | Now @ `da9fdab` |
|---|----|-------------------|
| ① A1 SegmentMs | **LANDED** |
| ② A2 visible BW | **MET** (C; retained) |
| ③ B1 Ctrl+A | **LANDED** |
| A3 dspAnalysisSamples | **D publish LANDED**; **B strip stamp still OPEN** ← **next B** |
| A4 NA_PSD_ONLY | reinforced |
| ⑤ A5 spectral_settings_json | **MET** (F schema + **B open/save**) |
| A6 tooltips | **LANDED** |
| ⑥ non-PoT/STFT-DDC | **D BLOCKED** |
| B3/B4/C1/C2/D2 | **LANDED** |
| D4 G09 / D5 G16 | **OPEN** |

## Next priority

1. **B — A3 strip stamp:** surface `dspAnalysisSamples` on `ChartParamStrip` (D publish ready).
2. **B/C optional — A2 fixed-SegmentMs BW:** use `analysisBandwidthHz` when auto-N off (today fs).
3. **B/C — D4 G09** bottom scale after desktop design.
4. **B/C — D5 G16** mode-wheel rules after desktop mode matrix.
5. **Do not** schedule Multitaper/Burg/non-PoT/STFT-DDC / G06 / G17 invent.

**matrix_pass_claimed: false**