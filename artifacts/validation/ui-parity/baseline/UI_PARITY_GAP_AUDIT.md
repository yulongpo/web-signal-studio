> Bot-A `2026-10-22 07:49` Asia/Shanghai: Web tip **`ab82146`** vs desktop `17471a6` — combined: C G18 recog STFT **written BLOCKED** (`G18-NB-RECOG-STFT-BLOCKED-HANDOFF.md`) + ACTIONABLE `eb80ac8` on main. ①②③ **B no tip**; ⑥ **D BLOCKED**; ⑤ waiting B. G02 PARTIAL fence; G06/G17 BLOCKED; G08 no flip. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ab82146/MATRIX.md`. **No PASS.** matrix_pass_claimed: false.
> Bot-A `2026-10-22 07:46` Asia/Shanghai: Web tip **`113f6b8`** vs desktop `17471a6` — **ACTIONABLE gap list** (not empty refresh). G02 stay PARTIAL; Multitaper/Burg/non-PoT/STFT-DDC BLOCKED. Top B/D/C: SegmentMs fixed duration; bandwidthHz from span; Ctrl+A SelectAll; spectral prefs persist; Detect LocalCompute honesty. G06/G17 BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_113f6b8_ACTIONABLE/ACTIONABLE.md`. **No PASS.** matrix_pass_claimed: false.
> Bot-A `2026-10-22 02:50` Asia/Shanghai: Web tip **`1ec1eca`** vs desktop `17471a6` — **evidence-only** G `84b8c72` (`qa/web-4db4208`). G02 PARTIAL corroborated (auto-N/removeMean/kaiser/blocked; non-PoT/STFT-DDC **BLOCKED** — **not CLOSED**). G08 PARTIAL soft wave23 no-regress. G06/G17 BLOCKED. ChartMarkOverlay backticks=16. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_1ec1eca/MATRIX.md`. **No PASS.** matrix_pass_claimed: false.
> Bot-A `2026-10-22 02:47` Asia/Shanghai: Web tip **`4db4208`** vs desktop `17471a6` — **post-merge matrix refresh** (A `INCREMENTAL_ee6b4ea` on main; no apps delta). G02 **PARTIAL** (PoT MET; Multitaper/Burg + **non-PoT BLOCKED** + **STFT-DDC BLOCKED** — **not CLOSED**). G06/G17 BLOCKED. ChartMarkOverlay backticks=16. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_4db4208/MATRIX.md`. **No PASS.** matrix_pass_claimed: false.
> Bot-A `2026-10-22 02:45` Asia/Shanghai: Web tip **`ee6b4ea`** vs desktop `17471a6` — **post-merge matrix refresh** (A `INCREMENTAL_31cc4bf` on main; no apps delta). G02 **PARTIAL** (PoT auto-N/removeMean MET; Multitaper/Burg + **non-PoT BLOCKED** + **STFT-DDC BLOCKED** — **not CLOSED**). G06/G17 BLOCKED. ChartMarkOverlay backticks=16. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ee6b4ea/MATRIX.md`. **No PASS.** matrix_pass_claimed: false.
> Bot-A CAO FYI `2026-10-22 02:43` Asia/Shanghai (on `INCREMENTAL_31cc4bf`): D formally **BLOCKED** **non-PoT** + **STFT-DDC/decimate** (no separate tip). G02 remains **PARTIAL** — UI+PoT auto-N/removeMean MET only; Multitaper/Burg **BLOCKED**; **do not CLOSED**. See `INCREMENTAL_31cc4bf/`. **No PASS.** matrix_pass_claimed: false.
> Bot-A `2026-10-22 02:43` Asia/Shanghai: Web tip **`31cc4bf`** vs desktop `17471a6` — **evidence-only** G `4389fb7` (`qa/web-762b876`). G02 PARTIAL corroborated (auto-N on/off + segment_ms=0 + removeMean + blocked grey + kaiser); **not CLOSED**. Soft G08 no regression. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_31cc4bf/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`762b876`) | Now (`31cc4bf`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（UI wire） | **PARTIAL（G 佐证；未 CLOSED）** | DOM/PNG 对齐 on/off / removeMean |
| **G08** | PARTIAL | **unchanged PARTIAL** | soft 无回归 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_31cc4bf/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:37` Asia/Shanghai: Web tip **`762b876`** vs desktop `17471a6` — G02 PARTIAL deepened (B `d88dad7` wave29: SpecParamStrip auto-N/removeMean → D `resolveAnalysisSamples` / `StftRequest.removeMean`; settle `dspAutoNb`/`dspRemoveMean`). Strip `data-auto-n=on|off` (no longer NA-only). Multitaper/Burg still **BLOCKED**. Soft G08 no regression. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_762b876/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`ab48064`) | Now (`762b876`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（DSP MET；UI 未接线） | **PARTIAL 加深** | UI→DSP MET；Multitaper/Burg / non-PoT / DDC 残 → **未 CLOSED** |
| **G08** | PARTIAL | **unchanged PARTIAL** | soft 无回归 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_762b876/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:34` Asia/Shanghai: Web tip **`ab48064`** vs desktop `17471a6` — G02 PARTIAL DSP deepen (D `fac1e48`: `resolveAnalysisSamples` + `StftRequest.removeMean` + `dspRemoveMean`/`dspAutoNb`). SpecParamStrip still `data-auto-n=na` / unwired → **not CLOSED**. Multitaper/Burg still **BLOCKED**. Soft G08 from ab32f6e holds. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ab48064/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`ab32f6e` / ca28052) | Now (`ab48064`) | Note |
|----|------------------------------|-------------------|------|
| **G02** | PARTIAL（auto-N 诚实 NA） | **PARTIAL DSP 加深** | compute MET；strip 未接线；Multitaper/Burg **BLOCKED** → **未 CLOSED** |
| **G08** | PARTIAL | **unchanged PARTIAL** | soft retain full-shell |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_ab48064/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:32` Asia/Shanghai: Web tip **`ab32f6e`** vs desktop `17471a6` — **evidence-only** G `4bc03b8` (`qa/web-62fc184`). G08 PARTIAL deepened (independent six-menu full-shell + File·Edit·View `data-accel` / `data-g08-shortcuts=wave23`). Desktop Qt pixel / full `buildMenus` residual → **not CLOSED**. Soft G02/G18 no regression. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ab32f6e/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`1f2bcee`) | Now (`ab32f6e`) | Note |
|----|---------------------|-------------------|------|
| **G08** | PARTIAL（shell re-shot 残） | **PARTIAL 加深** | web 六菜单 inventory MET；desktop 像素残 → **未 CLOSED** |
| **G02** / **G18** | PARTIAL | **unchanged PARTIAL** | soft 无回归 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_ab32f6e/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:25` Asia/Shanghai: Web tip **`1f2bcee`** vs desktop `17471a6` — **evidence-only** G `91aa309` (`qa/web-ca28052`). G02 PARTIAL corroborated (`data-auto-n=na` / BLOCKED methods / Kaiser gate match prior honesty); **not CLOSED**. G08/G18 soft no regression. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_1f2bcee/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`ca28052`) | Now (`1f2bcee`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（auto-N 诚实） | **PARTIAL（G 佐证；未 CLOSED）** | DOM/PNG 对齐 NA/BLOCKED |
| **G08** / **G18** | PARTIAL | **unchanged PARTIAL** | soft 无回归 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_1f2bcee/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:22` Asia/Shanghai: Web tip **`ca28052`** vs desktop `17471a6` — G02 PARTIAL honesty deepen (B `cd204ef` wave26: `data-auto-n=na` + NA copy; method disabled welch-only copy; Kaiser disabled-until-kaiser; blocked methods still grey). Real auto N/B still BLOCKED → **not CLOSED**. G08/G18 no regression. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ca28052/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`f72184c`) | Now (`ca28052`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（strip↔D） | **PARTIAL 诚实加深** | auto-N NA/BLOCKED 标清；未实现 auto N/B → **未 CLOSED** |
| **G08** / **G18** | PARTIAL | **unchanged PARTIAL** | 无回归 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_ca28052/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:18` Asia/Shanghai: Web tip **`f72184c`** vs desktop `17471a6` — G02 PARTIAL deepened (B `bcde64f` SpecParamStrip wires D StftRequest: fixed welch + kaiserBeta + SegMs; blocked Multitaper/Burg/Periodogram/Bartlett `data-blocked`). Window/overlap/stftN still MET. G08/G18 no regression. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_f72184c/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`ba3bb76`) | Now (`f72184c`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（D contract） | **PARTIAL 加深** | strip+host wire；blocked methods **BLOCKED** → **未 CLOSED** |
| **G08** / **G18** | PARTIAL | **unchanged PARTIAL** | 无回归 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_f72184c/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:13` Asia/Shanghai: Web tip **`ba3bb76`** vs desktop `17471a6` — G02 PARTIAL deepened (D `3aaac7d` StftRequest welch + kaiserBeta + store publish). BLOCKED methods (periodogram/bartlett/multitaper/burg) stay **BLOCKED** (throw; no MET). SpectrumStatistic **NA_PSD_ONLY**. G08/G18 carry forward. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ba3bb76/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`bb9b1ef`) | Now (`ba3bb76`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL | **PARTIAL 加深** | welch/kaiser/store **MET**；blocked methods **BLOCKED** → **未 CLOSED** |
| **G08** / **G18** / **G19** | PARTIAL | **unchanged PARTIAL** | carry forward |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未抬升 / 未发明 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_ba3bb76/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:10` Asia/Shanghai: Web tip **`bb9b1ef`** vs desktop `17471a6` — **evidence-only** G `2df3892` (web-2091dc0). G08 PARTIAL corroborated (`data-g08-shortcuts=wave23` + File/Edit/View accel captures); full shell re-shot residual → **not CLOSED**. No apps/packages delta. G18/G02 fold soft. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_bb9b1ef/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`663b522`) | Now (`bb9b1ef`) | Note |
|----|---------------------|-------------------|------|
| **G08** | PARTIAL（shortcuts MET） | **PARTIAL（G 佐证；未 CLOSED）** | wave23 stamps + accel PNGs；shell re-shot 残 |
| **G18** / **G02** / **G19** | PARTIAL | **unchanged PARTIAL** | fold / residuals |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未发明 / 未抬升 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_bb9b1ef/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:07` Asia/Shanghai: **CAO retarget** Web tip **`663b522`** (supersedes d7e6973) vs desktop `17471a6` — G08 PARTIAL deepened (B `498b2ac` MenuBar QKeySequence / useMenuBarShortcuts). G `f88c440` web-42265bf corroborates G18 mod STFT + G02 soft (no elevate). Full shell re-shot residual. G18 recog STFT panes residual; G17 not elevated. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_663b522/`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`42265bf`) | Now (`663b522`) | Note |
|----|---------------------|-------------------|------|
| **G08** | PARTIAL（shell re-shot 残） | **PARTIAL 加深** | MenuBar shortcuts **MET**；full re-shot → **未 CLOSED** |
| **G18** | PARTIAL | **unchanged PARTIAL** | G corroborates mod STFT；recog STFT panes 残 |
| **G02** | PARTIAL | **unchanged PARTIAL** | G corroborates wave22 soft；Qt residual |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未抬升 / 未发明 |
| **G19** | PARTIAL | **unchanged PARTIAL** | `data-native-qfiledialog=false` |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_663b522/`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:04` Asia/Shanghai: Web tip **`d7e6973`** vs desktop `17471a6` — G08 PARTIAL deepened (B `498b2ac` MenuBar QKeySequence / useMenuBarShortcuts wave23). Full shell re-shot residual. G18 recog STFT panes residual; G17 not elevated. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_d7e6973.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`42265bf`) | Now (`d7e6973`) | Note |
|----|---------------------|-------------------|------|
| **G08** | PARTIAL（shell re-shot 残） | **PARTIAL 加深** | MenuBar shortcuts **MET**；full re-shot → **未 CLOSED** |
| **G18** | PARTIAL | **unchanged PARTIAL** | recog STFT panes 残 |
| **G17** / **G06** | PARTIAL | **unchanged — BLOCKED** | 未抬升 / 未发明 |
| **G02** / **G19** | PARTIAL | **unchanged PARTIAL** | residuals 仍在 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_d7e6973.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:02` Asia/Shanghai: Web tip **`42265bf`** vs desktop `17471a6` — G18 PARTIAL deepened (C `80d25bd` mod STFT linkedCursor). Residual → recognition STFT panes only (BLOCKED placeholder; not invented). G17 recognition **not elevated**. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_42265bf.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`d4f0943`) | Now (`42265bf`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL（mod/recog panes 残） | **PARTIAL 加深** | mod STFT linked **MET**；recognition STFT panes → **未 CLOSED** |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未抬升 |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G02** / **G19** | PARTIAL | **unchanged PARTIAL** | residuals 仍在 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_42265bf.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 02:00` Asia/Shanghai: Web tip **`d4f0943`** vs desktop `17471a6` — evidence-only G `c27d634` (web-d69fc93 SpectralSettings wave22 + G18). No apps/packages delta. Statuses unchanged. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_d4f0943.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`d69fc93`) | Now (`d4f0943`) | Note |
|----|---------------------|-------------------|------|
| **G02** / **G18** / **G19** | PARTIAL | **unchanged PARTIAL** | G corroborates；residuals 仍在 → **未 CLOSED** |
| **G06** / **G17** | PARTIAL | **unchanged — BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_d4f0943.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:56` Asia/Shanghai: Web tip **`d69fc93`** vs desktop `17471a6` — G02 PARTIAL deepened (B `72d4759`/`8d6148f` stftN/window/overlap prefs→STFT + overflow SpectralSettings). G18 still PARTIAL (mod/recog panes). G19 native QFileDialog false. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_d69fc93.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`2f8162b`) | Now (`d69fc93`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（SpectralSettings/stftN 残） | **PARTIAL 加深** | prefs→compute + overflow editors MET；full Qt SpectralSettingsWidget → **未 CLOSED** |
| **G18** | PARTIAL | **unchanged PARTIAL** | mod/recog panes 残 |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false` |
| **G06** / **G17** | PARTIAL | **unchanged — BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_d69fc93.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:52` Asia/Shanghai: Web tip **`2f8162b`** vs desktop `17471a6` — G18 PARTIAL deepened (C `99e1eba` NB STFT SpectrumChart linkedCursor + wave prefer timeSec/onPinX). Not CLOSED (modulation/recognition panes). B SpectralSettings absent — no invented G02 MET. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_2f8162b.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`9256a2d`) | Now (`2f8162b`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL（multi-view polish 残） | **PARTIAL 加深** | STFT/wave linked **MET**；mod/recog panes → **未 CLOSED** |
| **G02** | PARTIAL | **unchanged PARTIAL** | B SpectralSettings **不在 tip** — 不发明 MET |
| **G06** / **G17** | PARTIAL | **unchanged — BLOCKED** | 未发明路径 |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false` |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_2f8162b.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:45` Asia/Shanghai: Web tip **`9256a2d`** vs desktop `17471a6` — G02 PARTIAL deepened (D `4cf4f64` FFT window/overlap publish + B wave21 SpecParamStrip). G18 still PARTIAL (multi-view polish). ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_9256a2d.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`e8f0881`) | Now (`9256a2d`) | Note |
|----|---------------------|-------------------|------|
| **G02** | PARTIAL（live window/overlap 残） | **PARTIAL 加深** | D publish + B strip MET；SpectralSettings/stftN wire → **未 CLOSED** |
| **G18** | PARTIAL | **unchanged PARTIAL** | multi-view polish 残 |
| **G06** / **G17** | PARTIAL | **unchanged — BLOCKED** | 未发明路径 |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false` |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_9256a2d.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:39` Asia/Shanghai: Web tip **`e8f0881`** vs desktop `17471a6` — G18 PARTIAL deepened (C dwell-only historic `resolveNbPsdLinkedFreqHz` + scrubber sync). Not CLOSED (full multi-view polish residual). ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_e8f0881.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`4937422`) | Now (`e8f0881`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL（dwell-only historic 残） | **PARTIAL 加深** | dwell-peak/center + scrubber MET；full multi-view polish → **未 CLOSED** |
| **G06** / **G17** | PARTIAL | **unchanged — BLOCKED** | 未发明路径 |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false` |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_e8f0881.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:36` Asia/Shanghai: Web tip **`4937422`** vs desktop `17471a6` — evidence-only G `d731897` (web-5c569c2 G02 DSP + G18 NB PSD vline). No apps/packages delta. Statuses unchanged. ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_4937422.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`5c569c2`) | Now (`4937422`) | Note |
|----|---------------------|-------------------|------|
| **G18** / **G02** | PARTIAL 加深 | **unchanged PARTIAL** | G corroborates；residuals 仍在 → **未 CLOSED** |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false` |
| **G06** / **G17** | PARTIAL | **unchanged — BLOCKED** | 未发明路径；wave20 C/D 未落地 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_4937422.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:31` Asia/Shanghai: Web tip **`5c569c2`** vs desktop `17471a6` — G18/G02 PARTIAL deepened (C `0a604d1` NB PSD freq vline; B `f7a4b13` wave19 DSP/FFT/detectRunFeed stamps). ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_5c569c2.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`088f322`) | Now (`5c569c2`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL（NB PSD freq 残） | **PARTIAL 加深** | `0a604d1` freq vline + Esc clears linked MET；dwell-only historic → **未 CLOSED** |
| **G02** | PARTIAL（live DSP 残） | **PARTIAL 加深** | `f7a4b13` DSP/FFT/feed stamps MET；window/overlap `—` → **未 CLOSED** |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false`；true native 仍残 |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_5c569c2.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:26` Asia/Shanghai: Web tip **`088f322`** vs desktop `17471a6` — evidence-only G `950a1d0` (web-14cc45f Esc/NB + soft wave17). No apps/packages delta. G18 PARTIAL unchanged (NB PSD freq residual). ChartMarkOverlay backticks=16. G06/G17 still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_088f322.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`14cc45f`) | Now (`088f322`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL | **unchanged PARTIAL** | G pack corroborates Esc/NB MET；NB PSD freq → **未 CLOSED** |
| **G19** | PARTIAL | **unchanged** | `data-native-qfiledialog=false`；true native 仍残 |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_088f322.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:22` Asia/Shanghai: Web tip **`14cc45f`** vs desktop `17471a6` — G18 PARTIAL deepened (C `ae63355` Esc clearActivePinnedCursor + NB wave linkedX). NB PSD freq overlay residual → not CLOSED. G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_14cc45f.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`eca5a16`) | Now (`14cc45f`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL（NB/Esc 残） | **PARTIAL 加深** | `ae63355` Esc clear + NB wave linkedX MET；NB PSD freq overlay → **未 CLOSED** |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_14cc45f.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:19` Asia/Shanghai: Web tip **`eca5a16`** vs desktop `17471a6` — G08/G07/G18 PARTIAL deepened (B `becd1e4` shell keyboard + Worker inspector feed + rail linkedCursor twin; G `0e5ab7c` prior-tip only). G19 true native QFileDialog still residual. G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_eca5a16.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`c9ed974`) | Now (`eca5a16`) | Note |
|----|-------------------|-----------------|------|
| **G08** | PARTIAL（shell re-shot 残） | **PARTIAL 加深** | `becd1e4` Arrow/Home/Esc keyboard MET；full re-shot → **未 CLOSED** |
| **G07** | PARTIAL（Worker 残） | **PARTIAL 加深** | inspector created/updated/uiMessages/feed MET；全 Qt Worker → **未 CLOSED** |
| **G18** | PARTIAL（NB/Esc/rail 残） | **PARTIAL 加深** | rail linkedCursor twin MET；NB multi-view / chart Esc → **未 CLOSED** |
| **G19** | PARTIAL | **unchanged PARTIAL** | true native QFileDialog 仍残 |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_eca5a16.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:14` Asia/Shanghai: Web tip **`c9ed974`** vs desktop `17471a6` — G19 PARTIAL deepened (B `b50b3c5` MeasuredEvidenceTrace + Inspector + OS chrome wave16). True native QFileDialog still residual. G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_c9ed974.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`2bcef55`) | Now (`c9ed974`) | Note |
|----|-------------------|-----------------|------|
| **G19** | PARTIAL（Measured/Inspector/native 残） | **PARTIAL 加深** | `b50b3c5` MeasuredEvidenceTrace + Inspector + OS chrome MET；**true native QFileDialog 仍残** → **未 CLOSED** |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_c9ed974.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:12` Asia/Shanghai: Web tip **`2bcef55`** vs desktop `17471a6` — G18 PARTIAL deepened (C linkedCursor Main/Aux store+pin+clear; G `cf0bca5` prior-tip only). G19 residual confirmed still PARTIAL. G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_2bcef55.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`85596ed`) | Now (`2bcef55`) | Note |
|----|-------------------|-----------------|------|
| **G18** | PARTIAL（multi-chart linked-cursor 残） | **PARTIAL 加深** | `2bcef55` Main/Aux store+pin+clear MET；NB multi-view / Esc-clear / rail twin → **未 CLOSED** |
| **G19** | PARTIAL | **unchanged PARTIAL** | MeasuredEvidenceTrace / true native QFileDialog 残仍在 |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_2bcef55.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:03` Asia/Shanghai: Web tip **`85596ed`** vs desktop `17471a6` — G19 PARTIAL deepened (B `d178f8e` Auxiliary 3-col + extra facts + OS dialog chrome; G `014ec83` prior-tip only). G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_85596ed.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`b88443e`) | Now (`85596ed`) | Note |
|----|-------------------|-----------------|------|
| **G19** | PARTIAL（Auxiliary/native dialog 残） | **PARTIAL 加深** | `d178f8e` Auxiliary 3-col + extra facts + OS chrome MET；MeasuredEvidenceTrace / true native QFileDialog → **未 CLOSED** |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_85596ed.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 01:00` Asia/Shanghai: Web tip **`b88443e`** vs desktop `17471a6` — G11/G02/G07/G08 PARTIAL deepened (C `b71010b` sourceKind + hover sync; B `b057d2d` wave14 strip/Worker/shell; G `2bc48d3` prior-tip only). G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_b88443e.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`6ada5b0`) | Now (`b88443e`) | Note |
|----|-------------------|-----------------|------|
| **G11** | PARTIAL（sourceKind/hover 残） | **PARTIAL 加深** | `b71010b` sourceKind colors + setHoveredMark MET；PlotWidget 余量 → **未 CLOSED** |
| **G02** | PARTIAL | **PARTIAL 加深** | `b057d2d` wave14 频率/窗/重叠 QLabel MET；live DSP → **未 CLOSED** |
| **G07** | PARTIAL | **PARTIAL 加深** | `b057d2d` real-caps Worker + honest BLOCKED gaps MET；全 Qt Worker → **未 CLOSED** |
| **G08** | PARTIAL | **PARTIAL 加深** | `b057d2d` 278/390 + aria + bottom min/range MET；full shell re-shot → **未 CLOSED** |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —详 `INCREMENTAL_b88443e.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 00:57` Asia/Shanghai: Web tip **`6ada5b0`** vs desktop `17471a6` — G19 PARTIAL deepened (B `ad4b617` AdaptiveValueEdit-in-cell cols 4–7 + AnnotationEvidencePanel + browserSaveFile; G `03381ce` prior-tip only). G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_6ada5b0.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`6df15bc`) | Now (`6ada5b0`) | Note |
|----|---------------------|-------------------|------|
| **G19** | PARTIAL （Adaptive/Evidence/QFileDialog 残） | **PARTIAL 加深** | `ad4b617` Adaptive-in-cell + Evidence + browserSave MET；Auxiliary 3-col / native dialog chrome 残 → **未 CLOSED** |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

—— **OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）** —— `INCREMENTAL_6ada5b0.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 00:51` Asia/Shanghai: Web tip **`6df15bc`** vs desktop `17471a6` — G11/G18 PARTIAL deepened (C `58df6bf` unselected dashed+hover tip; B `7d1a6ed` rail pin z-index wave12). G06 eye/bitstream + G17 recognition still BLOCKED. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_6df15bc.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`4c28588`) | Now (`6df15bc`) | Note |
|----|---------------------|-------------------|------|
| **G11** | PARTIAL （unselected polish 残） | **PARTIAL 加深** | `58df6bf` dashed+tip MET；sourceKind/table hover 残 — **未 CLOSED** |
| **G18** | PARTIAL （rail scrubber 大体完） | **PARTIAL 加深** | `7d1a6ed` pin stack MET；multi-chart sync 残 — **未 CLOSED** |
| **G06** | PARTIAL | **unchanged — eye/bitstream BLOCKED** | 未发明路径 |
| **G17** | PARTIAL | **unchanged — recognition BLOCKED** | 未发明路径 |

———**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**—— `INCREMENTAL_6df15bc.md`；**无矩阵 PASS**。
> Bot-A `2026-10-22 00:47` Asia/Shanghai: Web tip **`4c28588`** vs desktop `17471a6` — G19 PARTIAL deepened (B `797a5f1` editCell cols 1/4/5/6/7 + JSON/CSV export; G `9e4a79c` evidence wave9/10 only; early-audit before next C/B tip). Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_4c28588.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`a48481d`) | Now (`4c28588`) | Note |
|----|---------------------|-------------------|------|
| **G19** | PARTIAL 加深（editCell/export 残） | **PARTIAL 加深** | `797a5f1` editCell+export MET；AdaptiveValueEdit-in-cell / Evidence / QFileDialog 残 — **未 CLOSED** |
| **G02** | PARTIAL | **PARTIAL 加深（轻）** | wave11 overflow QLabel MET — **未 CLOSED** |
| **G08** | PARTIAL | **PARTIAL 加深（轻）** | wave11 shell-wave MET — **未 CLOSED** |
| **G18** | PARTIAL | **PARTIAL 加深（轻）** | rail scrubber wave11 max MET — **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详 `INCREMENTAL_4c28588.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 00:40` Asia/Shanghai: Web tip **`a48481d`** vs desktop `17471a6` — G19/G11/G18 PARTIAL deepened (B `daa1125` interactive AnnotationPanel; C `7bfc86c` file-fullRange + margin-map/scrubber; supersedes draft INCREMENTAL_787623d). Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_a48481d.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`f9a56b8`) | Now (`a48481d`) | Note |
|----|-------------------|-----------------|------|
| **G19** | PARTIAL 加深（interactive 残） | **PARTIAL 加深** | `daa1125` review bar MET；editCell/export 残 → **未 CLOSED** |
| **G11** | PARTIAL 加深（file-fullRange 残） | **PARTIAL 加深** | `7bfc86c` file-fullRange body+edge MET；unselected polish 残 → **未 CLOSED** |
| **G18** | PARTIAL 加深（margin/scrubber 残） | **PARTIAL 加深** | `7bfc86c` margin-map + STFT scrubber MET；right-rail twin 残 → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表 `INCREMENTAL_a48481d.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 00:38` Asia/Shanghai: Web tip **`787623d`** vs desktop `17471a6` — G19 PARTIAL deepened (B `daa1125` interactive AnnotationPanel review bar locate/delete/edit/segment + apply/cancel; G02/G08 skim); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_787623d.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`f9a56b8`) | Now (`787623d`) | Note |
|----|-------------------|-----------------|------|
| **G19** | PARTIAL 加深（full interactive 残） | **PARTIAL 加深** | `daa1125` review bar locate/delete/edit/segment MET；editCell/export 残 → **未 CLOSED** |
| **G02** | PARTIAL 加深 | **PARTIAL 加深（轻）** | wave9 palette-unit/mode-caption MET → **未 CLOSED** |
| **G08** | PARTIAL 加深 | **PARTIAL 加深（轻）** | wave9 resize focus MET → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表 `INCREMENTAL_787623d.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 00:30` Asia/Shanghai: Web tip **`f9a56b8`** vs desktop `17471a6` — G11/G18/G19 PARTIAL deepened (C `e688975` bounds+unselected PointingHand + STFT pin; B `9e175d4` right-rail pin + AnnotationPanel re-shot + G02/G08 skim; ort kept both chrome). Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_f9a56b8.md`. **No PASS.** matrix_pass_claimed: false.

| ID | Prior (`5a0b035`) | Now (`f9a56b8`) | Note |
|----|-------------------|-----------------|------|
| **G11** | PARTIAL 加深（bounds/unselected 残） | **PARTIAL 加深** | `e688975` view-bounds clamp + PointingHand MET；file-fullRange 残 → **未 CLOSED** |
| **G18** | PARTIAL 加深（chrome 残） | **PARTIAL 加深** | STFT click pin (C) + right-rail pin (B) MET；margin-map/scrubber 残 → **未 CLOSED** |
| **G19** | PARTIAL 加深（re-shot 残） | **PARTIAL 加深** | `9e175d4` Qt headers + range inspector MET；全交互 re-shot 残 → **未 CLOSED** |
| **G02** | PARTIAL 加深 | **PARTIAL 加深（轻）** | wave8 unit/freq/spacing QLabels MET → **未 CLOSED** |
| **G08** | PARTIAL 加深 | **PARTIAL 加深（轻）** | wave8 shell-reshot stamps MET → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详见 `INCREMENTAL_f9a56b8.md`。**无矩阵 PASS**。
> Bot-A `2026-10-22 00:20` Asia/Shanghai: Web tip **5a0b035**: G19/G07/G02/G08 PARTIAL deepened (B wave7); see `INCREMENTAL_5a0b035.md`. **No PASS.** matrix_pass_claimed: false. Counts OPEN 7 / PARTIAL 16 / CLOSED 2.
> Bot-A `2026-10-22 00:13` Asia/Shanghai: Web **`2d9e83b`** vs desktop `17471a6` — G11/G18 PARTIAL deepened (B `85dab15` Overlay backticks restored; D `08b424e` store→DDC; C `4249d64` UI→store; Overlay BLOCKER + unwired residual cleared; not CLOSED); supersedes draft INCREMENTAL_aeacc5f. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_2d9e83b.md`. **No PASS.**

| ID | Prior (`93de5db`) | Now (`2d9e83b`) | Note |
|----|---------------------|-----------------|------|
| **G11** | PARTIAL 加深（Overlay 0-backtick BLOCKER） | **PARTIAL 加深** | `85dab15` backticks 10 恢复；ClosedHand body-drag 路径 MET；bounds/unselected 残 → **未 CLOSED** |
| **G18** | PARTIAL 加深（psdMode 未接线） | **PARTIAL 加深** | UI→store (`4249d64`) + store→DDC (`08b424e`) MET；更广 PSD chrome 残 → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_2d9e83b.md`。**无矩阵 PASS**。

> Bot-A `2026-10-22 00:07` Asia/Shanghai: Web **`93de5db`** vs desktop `17471a6` — G11 PARTIAL deepened (C `612c8a1` body-drag ClosedHand helpers/CSS MET; **ChartMarkOverlay.tsx template-literal corruption BLOCKS runtime** → not CLOSED); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_93de5db.md`. **No PASS.**

| ID | Prior (`91ae551`) | Now (`93de5db`) | Note |
|----|-------------------|-----------------|------|
| **G11** | PARTIAL 加深（body-drag ClosedHand 残） | **PARTIAL 加深** | `612c8a1` SizeAll/ClosedHand helpers+CSS+probes MET；Overlay 模板字面量被剥光（0 backticks）运行时 BLOCKED；bounds/unselected 残 → **不 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_93de5db.md`。**无矩阵 PASS**。

> Bot-A `2026-10-22 00:05` Asia/Shanghai: Web **`91ae551`** vs desktop `17471a6` — G18/G17/G19/G07/G02/G08 PARTIAL deepened (D `0b6a113` PSD series; `1c7643d` adaptiveValue; B wave5 column matrix + detectRunFeed + chrome + collapse); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_91ae551.md` (supersedes draft INCREMENTAL_1c7643d). **No PASS.**

| ID | Prior (`ee42717`) | Now (`91ae551`) | Note |
|----|---------------------|-------------------|------|
| **G18** | PARTIAL 加深（series → D） | **PARTIAL 加深** | `0b6a113` frame/statistical series MET；UI→DDC `psdMode` 未接线 + pinned dwell 残 → **未 CLOSED** |
| **G17** | PARTIAL 加深（recognition BLOCKED） | **PARTIAL 加深** | `1c7643d` adaptiveValue 模板修复 MET；recognition BLOCKED → **未 CLOSED** |
| **G19** | PARTIAL 加深（全表残） | **PARTIAL 加深** | `91ae551` Qt 全列矩阵 MET；edit/re-shot 残 → **未 CLOSED** |
| **G07** | PARTIAL 加深（live Detect 残） | **PARTIAL 加深** | `91ae551` detectRunFeed LocalCompute MET；全 Qt Worker 残 → **未 CLOSED** |
| **G02** | PARTIAL 加深（chrome 残） | **PARTIAL 加深** | `91ae551` mode/workspace/overflow/aux QLabel MET；更广 chrome 残 → **未 CLOSED** |
| **G08** | PARTIAL 加深（collapse 未验） | **PARTIAL 加深** | `91ae551` bottom 29px + left 8px collapse+persist MET；right-rail/re-shot 残 → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_91ae551.md`。**无矩阵 PASS**。
> Bot-A `2026-10-21 23:54` Asia/Shanghai: Web **`ee42717`** vs desktop `17471a6` — G11/G18/G17 PARTIAL deepened (C `4611be6` mark-edge 8 handles + PSD mode UI; E `3d3f3e5` active-segment + visible↔navWindow; recognition still BLOCKED); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_ee42717.md` (supersedes planned INCREMENTAL_4611be6). **No PASS.**

| ID | Prior (`f5171fc`) | Now (`ee42717`) | Note |
|----|-------------------|-----------------|------|
| **G11** | PARTIAL 加深（mark-edge 残） | **PARTIAL 加深** | `4611be6` 8-handle edgeCursor MET；body-drag ClosedHand / non-current hover 残 → **未 CLOSED** |
| **G18** | PARTIAL 加深（PSD mode C/D —） | **PARTIAL 加深** | `4611be6` 驻留帧谱/统计谱 UI slot MET；series 仍 D → **未 CLOSED** |
| **G17** | PARTIAL 加深（segment/visible 残 + recognition BLOCKED） | **PARTIAL 加深** | `3d3f3e5` active-segment + visible↔navWindow MET；recognition BLOCKED → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_ee42717.md`。**无矩阵 PASS**。
> Bot-A `2026-10-21 23:47` Asia/Shanghai: Web **`f5171fc`** vs desktop `17471a6` — G17 PARTIAL deepened (E `72f208c` AdaptiveValueEdit / Fs notes / rangeOrigin+ROI chrome; recognition still BLOCKED); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_f5171fc.md`. **No PASS.**

| ID | Prior (`647978c`) | Now (`f5171fc`) | Note |
|----|-------------------|-----------------|------|
| **G17** | PARTIAL 加深（Adaptive/Fs/ROI 残 + recognition BLOCKED） | **PARTIAL 加深** | `72f208c` AdaptiveValueEdit + Fs-gated physical times + rangeOrigin/ROI chrome MET；active-segment list + visible-region align 残；recognition BLOCKED → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_f5171fc.md`。**无矩阵 PASS**。
> Bot-A `2026-10-21 23:41` Asia/Shanghai: Web **`647978c`** vs desktop `17471a6` — G19/G07/G02/G08/G11 PARTIAL deepened (B `d7d44c1` table/paging/quality+G07/G02/G08+G18 shell; C `2ac1f9b` overview OpenHand; G `635d07a` evidence); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_647978c.md`. **No PASS.**

| ID | Prior (`9248453`) | Now (`647978c`) | Note |
|----|---------------------|-------------------|------|
| **G19** | PARTIAL 加深（table/paging/quality 缺） | **PARTIAL 加深** | `d7d44c1` Qt-ish table + paging(200) + quality MET；完整 Qt 列矩阵残 → **非 CLOSED** |
| **G07** | PARTIAL 加深（shell MET） | **PARTIAL 加深** | `d7d44c1` fuller docks（quality/paging/detect header+inspector）MET；live Detect feeds 残 → **非 CLOSED** |
| **G02** | PARTIAL 加深（overflow QLabel 残） | **PARTIAL 加深** | `d7d44c1` overflow STFT点数/色板 (+检测ROI/标记) MET；更广 chrome 残 → **非 CLOSED** |
| **G08** | PARTIAL 加深（底栏高度缺） | **PARTIAL 加深** | `d7d44c1` bottom height 100–500+persist MET；collapse-to-min 未复验 → **非 CLOSED** |
| **G11** | PARTIAL 加深（overview OpenHand 缺） | **PARTIAL 加深** | `2ac1f9b` overview grab/grabbing/pointer MET；mark-edge 残 → **非 CLOSED** |
| **G18** | PARTIAL | **PARTIAL 加深** | `d7d44c1` STFT N·palette shell MET；PSD mode 仍 C/D `—` → **非 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_647978c.md`。**无矩阵 PASS**。
> Bot-A `2026-10-21 23:20` Asia/Shanghai: Web **`9248453`** vs desktop `17471a6` — G19/G02/G08/G07 PARTIAL deepened (B `d54af1b`: AnnotationPanel paint, Spec QLabel, column resize, BottomPanel shell); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_9248453.md`. **No PASS.**

| ID | Prior (`f4c67be`) | Now (`9248453`) | Note |
|----|---------------------|-------------------|------|
| **G19** | PARTIAL 加深（multi-select paint 缺） | **PARTIAL 加深** | `d54af1b` current/selected/hover paint MET；Qt table/paging/quality 残 → **未 CLOSED** |
| **G02** | PARTIAL 加深（strip QLabel 残） | **PARTIAL 加深** | `d54af1b` STFT点数/色板/参考·动态 QLabel MET；overflow QLabel 残 → **未 CLOSED** |
| **G08** | PARTIAL（278/390 MET；resize 缺） | **PARTIAL 加深** | `d54af1b` resize+persist MET；底栏高度 resize 残 → **未 CLOSED** |
| **G07** | PARTIAL（handoff→B） | **PARTIAL 加深** | `d54af1b` Annotation+Detection shell MET；完整 Qt panel 残 → **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_9248453.md`。**无矩阵 PASS**。
> Bot-A `2026-10-21 23:12` Asia/Shanghai: Web **`f4c67be`** vs desktop `17471a6` — G11/G17/G06 PARTIAL deepened (C OpenHand `363744f`, E full param grid `f87b94b`, D G06 BLOCKED re-affirm `e3b86f0` + G07→B handoff); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_f4c67be.md`. **No PASS.**

| ID | Prior (`8733cc1`) | Now (`f4c67be`) | Note |
|----|-------------------|-----------------|------|
| **G11** | PARTIAL 加深（OpenHandCursor 缺） | **PARTIAL 加深** | `363744f` OpenHand/ClosedHand on axes；Navigation overview / mark-edge 残 → **未 CLOSED** |
| **G17** | PARTIAL 加深（全参 Qt 网格缺） | **PARTIAL 加深** | `f87b94b` full DetectionCard param grid + TRT honor；AdaptiveValueEdit / ROI chrome / recognition BLOCKED → **未 CLOSED** |
| **G06** | PARTIAL（eye/bitstream BLOCKED） | **PARTIAL（BLOCKED 笔记加深）** | `e3b86f0` eye/bitstream 诚实 BLOCKED 再确认；无假眼图/比特流 → **未 CLOSED** |
| **G07** | PARTIAL | **PARTIAL（handoff）** | 残项归属 **Bot-B**（`BOT_D_G07_HANDOFF_TO_B.md`）→ **未 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_f4c67be.md`。**无矩阵 PASS**。
> Bot-A `2026-10-21 23:00` Asia/Shanghai: Web **`8733cc1`** vs desktop `17471a6` — G17/G19/G11 PARTIAL deepened (E DetectionCard+`.engine`, B CN chrome, C axis-only pan); no bucket flips. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_8733cc1.md`. **No PASS.**


## INCREMENTAL @ `8733cc1`（相对 `425cb40`；含 B 487d04d G19 + E 8bf1390/ecee9a2 G17 + C 3535889 G11）
| ID | 先前 | @8733cc1 | 证据 |
|----|------|----------|------|
| **G17** | PARTIAL 加深（DetectionCard/可选.engine 缺） | **PARTIAL 加深** | `8bf1390` selectable `.engine` + DetectionCard chrome；全量 Qt 参数网格残；recognition BLOCKED — **非 CLOSED** |
| **G19** | PARTIAL 加深（CN relation/glyphs/多选残） | **PARTIAL 加深** | `487d04d` desktop-cn-chrome / glyphs / multi-select / relationText；Qt AnnotationPanel 绘制残 — **非 CLOSED** |
| **G11** | PARTIAL 加深（axis-only pan 残） | **PARTIAL 加深** | `3535889` hitChartZone axis-only；OpenHandCursor 残；middle-button N/A@桌面 — **非 CLOSED** |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_8733cc1.md`。**无矩阵 PASS**。
---
> Bot-A `2026-10-21 22:48` Asia/Shanghai: Web **`425cb40`** vs desktop `17471a6` — G17/G18/G19/G11/G02 PARTIAL deepened (E+B+C); G18/G08 OPEN→PARTIAL. Counts OPEN 7 / PARTIAL 16 / CLOSED 2. See `INCREMENTAL_425cb40.md` (supersedes planned ef89727/e9153b8). **No PASS.**

## INCREMENTAL @ `425cb40`（相对 `8783b55`；含 ef89727 G17 + e9153b8 B + C 5de2e6b；替代未交 ef89727/e9153b8）
| ID | 先前 | @425cb40 | 证据 |
|----|------|----------|------|
| **G17** | PARTIAL | **PARTIAL 加深** | `59f9820` inventory/cancel/precheck；DetectionCard/可选 .engine 仍缺 → **不 CLOSED** |
| **G18** | OPEN | **PARTIAL** | `0eabe56` display-summary 参考/动态；PSD N/STFT N/palette 残 |
| **G19** | PARTIAL | **PARTIAL 加深** | ProjectTree 已接 tooltip/title/unread；中文 relation/多选残 → **不 CLOSED** |
| **G11** | PARTIAL | **PARTIAL 加深** | `5de2e6b` both-edges≥8px；axis-only pan 残；middle-button N/A@桌面 |
| **G02** | PARTIAL | **PARTIAL 加深** | B toolbar/overflow + C `formatPhysicalCaptionPair`；更深 strip 残 |
| **G08** | OPEN | **PARTIAL** | 278/390 MET；resize 残 → **不 CLOSED** |
| **G07** | PARTIAL | **PARTIAL 加深** | dock hosts；完整 Qt panel 残 |

计数：**OPEN 7 · PARTIAL 16 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_425cb40.md`。**无矩阵 PASS**。
---> Bot-A `2026-10-21 22:45` Asia/Shanghai: Web **`8783b55`** vs desktop `17471a6` — short G19 (F `bb58265` / `e134bb6` tree API: title/tooltip/relation/unread/detectionRuns). **G19 stays PARTIAL** (API MET; ProjectTree still `title={node.detail||label}`, no tooltip wire). Counts OPEN 9 / PARTIAL 14 / CLOSED 2. See `INCREMENTAL_8783b55.md`. **No PASS.**
# UI 鐎靛湱鐡戝顔跨獩鐎孤ゎ吀閿涘湐ot-A 婢х偤鍣烘径宥嗙壋 @ 17471a6閿?

> Bot-A `2026-10-21 22:37` Asia/Shanghai: Web **`0e31e6d`** vs desktop `17471a6` — G06 golden tighten + recognition BLOCKED assess; **G06 stays PARTIAL** (no flip). Counts OPEN 9 / PARTIAL 14 / CLOSED 2. See `INCREMENTAL_0e31e6d.md`. Next main tip `e134bb6` (G19) noted only — not this audit subject. **No PASS.**

> Bot-A `2026-10-21 22:30` Asia/Shanghai: Web **`ba868e4`** vs desktop `17471a6` — **G14 CLOSED**; G17 OPEN→**PARTIAL**; G07 OPEN→**PARTIAL**; G06/G02/G11/G13/G19 PARTIAL deepened. Counts OPEN 9 / PARTIAL 14 / CLOSED 2. See `INCREMENTAL_ba868e4.md`. Unpushed cf1b3f8 draft abandoned. **No PASS.**

> Bot-A `2026-10-21 22:20` Asia/Shanghai: Web **`23c38d0`** vs desktop `17471a6` -- short G01 delta (`06911b3`): BrandV2/window-controls + View fit/restore + File depth **MET**; **G01 stays PARTIAL** (not CLOSED). Full reopen NOT needed. Counts unchanged OPEN 9 / PARTIAL 13 / CLOSED 1. See `INCREMENTAL_23c38d0.md`. **No PASS.**


| 鐎涙顔?| 閸?|
|------|-----|
| 閺冨爼妫块敍鍦搒ia/Shanghai閿?| 2026-10-21 22:00:00閿涘澁ebase `360aba7` = `62d3b70` + `ffeff52`閿?|
| 婢跺秵鐗抽懓?| Bot-A閿涘湹SS-鐎孤ゎ吀A閿涘ˇwork/bot-a-audit` worktree |
| **Web tip閿涘潵rigin/main閿?* | **`360aba7`**閿涘湐 `ffeff52` rename + view history over `62d3b70`閿?|
| **濡楀矂娼版稉濠冪埗 tip** | **`17471a6488383b456281d12cb1a6d3d80290205d`**閿涘潉rebuild/a143-native`閿?|
| 閸忓牓鐛?Bot-A 閺傚洦銆?| `INCREMENTAL_62d3b70.md`閿涙稒婀版潪?**`INCREMENTAL_360aba7.md`** |
| 閺堫剙婀?rebuild閿涘牆褰х拠浼欑礆 | `D:\project\signal_studio_rebuild` @ `17471a6` |
| 閼煎啫娲?| 閸欘亣顕伴敍?*閺堫亝鏁?*鐎圭偟骞囬敍娑欐弓閸忓彉闊╅弽?checkout閿涙稐绗?push `signal_studio` |
| 妤犲本鏁圭痪锔芥将 | IQ 娴?`resources\sigmf_data_demo`閿涙稒膩閸ㄥ绮?rebuild `*.engine` |

> **Explicit: Bot-A 娑撳秷鍤滈幎銉х叐闂?PASS閵?*

---



## INCREMENTAL @ `8783b55`（相对 `0e31e6d`；短 G19）

| ID | 先前 | @8783b55 | 证据 |
|----|------|----------|------|
| **G19** | PARTIAL 加深 | **PARTIAL（API 呈现加深）** | `bb58265`/`e134bb6`: title/tooltip/sourceTooltip、relation detail、unread、detectionRuns + re-exports；`ProjectTree.tsx` 仍 `title={node.detail\|\|label}`，未接 `node.tooltip`/`title`；**不 CLOSED** |
| 其余 | 同 `0e31e6d` | **不变** | tip 无其它产品实现 |

计数：**OPEN 9 · PARTIAL 14 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_8783b55.md`。**无矩阵 PASS**。

---

## INCREMENTAL @ `0e31e6d`（相对 `ba868e4`；G06 golden）

| ID | 先前 | @0e31e6d | 证据 |
|----|------|----------|------|
| **G06** | PARTIAL 加深 | **PARTIAL（golden+BLOCKED 评估）** | `9e65f0f` 星座/AM·FM·RMS/STFT 数值黄金；眼图 `EYE_TIMING_SYNC_MISSING`；比特流 `BITSTREAM_DEMOD_MISSING`；识别 `RECOGNITION_ENGINE_MISSING` + Bot-E FFSCN/SCN≠分类；无非测试实现 diff；**不 CLOSED** |
| 其余 | 同 `ba868e4` | **不变** | tip 无实现代码 |

计数：**OPEN 9 · PARTIAL 14 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_0e31e6d.md`。**无矩阵 PASS**。下一 tip `e134bb6`（G19）仅备注，非本审计对象。

---
## INCREMENTAL @ `ba868e4`（相对 `c63f1de` / `23c38d0`；含 cf1b3f8）

| ID | 先前 | @ba868e4 | 证据 |
|----|------|----------|------|
| **G14** | PARTIAL 近退出 | **CLOSED** | `c650273` header ROI + select 不再写 ROI；确认条保留；≠矩阵 PASS |
| **G17** | OPEN | **PARTIAL** | `a61046d` REAL_RUNTIME/TRT + chips；DetectionCard/picker 仍缺 |
| **G07** | OPEN | **PARTIAL** | `15022b5` BottomPanel 29/150；完整 dock hosts 仍缺 |
| **G06** | PARTIAL | **PARTIAL 加深** | B chrome + D DDC hooks；recognition BLOCKED；STFT 交互残 |
| **G02** | PARTIAL | **PARTIAL 加深** | strip captions + physical caption；overflow 残 |
| **G11** | PARTIAL | **PARTIAL 加深** | navigate→zoom-box；axis/middle pan 残 |
| **G13** | PARTIAL | **PARTIAL 加深** | 四角 handles + continuous-create |
| **G19** | PARTIAL | **PARTIAL 加深** | ProjectTree 接 engineering-tree；桌面呈现残 |
| 其余 | 同前 | **不变** | 截图不升格 |

计数：**OPEN 9 · PARTIAL 14 · CLOSED 2（G05, G14）· DOCS 1（G25）**。详表：`INCREMENTAL_ba868e4.md`。**无矩阵 PASS**。

---
## INCREMENTAL @ `3d7ab59`锛堢浉瀵?`360aba7` / `23baf0d`锛?
| ID | 鍏堝墠 | @3d7ab59 | 璇佹嵁 |
|----|------|----------|------|
| **G01** | PARTIAL锛坮ename+history锛?| **PARTIAL 鏃犲洖褰?* | MenuBar rename / viewHistory 浠嶅湪锛汸R#3 鏈敼 MenuBar锛沄iew 鑿滃崟浠嶇己閫傚簲/鎭㈠锛沜orner 浠嶇己 |
| **G02** | PARTIAL | **PARTIAL 鍔犳繁** | TempLayers銆屽弬鑰冦€嶃€屽姩鎬併€? 涓诲浘 levels锛汼pectrumToolbar 甯搁┗涓?strip caption/`f9f05bb` 浠嶇己 |
| **G11** | PARTIAL | **PARTIAL 鍔犳繁** | zoom-box + desktop-axis锛沶avigate 榛樿浠?pan |
| **G12** | PARTIAL | **PARTIAL 鍔犳繁** | 鍙抽敭锛氭寔缁垱寤?ROI/鍘嗗彶/fit/reset/閲嶅彔鍛戒腑 |
| **G13** | PARTIAL | **PARTIAL 鍔犳繁** | ChartMarkOverlay + 涓€瑙?handle + Ctrl/Shift 澶氶€?|
| **G14** | PARTIAL | **PARTIAL 杩戦€€鍑?* | detection-roi + confirmation 鏉★紱Enter/Esc锛涗笉鑷姩璺戯紱header 閽笌 select 鍒悕娈嬬暀 鈫?**涓?CLOSED** |
| **G15** | PARTIAL | **PARTIAL 鍔犳繁** | 鑿滃崟鍘嗗彶淇濈暀 + 涓诲浘 historyRef锛涘弻鏍堟湭缁熶竴 |
| REAL_RUNTIME | 鈥?| 澶囨敞 | DetectPage 妯箙 + gating 鎷?invent锛?*涓?*鍗囨牸 G17 |
| 鍏朵綑 | 鍚屽墠 | **涓嶅彉** | e2e 缁夸笉 CLOSED |

璁℃暟锛?*OPEN 9 路 PARTIAL 13 路 CLOSED 1锛圙05锛壜?DOCS 1锛圙25锛?*銆傝琛細`INCREMENTAL_3d7ab59.md`銆?*鏃犵煩闃?PASS**銆?
---
## INCREMENTAL @ `360aba7`閿涘牏娴夌€?`62d3b70`閿?

| ID | 閸忓牆澧?| @360aba7 | 鐠囦焦宓?|
|----|------|----------|------|
| **G01** | PARTIAL閿涘牆鍙氱紒鍕綅閸楁洩绱?| **PARTIAL 閸愬秴濮炲ǎ?* | `ffeff52`閿涙ename dialog + replaceMark閿涙硣iew back/forward閿涙矞orner/fit/reset/File 濞ｅ崬瀹虫禒宥囧繁閿涙雹ot-B **NOT PASS** |
| **G15** | OPEN | G07閳ユ弸10, G16閳ユ弸18, G21閳ユ弸24 |
| **G06** | PARTIAL | **G01**, G02閳ユ弸04, **G06**, G11閳ユ弸14, **G15**, G19閳ユ弸20, G26 |
| 閸忔湹缍?| 閸氬苯澧?| **娑撳秴褰?* | 閹搭亜娴樻稉宥呭磳閺?|

鐠佲剝鏆熼敍?*OPEN 9 璺?PARTIAL 13 璺?CLOSED 1閿涘湙05閿涘?DOCS 1閿涘湙25閿?*閵嗗倽顕涚悰顭掔窗`INCREMENTAL_360aba7.md`閵?

---

## INCREMENTAL @ `62d3b70`閿涘牏娴夌€?`ef2713a`閿?

| ID | 閸忓牆澧?| @62d3b70 | 鐠囦焦宓?|
|----|------|----------|------|
| **G01** | PARTIAL閿涘牅绮?File+View閿?| **PARTIAL 閸旂姵绻?* | `e76ba97`閿涙dit/Analysis/Tools/Help 缂?testid閿涙矞orner/rename/File 濞ｅ崬瀹虫禒宥囧繁閿涙雹ot-B WIP **no PASS** |
| **G06** | PARTIAL閿涘潵bserve DDC MET閿?| **PARTIAL 娑撳秴褰?* | `c718171`/`qa/web-905cdad` 瀵搫瀵查棃鐐碘敄 DDC閿涙稒鍩呴崶鍙ョ瑝 CLOSED閿涙驳od/DL/demod 娴犲秴锛?|
| G20 | PARTIAL | PARTIAL閿涘牆濮炲ǎ鎲嬬礆 | 閼挎粌宕?Open IQ 瀹稿弶婀侀敍娑樺帗閺佺増宓佹０鍕潔娴犲秶宸?|
| 閸忔湹缍?| 閸氬苯澧?| **娑撳秴褰?* | 閺?tip 閺冪姴顕惔鏂跨杽閻?diff閿涙稒鍩呴崶鍙ョ瑝閸楀洦鐗?|

鐠佲剝鏆熼敍?*OPEN 10 璺?PARTIAL 12 璺?CLOSED 1閿涘湙05閿涘?DOCS 1閿涘湙25閿?*閵嗗倽顕涚悰顭掔窗`INCREMENTAL_62d3b70.md`閵?

---

## INCREMENTAL DIFF閿涘牏娴夌€?`866e699` / 娑撳﹥鐖?`0f108d0`閿?

### A. 濡楀矂娼伴懛?`0f108d0` 閳?`17471a6` 妞瑰崬濮╅惃鍕繁閸欙絽褰夐崠?

| 妞瑰崬濮?SHA | 娑撳顣?| 瑜板崬鎼?ID | 閸欐ê瀵茬猾璇茬€?| 鐠囧瓨妲?|
|----------|------|---------|----------|------|
| `f9f05bb` | 閸掑棛顬囬崶鎹愩€冪€佃壈鍩呮稉搴㈢垼缁涙儳娴樼拋鍓х枂 | **G02** | **閸旂姳寮?* | `ChartControlStrip`閿涙碍甯舵禒?caption 閺嶅洨顒烽妴涔穠erflow 闁插秵瀵曟潪鎴掔箽閻掞妇鍋ｉ妴浣割嚤閼割亜灏稉搴ゎ啎缂冾喖鐡у▓闈涘瀻缁備紮绱盬eb 閼汇儰绮庨幖顒€鍙忕仦鈧?Toolbar 娴?FAIL閿涘奔绗栫€圭偟骞囬崶鎯с仈閺冨爼銆忕€靛湱鐡戦妴灞剧垼缁?閹貉傛閵嗗秷鈧矂娼憗闀愮瑓閹?|
| `a64117e` | 缁愬嫬鐢拋鍓х枂鐠?overflow / 閹广垽銆夋穱婵堟殌 | **G06** | **閸旂姳寮?* | `NarrowbandWorkspace::pageChanged`閿涙奔TFT N / 妫版垹宸?/ 缂冩垶鐗告禒?MainWindow 閺嶇袙閺嬫劧绱盤ASS 妞ゅ鐛欑拠浣瑰床妞ゅ吀绗?overflow 閸氬孩甯舵禒璺衡偓闂寸瑝娑?|
| `696ce12` | 閺勫墽銇氶幗妯款洣閵嗗苯寮懓?閸斻劍鈧降鈧?| **G18** | **閸旂姳寮?* | `displaySummary_` 閺傚洦顢嶉敍姝氶崣鍌濃偓?{level} {unit}` + `閸斻劍鈧?{range} dB`閿涘牏顩﹂妴宀€鏁搁獮鐐解偓宥嗚穿缁夊府绱氶敍娑氱翱鎼?2 娴?|
| `6499a64` | 閸ユ儳銇旈崣鍐差嚠姒绘劘鍤滈柅鍌氱安閹貉傛 | G02 | 閼冲本娅?| 娑?f9f05bb 閸氬苯鐫?strip 鐠囶厺绠熼敍娌噀b 閸ユ儳銇旀い璇插礁鐎靛綊缍?閼奉亪鈧倸绨查幎妯哄綌 |
| 2e26651 | 缁愬嫬鐢紒鐔剁 plot settings | G06 | 閸旂姳寮?| 閸掑棙鐎芥い鐢电暆閸栨牭绱盬eb 缁愬嫬鐢径姘躲€夐弮鐘卞悏鐟欙綀鐨?|
| `c1f2cce` | 瀹搞儳鈻奸弽鎴滀繆閸欓鎻ｉ崙鎴濈潔缁€?| G19 | 閼冲本娅?| 瑜版挸澧犳穱鈥冲娇/濠ф劒淇婇幁顖涚窞濞?|
| `db58394`/`17471a6` | chart-header-labels 鐠囦焦宓佽ぐ鎺撱€?| 閳?| 鐠囦焦宓?| 闁夸礁鐣鹃崢鐔烘晸閹搭亜娴?JSON閿涙稒妫ら弬鐗堝付娴?API |

**閺堫亝鏌婃晶鐐靛缁?G27**閿涙矮绗傛潻鏉垮弿闁劍濮岄崣鐘虹箻閺冦垺婀?G02/G06/G18/G19 閻ㄥ嫬濮炴稉?PASS閿涘矂浼╅崗?ID 濠曞倻些閵?

### B0. Web `main@62d3b70`閿涘湙01 menus + G shots閿涙稓娴夌€?`ef2713a`閿?

> 鐎瑰本鏆ｆ晶鐐哄櫤閿涙瓪INCREMENTAL_62d3b70.md`閵嗕敬01 PARTIAL 閸旂姵绻侀敍姹?6 PARTIAL 娑撳秴褰夐敍?*no PASS**閵?

### B0z. Web `main@ef2713a`閿涘牆宸婚崣璇х礆閿涘湙01+G06閿涙稓娴夌€?`fb2e020`閿涘绱橤06 婢?`6c17a53` + 閹搭亜娴橀敍娑氭祲鐎?`fb2e020`閿?

> 鐎瑰本鏆ｆ晶鐐哄櫤閿涙瓪INCREMENTAL_ef2713a.md閿涘牏娴夌€?d8297d1閿涙稖顫囩€电喖銆?DDC MET閿?/ 閸樺棗褰?`INCREMENTAL_d8297d1.md``閵嗗倹鍩呴崶鎯у瘶 `qa/web-6c17a53/`閿涘澃tub=false閿?*no PASS**閿涘鈧?*G06 = PARTIAL閿涘牓娼?CLOSED閿?*閵?

### B0b. Web `main@fb2e020`閿涘牆宸婚崣璇х礆 閻╃顕?`17937bb` / Bot-A `1be860d`閿涘牊婀版潪顔藉焻閸?rebase閿?

| ID | 閻樿埖鈧?| 娴狅絿鐖滈敍鍧?7937bb`閿?| 閹搭亜娴?/ COMPARISON_NOTES |
|----|------|-------------------|-------------------------|
| G01 | OPEN閳?*PARTIAL @d8297d1** | was no menubar | `MenuBar` 34px File+View+Open IQ閿涙稓宸辩紓鏍帆/閸掑棙鐎?鐢喖濮?閳?PARTIAL |
| G02 | PARTIAL | Toolbar demoted | COMPARISON_NOTES #3閿涙碍鍩呴崶鍙ョ瑝闂?chrome |
| G03 | PARTIAL | NavChrome+NavigationChart | `02-tri-chart-hosts`閿涙稒绮存潪顔荤矝缂?|
| G04 | PARTIAL | raw IQ 娴狅絿鐖滅捄顖氱窞 | `05-aux-wave-or-psd`閿涙雹ot-G 閺?PASS |
| G05 | **CLOSED** | 82/205+閹?閸欏苯鍤?| hosts/splitters 閸欘垵顫嗛敍姹OSED 娴犲秳浜掓禒锝囩垳娑撳搫鍣?|
| G06 | OPEN->**PARTIAL @6c17a53**; **DDC sub MET @ef2713a** | was stub @fb2e020 | observe-page real Worker DDC; mod/DL/demod still shell; not CLOSED |
| G17 | OPEN | Detect 缁墽鐣?| `08-rail-detect` 妞ょ數楠囬敍娌瀗gine picker 閺堫亪鐛?|
| G25 | DOCS | StatusBar | ~28px+閺傚洣娆㈤崥宥忕幢閺?gesture-hint |
| G26 | PARTIAL | demo IQ | 閹规洝骞忛崝鐘烘祰 `0000000`閿涙饱etect `.engine` 閸掓銆冮張顏堢崣 |

鐠囷箒銆冮敍姝欼NCREMENTAL_fb2e020.md`閿涙稖鐦夐幑顕嗙窗`qa/COMPARISON_NOTES.md`閵?

### B. Web `main@563458a` 閻╃顕?`866e699` 閸╄櫣鍤庡鏌ユ４閸?/ 闁劌鍨庨梻顓炴値

| ID | 閺傛壆濮搁幀?| 鐠囦焦宓侀敍鍧igin/main閿?| 娴犲秶宸?|
|----|--------|---------------------|------|
| G11 | **PARTIAL** | `HeatmapCanvas`閿涙瓪wheelModel="desktop-axis"`閵嗕梗gesture` pan\|box閿涙矖MainChartHost` 閹恒儱鍙?| 濡楀棝鈧鍟?*鐟欏棗娴橀弨鎯с亣**閿涘潱avigate 閹緤绱氶敍娑橆嚤閼割亜灏崡鏇炲毊娣?span閿涙稑鐣弫纾嬮叡閻戭厼灏梾鏃傤瀲妤犲本鏁?|
| G12 | **PARTIAL** | `MainChartHost` `onContextMenu` + `data-testid="chart-context-menu"` | 閹镐胶鐢婚崚娑樼紦瀵偓閸忕偨鈧浇顫嬮崶?back/forward/fit/reset閵嗕線鍣搁崣鐘崇垼鐠佹澘鍨悰銊︽弓姒?|
| G13 | **PARTIAL** | marker 瀹搞儱鍙?+ box 閳?`__wssM06.addManualMark` | 閹貉冨煑閻愯瀚嬮弨骞库偓涓唗rl/Shift 婢舵岸鈧鈧椒绗岄崚妤勩€冮崣灞芥倻娑撯偓閼?|
| G14 | **PARTIAL** | `activeTool==='select'` box閳壊OI閿涙宝nter 閸愭瑥鍙嗛獮?`setRightPage('detect')`閿涙宝sc 閸欐牗绉?| 閻欘剛鐝涢妴灞绢梾濞?ROI閵嗗秴鎳￠崥宥呭弳閸欙綇绱辩涵顔款吇閺?UI閿涙稐绗屽▔?select 鐠囶厺绠熼崚鍡欘瀲 |
| G19 | **PARTIAL** | `packages/project-io`閿涙瓪importSigmfStream`閵嗕梗engineeringTreeFromProject`閵嗕梗demo-iq-paths` allowlist閿涙雹ot-F 鐠囦焦宓?| `ProjectTree` 娴?sample/JSON 娴兼ê鍘涢敍娑欐弓鐎瑰本鏆ｉ幒銉у殠瀹搞儳鈻奸弽鎴炴惙娴?|
| G20 | **PARTIAL** | SigMF 鐎电厧鍙嗗ù?+ demo 鐠侯垰绶為梻銊ь洣 | 閼挎粌宕?閸涙垝鎶ら弽蹇撳弳閸欙絼绮涚紓鐚寸幢SpectrumToolbar `btn-open-iq-wav` 娴犲秴婀?|
| G25 | **DOCS** | Bot-G `QA_CHECKLIST` 瀹?fold G25 | StatusBar 鐎圭偟骞囩拠顓濈疅娴犲秴浜?dsp/fft |
| G26 | **PARTIAL閳帟绻?CLOSED閿涘牆鎮楃粩?閺傚洦銆傞敍?* | Bot-E `ae69401` TRT `.engine` under rebuild閿涙矖demo-iq-paths`閿涙焙A PRE-2/3 | Detect UI 妞よ褰ч弳鎾苟閺嶆垵鍞?`.engine`閿涙矖model_layout` 娴犲秵鐏囨稉?`.pth`/`.onnx` 閺傚洣娆㈢猾璇茬€?閳?娑撳秴绶辨担婊€璐?PASS 閸欘垶鈧銆?|

**娴?OPEN閿涘牊妫ょ€圭偠宸濇竟鍐茬湴闂傤厼鎮庨敍?*閿涙01閳ユ弸10閵嗕笩15閳ユ弸18閵嗕笩21閳ユ弸24閿涘湙18 閸ョ姵顢戦棃銏犲娑撱儲娲块崗鎶芥暛閿涘鈧?

### C. 閻樿埖鈧浇顓搁弫甯礄閺堫剝鐤嗛敍?

| 閻樿埖鈧?| IDs |
|------|-----|
| OPEN | G07閳ユ弸10, G15閳ユ弸18, G21閳ユ弸24 |
| PARTIAL | **G01**, G02閳ユ弸04, **G06**, G11閳ユ弸14, G19閳ユ弸20, G26 |
| DOCS-only / 鐎圭偟骞囨禒宥呬焊 | G25 |
| CLOSED | **G05** |

閹粯鏆熸禒?**26**閿涙备0 娴?14 閺?ID閿涘奔绲?G11閳ユ弸14/G26 閸欘垰鍨庡▔銏ょ崣閺€韬测偓瀛瑼RTIAL 闁偓閸戠儤娼禒韬测偓宥堫潌 ACCEPTANCE閵?

---

## 濡楀矂娼伴惄顔界垼缂佹挻鐎敍鍫熺爱閻浇鐦夐幑?@ 17471a6閿?

| 閸栧搫鐓?| 濡楀矂娼版禍瀣杽 | 閸忔娊鏁拠浣瑰祦 |
|------|----------|----------|
| 妞よ埖鐖?| 34px 閼挎粌宕熼弽蹇ョ幢**閺冪姵妗堟稊鍛紣閸忛攱鐖?* | `MainWindow::buildMenus()` |
| 閸ユ儳銇?| 濮ｅ繐娴?`ChartControlStrip`閿涙稒鐖ｇ粵鍙ョ瑢鐎佃壈鍩呴崚鍡欘瀲閿涙卜verflow 娣囨繄绱潏?| `ui/chart_control_strip.h` @ `f9f05bb` |
| 瀹革缚鏅?| 瀹搞儳鈻奸弽?~278px閿涙稑缍嬮崜宥勪繆閸欓鎻ｉ崙鎴濈潔缁€?| `c1f2cce` `project_tree_presentation.h` |
| 娑擃厼銇庢稉澶婃禈 | `graphSplitter`閿涙avigation / aux / main | `main_window.cpp` |
| 閸欏厖鏅堕弰鍓с仛閹芥顩?| `閸欏倽鈧?閳ヮ泦 / `閸斻劍鈧?閳?dB` | `updatePropertyContext` @ `696ce12` |
| 缁愬嫬鐢?| `NarrowbandWorkspace` + `pageChanged`閿涙稖顔曠純顔挎硶妞ゅ吀绻氶悾?| `a64117e` |
| 濡偓濞?| `DetectionCard` + 閺嶆垵鍞?`.engine` | `ui/detection/detection_card.h` |
| 鎼存洟鍎?| result/task/log | `bottomContent_` |

## Web 閻滄壆濮搁敍鍧刦b2e020` 閸欘亣顕伴敍娑樼杽閻?`17937bb`閿?

| 閸栧搫鐓?| Web 娴滃鐤?| 閸忔娊鏁拠浣瑰祦 |
|------|----------|----------|
| 妞よ埖鐖?| 閺冪姾褰嶉崡鏇熺埉閿涙矖SpectrumToolbar` 鐢悂鈹?| `App.tsx` |
| 娑擃厼銇?| `NavChrome`+`NavigationChart` + `AuxParamStrip`+raw-IQ `WaveformChart` + `VerticalSplitter`(82/205) + `SpecParamStrip`閿?*閺?aux閳攷ain 鐢悂鈹?SpectrumToolbar** | `App.tsx`閿涙矖NavChartHost`/`AuxChartHost`閿涙雹ot-C |
| 閸欏厖鏅?| 閸ユ盯銆夋竟绛圭幢Detect 缁墽鐣濋梻鎼佹， | `RightRail` / `DetectPage` |
| 鎼存洟鍎?| 缂傚搫銇?| `App.tsx` |
| 缁愬嫬鐢?| stub banner | `workspace-narrowband-stub` |
| 瀹搞儳鈻?IO | sample 閺?+ project-io SigMF API閿涘牊婀€瑰苯鍙忛幒銉у殠 UI閿?| `ProjectTree.tsx`閿涙矖packages/project-io` |
| 濡€崇€?| local-compute 閹稿洤鎮?rebuild `.engine` | `model_layout.py`閿涙雹ot-E 鐠囦焦宓?|

---

## 瀹割喛绐涘〒鍛礋閿涘牆顦查弽绋挎倵閿涘瞼濮搁幀浣稿灙閻╃顕?866e699閿?

閸ュ彞绶ラ敍姘紬闁插秴瀹?P0/P1/P2閵嗗倻濮搁幀?OPEN / PARTIAL / DOCS閵?

| ID | 缁鍩?| 瀹割喛绐?| 濡楀矂娼扮拠浣瑰祦 | Web 鐠囦焦宓?| 娑撱儵鍣告惔?| 閻樿埖鈧?| PASS 閹芥顩?|
|----|------|------|----------|----------|--------|------|-----------|
| G01 | 鐢啫鐪?| 妞よ埖鐖懣婊冨礋/閸涙垝鎶ら弽?| `buildMenus()` height 34閿涙稒鏋冩禒?缂傛牞绶?鐟欏棗娴?閸掑棙鐎?鐢喖濮?| `MenuBar.tsx` @`d8297d1`閿?4px + 閺傚洣娆?鐟欏棗娴?+ `menu-open-iq`閿涙稓宸辩紓鏍帆/閸掑棙鐎?鐢喖濮?| **P0** | **PARTIAL**閿涘潉62d3b70`/`e76ba97`閿涙艾鍙氱紒鍕綅閸楁洩绱眂orner/rename 娴犲秶宸遍敍澧?鐞涖儵缍堢€瑰本鏆ｉ懣婊冨礋閺嶆埊绱辨稉宥勭贩鐠?strip 娴ｆ粈璐熼崬顖欑 Open IQ |
| G02 | 鐢啫鐪?| 鐢悂鈹?Toolbar 閸欐牔鍞崶鎯с仈閿涙稓宸遍弽鍥╊劮閸掑棛顬?| `ChartControlStrip`+`f9f05bb` | `AuxParamStrip`/`SpecParamStrip`閿涙稒妫?aux閳攷ain 鐢悂鈹楅弶?@`17937bb` | **P0** | **PARTIAL**閿?*閸旂姳寮?*濞堝鏆€閿?| 閺冪姴鍙忕仦鈧敮鎼佲敆閺夆槄绱辩悰?caption+overflow 閻掞妇鍋ｉ敍鍧刦9f05bb`閿?|
| G03 | 鐢啫鐪?| 閸忋劌鐪弮鍫曟？鐎佃壈鍩呴敍鍫濆嚒瀹撳苯鍙?NavigationChart閿?| `navigationPlot` | `NavChrome`+`NavigationChart` @`17937bb` | **P0** | **PARTIAL** | 閻喎鐤勯弮鍫曟？缁?閹锋牜鐛?chrome閿涙稖藟濠婃俺鐤嗛弨鍦崶鐎?|
| G04 | 鐢啫鐪?| 鏉堝懎濮崶?Wave/PSD閿涘牊娣抽悽鐔告锤缁惧尅绱?| `auxPlot` | `auxWaveRawIq`/`sigmf_data_demo` IqRms @`17937bb` | **P0** | **PARTIAL** | Wave/PSD 閸掑洦宕查敍娌嘺ve=raw IQ 娴狅絿鐖滃鑼舵儰閸﹀府绱卞?QA 鐟欏棜顫?|
| G05 | 鐢啫鐪?| 閸ㄥ倻娲?splitter閿涘牓绮拋銈呭嚒鐎靛綊缍?82/205閿?| `graphSplitter` 82/205 | `VerticalSplitter` 姒涙顓?**82/205** @`17937bb` | **P0** | **CLOSED** | 閸欘垱瀚?閸欏苯鍤径宥勭秴閿涙盯绮拋銈咁嚠姒?82/205 |
| G06 | layout | narrowband multi-page (stub replaced) | NarrowbandWorkspace+a64117e | NarrowbandObserveCharts+narrowbandObserveDdc @ef2713a (observe DDC MET); shell @6c17a53; mod/DL/demod still shell | **P0** | **PARTIAL** | mod/DL/demod chrome; title workbench; channel-linked/interactive STFT; item not CLOSED |
| G07 | 鐢啫鐪?| 缂傚搫绨抽弽?| `bottomContent_` | 閺?| **P0** | OPEN | 娑撳鐖ｇ粵鎾呯幢~29/150 |
| G08 | 鐢啫鐪?| 閺嶅繐顔旀稉宥勭閼?| 278/390 | 220/280 | **P1** | OPEN | 瀹割洡278 閸欑390閿涙稒鏁圭挧绌?8 |
| G09 | 鐢啫鐪?| 缂傝桨瀵岄崶鎯х俺閺?| UI-28 | MISSING | **P1** | OPEN | 濞撳憡鐖?閼煎啫娲?閸╄桨绨弽鍥唶閸掓稑缂撻柅姘朵壕 |
| G10 | 鐢啫鐪?| 缂傜儤娓舵径褍瀵?Esc 娴兼ê鍘涚痪?| UI-08 | MISSING | **P1** | OPEN | 閺堚偓婢堆冨閿涙宝sc 閸忓牆褰囧☉鍫濆灡瀵?|
| G11 | 娴溿倓绨?| 濡楀棝鈧鏂佹径?鏉炴挳娈х粋?鐎佃壈鍩呮穱婵婃硶鎼?| UI-13..15 | desktop-axis+box 闁劌鍨?| **P0** | **PARTIAL** | navigate 濡楀棝鈧鏂佹径褝绱辨潪瀛樼泊鏉烆噣娈х粋浼欑幢鐎佃壈鍩呴崡鏇炲毊娣?span |
| G12 | 娴溿倓绨?| 閸欐娊鏁懣婊冨礋娑撳秴鐣弫?| UI-16/23/33 | 缁犫偓閺?context menu | **P0** | **PARTIAL** | 閹镐胶鐢婚崚娑樼紦/閸樺棗褰?fit/reset/闁插秴褰旈崚妤勩€?|
| G13 | 娴溿倓绨?| 閺嶅洩顔囬幒褍鍩楅悙?婢舵岸鈧绗夌搾?| AnnotationPanel | box閳妺ddManualMark | **P0** | **PARTIAL** | 閹貉冨煑閻愮櫢绱盋trl/Shift 婢舵岸鈧绱遍崚妤勩€冩稉鈧懛?|
| G14 | 娴溿倓绨?| 濡偓濞?ROI 閺堫亜鍨庨崥宥団€樼拋銈嗘蒋 | `detectionRoiTool_` | select閳壊OI+Enter | **P0** | **PARTIAL** | 閻欘剛鐝涢崗銉ュ經+绾喛顓婚弶鈽呯幢Enter/Esc |
| G15 | 娴溿倓绨?| 閺冪姾顫嬮崶鎯у坊閸?| UI-17/18 | MISSING | **P1** | **PARTIAL**閿涘潉360aba7` viewHistory閿?| back/forward閿涙稈澧?0 |
| G16 | 娴溿倓绨?| 濡€崇础鏉炵顫夐崚?| UI-09/10 | aux placeholder | **P1** | OPEN | Wave/PSD/STFT/Waterfall 鏉炲瓨顒滅涵?|
| G17 | 閸旂喕鍏?| DetectPage 閳?DetectionCard | `detection_card.h` | 缁墽鐣濋梻鎼佹， | **P0** | OPEN | 鐎涙顔岀痪褍顕粵澶涚幢娴?`.engine` |
| G18 | 閸旂喕鍏?| 閺勫墽銇?闁岸浜鹃崡鐘辩秴閿涙稒鎲崇憰浣筋嚔娑?| `696ce12` 閸欏倽鈧?閸斻劍鈧?| 閸楃姳缍呴弬鍥攳 | **P1** | OPEN閿?*閸旂姳寮?*閿?| 閺勫墽銇氭い闈涳綖鐎圭儑绱遍幗妯款洣閸氼偁鈧苯寮懓鍐︹偓宥冣偓灞藉З閹降鈧?|
| G19 | 閸旂喕鍏?| 瀹搞儳鈻奸弽鎴炴惙娴?| `showAddFileDialog`+`c1f2cce` | API PARTIAL / UI sample | **P1** | **PARTIAL** | 濞ｈ濮?IQ閿涙稑鐣炬担宥忕幢闁插秴鎳￠崥?閸掔娀娅?|
| G20 | 閸旂喕鍏?| Open IQ 閸忋儱褰?| `SignalImportDialog` | 瀹搞儱鍙块弽?鐎电厧鍙嗗ù?| **P1** | **PARTIAL** | 閼挎粌宕熼崗銉ュ經+閸忓啯鏆熼幑顕€顣╃憴鍫幢姒涙顓?demo |
| G21 | 鐟欏棜顫?| 閼瑰弶婢?鐎涙褰?| BrandV2 | `#0f1419` | **P2** | OPEN | hex/12px/Consolas |
| G22 | 鐟欏棜顫?| 閸ユ儳鍞存潏纭呯獩 | 88/22/12/34 | 閼奉亝婀?| **P2** | OPEN | inset鍗?閿涙稖澹婇梼璺哄礁70 |
| G23 | 鐟欏棜顫?| 閸濅胶澧?lockup | brand corner | 閺?| **P2** | OPEN | 妞よ埖鐖?BrandV2閿涙稓閮寸紒鐔哥埉 N/A |
| G24 | 娴溿倓绨?| 閻╃顕崑蹇曅?閸楁洑缍?-0 | UI-32 | 闁劌鍨?| **P2** | OPEN | 閺?-0閿涙稑褰查崚鍥ㄥ床閸楁洑缍?|
| G25 | 閸旂喕鍏?| 閻樿埖鈧焦鐖拠顓濈疅 | 25px 鐏忚京鍗?閹绘劗銇?| dsp/fft 閹搞倕宕伴敍姹篈 瀹歌尪顔?| **P2** | DOCS | 鐏忚京鍗?t/f+閺傚洣娆㈡稉杞板瘜 |
| G26 | 缁撅附娼?| IQ/engine 闂傘劎顩?| CAO | demo-iq-paths + TRT 鏉╂垿妫撮崥?| **P0** | **PARTIAL** | 娴?demo IQ + 閺嶆垵鍞?`.engine` 閸欘垶鈧?|

---

## 瀵ら缚顔呮穱顔碱槻閸掑棙灏濋敍鍫熸纯閺傚府绱?

### Wave P0
G01+G02閿涘牆鎯?strip 閺嶅洨顒烽崚鍡欘瀲閿涘鍟?G03閳ユ弸05 閳?G17 閳?G07 閳?G06 PARTIAL 閺€璺哄經閿涘牏婀￠崶?閸ユ盯銆?chrome閿涘鍟?鐞涖儵缍?G11閳ユ弸14 PARTIAL 闁偓閸?閳?**G26 濞?`.pth` 閸欘垶鈧銆?*閵?

### Wave P1
G10/G15/G09/G19閳ユ弸20 閹恒儳鍤?/ **G18 閸欏倽鈧厽宄板З閹?* / G08/G16閵?

### Wave P2
G21閳ユ弸25閵?

---

## Acceptance Constraints閿涘牆宸遍崚璁圭礆

1. **IQ**閿涙矮绮?`D:\project\signal_studio_rebuild\resources\sigmf_data_demo\`閿涘潉0000000.sigmf-data` / `.sigmf-meta` / `.json`閿涘鈧?
2. **濡€崇€?*閿涙矮绮?rebuild 閺嶆垵鍞?TensorRT `*.engine`閿涘牅绶ラ敍姝歰ut\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\`閵嗕梗...\scn-max-psd-v1\`閿涘鈧繖.pth` / 閺嶆垵顦?`.onnx` 娑撳秴绶辩拋鈥冲弳 PASS閵?
3. **娑撳﹥鐖堕柨姘卞仯**閿涙艾濮涢懗钘夘嚠缁涘浜?**`17471a6`** 娑撳搫鍣敍鍫濆絿娴狅絼绮?`0f108d0`閿涘鈧?

## 閹搭亜娴樼捄顖氱窞閿涘牆鍙℃禍顐ｇ埐閸欘亣顕伴敍?

`D:\project\web_signal_studio\artifacts\validation\ui-parity\baseline\`

## 缂佹捁顔?

濡楀矂娼版禒?**`17471a6`**閵嗕繅eb tip **`ef2713a`** = G06 鐟欏倸鐧傛い?DDC閿涘潉a145d21`閿? 閺冦垺婀佹竟?G01閿?*G01 PARTIAL**閿?*G06 娣囨繃瀵?PARTIAL閿涘湒DC 鐎涙劙銆?MET閿?*閿涙狈PEN 10 / PARTIAL 12 / DOCS 1 / CLOSED 1=G05閿?*閺冪姷鐓╅梼?PASS**閵嗗倽顕涚憴?`INCREMENTAL_ef2713a.md`閵?
0d68e9/NarrowbandWorkspace.tsx閿涘鈧倻娴夌€?INCREMENTAL_fb2e020閿?*G06 OPEN閳墾ARTIAL**閿涘澃tub 瀹稿弶娴涢幑顫幢閻?DDC 閸ュ彞绗岄崶娑€?chrome 閺?CLOSED閿涘绱監PEN 11 / PARTIAL 11 / DOCS 1 / CLOSED 1=G05閵?*閺冪姷鐓╅梼?PASS**閵嗗倽顕涚憴?INCREMENTAL_d8297d1.md閵?

> Bot-A 2026-10-21 21:55 Asia/Shanghai Web tip **ef2713a**: observe-page DDC criterion MET; **G06 stays PARTIAL**; G01 unchanged PARTIAL; OPEN 10 / PARTIAL 12 / DOCS 1 / CLOSED 1; see INCREMENTAL_ef2713a.md.


> Bot-A 2026-10-21 22:08 Asia/Shanghai Web tip **3d7ab59**: G01 no regression; G02/G11鈥揋15 deepened PARTIAL; G14 near-exit not CLOSED; OPEN 9 / PARTIAL 13 / DOCS 1 / CLOSED 1; **no PASS**. See INCREMENTAL_3d7ab59.md.


> Evidence pack tip **2d12522** (qa/web-3d7ab59); screenshots never alone CLOSE; audit subject remains **3d7ab59**; no PASS.
