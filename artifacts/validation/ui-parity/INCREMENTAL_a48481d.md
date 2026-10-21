# INCREMENTAL_a48481d — B wave9 G19 + C G11 file-fullRange + G18 margin/scrubber (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:40 Asia/Shanghai |
| Web tip (audit subject) | **`a48481d`** = merge C `7bfc86c` on B wave9 tip `787623d` |
| Desktop | **`17471a6`** (`rebuild/a143-native`; MarkEdit fullRange clamp; HeatmapCanvas HEATMAP_PLOT_MARGIN; LinkedCursor framePsd; AnnotationPanel review bar) |
| Prior Bot-A | `INCREMENTAL_f9a56b8.md` @ `6dea43f`; draft `INCREMENTAL_787623d.md` @ `54c9b6d` (superseded by this tip) |
| Scope | **G19** interactive AnnotationPanel; **G11** file-fullRange clamp; **G18** margin-map + dwell scrubber |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `a48481d46262ac8cc8b830dc172928cc36c18cf5` | `origin/main` tip = audit subject |
| `7bfc86caebf6b7572c2c29869ce2c137738bf5c9` | Bot-C: G11 file-fullRange + G18 margin-map/scrubber |
| `daa1125e87b6a743c21f92d9fd9c4fe4ec8287c4` | Bot-B wave9: G19 interactive AnnotationPanel + G02/G08 |
| `787623dafd2019846f478d922d7b2070f0db2416` | B wave9 merge (ancestor) |
| `54c9b6de3eb368980be63fde99ce5bca3ccf136c` | Draft Bot-A INCREMENTAL_787623d (covered here) |
| `6dea43fe7dd745f86fdc0cf0abf38287f0d0085c` | Prior Bot-A INCREMENTAL_f9a56b8 |
| `17471a6` | Desktop tip (unchanged; cited from prior audits / Bot-B/C notes) |

**ID map:** G19/G02/G08 = B `daa1125`; G11 file-fullRange + G18 margin/scrubber = C `7bfc86c`; tip `a48481d`. **Supersedes** planned/draft INCREMENTAL_787623d.

## Diff vs prior (`f9a56b8` → `a48481d`)

1. **B G19 interactive AnnotationPanel (`daa1125` / `787623d`):** BottomPanel + M06MarksPanel Qt-ish **review bar**: 定位当前标记 (`setSelection` + `scrollIntoView`), 删除所选 (`removeMark`), 编辑 (`beginEditMark` / replaceMark), segment 上一/下一 (`replaceMark` `activeSegmentId`). Edit: 应用+保存 / 取消 / Esc. Row double-click → beginEdit. Stamps `data-qt-interactive="wave9"`. Prior wave8 headers/range + wave7 edit-path retained. Residual: **Qt editCell** inline; Evidence/export CSV. B right-rail scrubber twin may land later (CAO) — **not CLOSED**.
2. **C G11 file-fullRange clamp (`7bfc86c`):** `clampMarkRangeToFull` + Overlay body **and** edge Move clamp to `fullTime`/`fullFreq` from MainChartHost (`timeSec`/`freqHz`), not view-only domains. Stamp `data-g11-file-fullrange-clamp="true"`. Overlay backticks still **10**. Unit test clamps out-of-file range. Residual: non-current-vs-unselected polish beyond PointingHand — **not CLOSED**.
3. **C G18 margin-map + dwell scrubber (`7bfc86c`):** `frameIndexFromPlotX` / `plotXFromFrameIndex` via `PLOT_MARGIN` (= `HEATMAP_PLOT_MARGIN`); STFT click ignores axis margin; `nb-stft-dwell-scrubber` drag marker sets pin + frame mode. Stamps `data-g18-margin-map` / `data-g18-dwell-scrubber`. Residual: right-rail scrubber twin (B later); multi-chart linked-cursor sync polish — **not CLOSED**.
4. **B G02/G08 skim (`daa1125`):** Strip wave9 palette-unit/mode-caption; shell resize focus (`data-shell-focus="wave9"`). Light only — **not CLOSED**.

Bot notes: `bot-b/BOT_B_WAVE9_G19_G02_G08.md`; `bot-c/STATUS.md` (`matrix_pass_claimed: false`). E2E wave9 chrome attrs only (not CLOSE evidence).

## Verdict summary

| ID | Prior (`f9a56b8`) | Now (`a48481d`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (headers/range done; interactive residual) | **PARTIAL (deepened)** | review bar locate/delete/edit/segment + apply/cancel + dblclick **MET**; editCell/export residual — **not CLOSED** |
| **G11** | PARTIAL (view-bounds + PointingHand done; file-fullRange residual) | **PARTIAL (deepened)** | file-fullRange body+edge clamp **MET**; unselected polish residual — **not CLOSED** |
| **G18** | PARTIAL (STFT+rail pin chrome done; margin-map/scrubber residual) | **PARTIAL (deepened)** | margin-map + STFT dwell scrubber **MET**; right-rail scrubber twin / multi-chart sync residual — **not CLOSED** |
| **G02** | PARTIAL | **PARTIAL (deepened, light)** | wave9 strip QLabels **MET** — **not CLOSED** |
| **G08** | PARTIAL | **PARTIAL (deepened, light)** | wave9 resize focus **MET** — **not CLOSED** |
| G07 / G17 / G06 | prior PARTIAL | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — interactive AnnotationPanel — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior wave8 headers + range inspector | MET (retained) | `9e175d4` |
| Review bar locate/delete/edit/segment | **MET** | BottomPanel + M06 review bars; `setSelection` / `removeMark` / `replaceMark`; `daa1125` |
| Apply+保存 / 取消 / dblclick edit | **MET** | `applyEditMark` / `cancelEditMark`; row `onDoubleClick` |
| Qt editCell / evidence-export | residual | Bot-B deferred |

### G11 — file-fullRange clamp — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior view-bounds + PointingHand / ClosedHand | MET (retained) | `e688975` / `612c8a1` / Overlay backticks=10 |
| File-fullRange body + edge clamp | **MET** | `clampMarkRangeToFull`; Overlay uses `fullTime`/`fullFreq` from MainChartHost; `data-g11-file-fullrange-clamp`; tests |
| Non-current unselected polish | residual | Bot-C deferred |

### G18 — margin-map + dwell scrubber — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior UI→store→DDC + STFT/rail pin | MET (retained) | prior tips |
| Plot-margin frame map (ignore axis clicks) | **MET** | `frameIndexFromPlotX` + `PLOT_MARGIN`; `data-g18-margin-map`; tests |
| STFT dwell scrubber drag | **MET** | `nb-stft-dwell-scrubber`; pin + frame mode |
| Right-rail scrubber twin / multi-chart sync | residual | B later / B+C polish |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition BLOCKED; interactive STFT
3. **G19 residual** — Qt **editCell** + evidence/export (review bar **done** @ wave9)
4. **G11 residual** — non-current unselected polish (file-fullRange **done**)
5. **G18 residual** — right-rail scrubber twin (B later) / multi-chart linked-cursor sync (margin-map+STFT scrubber **done**)
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps
7. **G02 residual** — remaining strip nuances (wave9 palette/mode **done**)
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)* (wave9 focus **done**)

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19/G11/G18 remain PARTIAL (deepened), not CLOSED. No bucket flips.  
**Supersedes** draft `INCREMENTAL_787623d.md` (same G19 evidence folded in).