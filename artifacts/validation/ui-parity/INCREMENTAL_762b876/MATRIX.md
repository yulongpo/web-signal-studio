# INCREMENTAL_762b876 — matrix + conclusion

| ID | Status | Note |
|----|--------|------|
| G01 | PARTIAL | unchanged |
| G02 | **PARTIAL (UI wire deepened)** | B `d88dad7` auto-N/removeMean SpecParamStrip → D resolve/removeMean; Multitaper/Burg BLOCKED |
| G03–G04 | PARTIAL | unchanged |
| G05 | CLOSED | unchanged |
| G06 | PARTIAL — **BLOCKED** eye/bitstream | no invent |
| G07 | PARTIAL | unchanged |
| G08 | PARTIAL | soft wave23; no regression |
| G09–G10 | OPEN | unchanged |
| G11–G13 | PARTIAL | unchanged |
| G14 | CLOSED | unchanged |
| G15 | PARTIAL | unchanged |
| G16 | OPEN | unchanged |
| G17 | PARTIAL — **BLOCKED** recognition | no elevate |
| G18 | PARTIAL | unchanged; recog panes residual |
| G19–G20 | PARTIAL | `data-native-qfiledialog=false` |
| G21–G24 | OPEN | unchanged |
| G25 | DOCS | unchanged |
| G26 | PARTIAL | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**

## Conclusion

Tip `762b876` deepens G02 PARTIAL by wiring SpecParamStrip prefs (`stftAutoNbPref` / `stftRemoveMeanPref`) through MainChartHost into D `resolveAnalysisSamples` (segmentMs=0 + bandwidthHz + analysisPoints) and `StftRequest.removeMean`, with settle publish to `dspAutoNb`/`dspRemoveMean`. Strip stamps are live `on|off` / AutoN·Mean0 — no longer wave26 NA/BLOCKED-only. Multitaper/Burg remain greyed **BLOCKED**; statistic **NA_PSD_ONLY**. Full residual (non-PoT, DDC/decimate STFT, Multitaper/Burg compute, full Qt SpectralSettings) keeps G02 **not CLOSED**. Soft G08 OK. G06/G17 **BLOCKED**. **matrix_pass_claimed / ui_parity_pass_claimed / pass_claimed: false**. No PASS.