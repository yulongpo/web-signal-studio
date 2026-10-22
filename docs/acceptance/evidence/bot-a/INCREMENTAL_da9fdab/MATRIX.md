# INCREMENTAL_da9fdab — MATRIX

**Path:** `artifacts/validation/ui-parity/INCREMENTAL_da9fdab/MATRIX.md`  
**Evidence:** `docs/acceptance/evidence/bot-a/INCREMENTAL_da9fdab/MATRIX.md`  
**Web tip:** `da9fdab56ddf108816a5024d842f3d8263032d40` vs `17471a6`  
**When:** 2026-10-22 08:06 Asia/Shanghai  
**Supersedes:** `INCREMENTAL_0f1183a` / `caaf7c8` (`caaf7c846f54697a4753fe612d81d49299659f96`)

| ID | Status | Note |
|----|--------|------|
| G02 | **PARTIAL** | A5 MET + A2 MET; ⑥ non-PoT/STFT-DDC **BLOCKED** |
| G08 | **PARTIAL** | unchanged fence |
| G07 | **PARTIAL** | unchanged |
| G18 | **PARTIAL** | written BLOCKED recog STFT retained |
| G19 | **PARTIAL** | qfiledialog false |
| G06 | **BLOCKED** | no invent |
| G17 | **BLOCKED** | no invent |
| G09 / G16 | **OPEN** | unchanged |
| G05 / G14 | CLOSED | unchanged |
| G25 | DOCS | unchanged |

**Counts:** OPEN **7** · PARTIAL **16** · CLOSED **2** · DOCS **1**

## Status lines

- **A5:** **MET** — `openProjectFromText` / `saveProjectJsonText` wire `read`/`apply` spectral_settings_json
- **A2:** **MET** (retained) — auto-N `visibleBandwidthHz` → `bandwidthHz`
- **⑥:** **D BLOCKED** (non-PoT / STFT-DDC)
- **matrix_pass_claimed: false**