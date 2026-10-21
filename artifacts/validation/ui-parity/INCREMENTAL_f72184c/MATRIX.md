# INCREMENTAL_f72184c — matrix + conclusion

| ID | Status | Note |
|----|--------|------|
| G01 | PARTIAL | unchanged |
| G02 | **PARTIAL (deepened)** | B `bcde64f` strip wires D welch/kaiser/segment; blocked methods BLOCKED |
| G03–G04 | PARTIAL | unchanged |
| G05 | CLOSED | unchanged |
| G06 | PARTIAL — **BLOCKED** eye/bitstream | no invent |
| G07 | PARTIAL | unchanged |
| G08 | PARTIAL | no regression (wave23) |
| G09–G10 | OPEN | unchanged |
| G11–G13 | PARTIAL | unchanged |
| G14 | CLOSED | unchanged |
| G15 | PARTIAL | unchanged |
| G16 | OPEN | unchanged |
| G17 | PARTIAL — **BLOCKED** recognition | no elevate |
| G18 | PARTIAL | no regression; mod STFT MET; recog panes residual |
| G19–G20 | PARTIAL | `data-native-qfiledialog=false` |
| G21–G24 | OPEN | unchanged |
| G25 | DOCS | unchanged |
| G26 | PARTIAL | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**

## Conclusion

Tip `f72184c` deepens G02 PARTIAL by wiring SpecParamStrip/SpectralSettings overflow and MainChartHost STFT requests to D `StftRequest` (fixed welch, kaiserBeta, segment publish; blocked methods honestly grey/BLOCKED). Window/overlap/stftN remain editable. G08/G18 show **no regression**. G06/G17 remain **BLOCKED**. Full Qt SpectralSettings residual keeps G02 **not CLOSED**. **matrix_pass_claimed: false**. No PASS.