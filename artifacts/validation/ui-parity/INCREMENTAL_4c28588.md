# INCREMENTAL_4c28588 — B wave11 G19 editCell/export + G evidence (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:47 Asia/Shanghai |
| Web tip (audit subject) | **`4c28588`** = merge G `9e4a79c` on B wave11 `797a5f1` (+ wave10 `fa60055`) |
| Desktop | **`17471a6`** (`rebuild` AnnotationPanel `editCell` / `exportFile` + QFileDialog JSON/CSV) |
| Prior Bot-A | `INCREMENTAL_a48481d.md` @ `7c0b989` |
| Scope | **G19** editCell/export (prior TOP residual); light G02/G08/G18 skim |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |
| Early-audit note | **Yes** — CAO allowed short audit of `4c28588` before next C/B tip; retarget if parent advances tip |

## Verified SHAs

| SHA | Role |
|-----|------|
| `4c2858896e706a7d42f88b2c8bab52c44d8d1fd9` | `origin/main` tip = audit subject |
| `797a5f15d7859520a3f9ca587521ec19c1ba9c6d` | Bot-B wave11: G19 editCell/export + G02/G08 deepen |
| `9e4a79c` | Bot-G evidence pack web-56233d2 (wave10 rail scrubber + wave9 fold; **no wave11 editCell PNG**) |
| `fa60055` | Bot-B wave10 right-rail dwell scrubber (ancestor) |
| `7c0b989` | Prior Bot-A INCREMENTAL_a48481d |
| `a48481d` | Prior audited tip |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G19 editCell/export = B `797a5f1`; G pack = `9e4a79c` (wave9/10 only). Tip `4c28588`.

## Diff vs prior (`a48481d` → `4c28588`)

1. **B G19 editCell (`797a5f1`):** `BottomPanel` inline cell edit for Qt-editable cols **1 名称 / 4 起始ms / 5 结束ms / 6 中心MHz / 7 带宽kHz**. Double-click → draft input; Enter/blur → `finishCellEdit` → `session.replaceMark`; Esc cancel. Stamp `data-qt-editcell="wave11"` + `data-editable-col`. Matches desktop `AnnotationPanel::editCell` + `ItemIsEditable` path (`annotation_panel.cpp` ~990) at chrome/behavior level — **not CLOSED** (no AdaptiveValueEdit-in-cell; not all Qt editable cols mirrored).
2. **B G19 export (`797a5f1`):** JSON via real `hook.exportJson()` → browser download `annotations.json` (`bottom-btn-export-json`); CSV from **live filtered table rows** (honest matrix, not fabricated) → `annotations.csv` (`bottom-btn-export-csv`). Desktop: `exportFile(false/true)` + **QFileDialog::getSaveFileName**. Residual: **QFileDialog parity** (browser download ≠ native save dialog); Evidence widget still absent — **not CLOSED**.
3. **B G02/G08 skim:** `data-strip-wave="wave11"` overflow QLabel grid/ref-unit; shell `data-shell-wave="wave9 wave11"` / bottom resize `data-shell-wave="wave11"`. Light only — **not CLOSED**.
4. **B G18 light:** RightRail scrubber `data-rail-scrubber-wave="wave11"` + max bound when chart frame-count known. Chart scrubber remains C — **not CLOSED**.
5. **G evidence `9e4a79c`:** Captures wave10 rail scrubber + wave9 review-bar fold; **no new wave11 editCell/export screenshots**. Code audit stands; PNG alone never CLOSE.

Bot notes: `bot-b/BOT_B_WAVE11_G19_EDITCELL_G02_G08.md` (`matrix_pass_claimed: false`). G: `qa/web-56233d2/` (`ui_parity_pass_claimed: false`).

## Verdict summary

| ID | Prior (`a48481d`) | Now (`4c28588`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (review bar done; editCell/export residual) | **PARTIAL (deepened)** | editCell cols 1/4/5/6/7 + JSON/CSV export **MET**; AdaptiveValueEdit-in-cell / Evidence / QFileDialog residual — **not CLOSED** |
| **G02** | PARTIAL | **PARTIAL (deepened, light)** | wave11 overflow QLabel stamps **MET** — **not CLOSED** |
| **G08** | PARTIAL | **PARTIAL (deepened, light)** | wave11 shell-wave stamps **MET** — **not CLOSED** |
| **G18** | PARTIAL | **PARTIAL (deepened, light)** | rail scrubber max/wave11 stamp **MET**; multi-chart sync residual — **not CLOSED** |
| G11 / G07 / G17 / G06 | prior PARTIAL | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — editCell / export — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior wave9 review bar locate/delete/edit/segment | MET (retained) | `daa1125` / INCREMENTAL_a48481d |
| Inline editCell cols 1/4/5/6/7 | **MET** | `BottomPanel` `cellEdit` / `beginCellEdit` / `finishCellEdit` → `replaceMark`; `data-qt-editcell="wave11"`; B `797a5f1` |
| Export JSON via exportJson | **MET** | `exportAnnotationsJson` + `bottom-btn-export-json` |
| Export CSV live rows | **MET** | `exportAnnotationsCsv` from `liveFiltered`; `bottom-btn-export-csv` |
| Desktop QFileDialog save path | residual | Web = browser download only |
| Annotation Evidence widget / full AdaptiveValueEdit-in-cell | residual | Bot-B deferred; desktop `annotation_evidence_widget` |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition BLOCKED; interactive STFT
3. **G19 residual** — AdaptiveValueEdit-in-cell / Evidence widget / QFileDialog (editCell+export **done** @ wave11)
4. **G11 residual** — non-current unselected polish
5. **G18 residual** — multi-chart linked-cursor sync (rail scrubber twin largely done)
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps
7. **G02 residual** — remaining strip nuances (wave11 overflow **done**)
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 remains PARTIAL (deepened), not CLOSED. No bucket flips.  
**Early-audit:** tip `4c28588` audited before optional next C/B tip; parent may retarget.