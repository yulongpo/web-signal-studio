# INCREMENTAL_787623d — short B wave9 G19 interactive AnnotationPanel (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:38 Asia/Shanghai |
| Web tip (audit subject) | **`787623d`** = merge B `daa1125` wave9 G19 interactive + G02/G08 |
| Desktop | **`17471a6`** (`rebuild/a143-native`; AnnotationPanel review bar / editCell / locate / delete / segment) |
| Prior Bot-A | `INCREMENTAL_f9a56b8.md` @ `6dea43f` / tip `f9a56b8` |
| Scope | **G19** interactive AnnotationPanel review bar (focus); skim **G02/G08** wave9 |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `787623dafd2019846f478d922d7b2070f0db2416` | `origin/main` tip = audit subject (merge B wave9) |
| `daa1125e87b6a743c21f92d9fd9c4fe4ec8287c4` | Bot-B wave9: G19 interactive AnnotationPanel + G02/G08 deepen |
| `6dea43fe7dd745f86fdc0cf0abf38287f0d0085c` | Prior Bot-A INCREMENTAL_f9a56b8 |
| `17471a6` | Desktop tip (unchanged; cited from prior audits / Bot-B notes) |

**ID map:** G19/G02/G08 = B `daa1125`; merge `787623d`. G11/G18/G07/G17/G06 unchanged this tip.

## Diff vs prior (`f9a56b8` → `787623d`)

1. **B G19 interactive AnnotationPanel (`daa1125`):** BottomPanel + M06MarksPanel gain Qt-ish **review bar**: 定位当前标记 (`setSelection` + `scrollIntoView`), 删除所选标记 (`removeMark`), 编辑 (`beginEditMark` / replaceMark path), 上一页/下一页 **segment** nav (`replaceMark` `activeSegmentId`). Edit form: 应用 + 保存 (`applyEditMark`/`commitEditMark`) + 取消 (`cancelEditMark`); Esc → cancel. Row **double-click** → `beginEditMark`. Stamps `data-qt-interactive="wave9"` on panels + review bars. Prior wave8 Qt headers / range inspector + wave7 edit-path empty/single/multi retained. Residual (Bot-B deferred): **inline cell edit (Qt editCell)**; Evidence widget / export CSV — **not CLOSED**.
2. **B G02 skim (`daa1125`):** Main strip `data-strip-nuance="wave9"`; overflow QLabels 色板单位 / 主图模式; aux nuance stamp. Light deepen only — **not CLOSED**.
3. **B G08 skim (`daa1125`):** Left/right/bottom resize `tabIndex={0}` + `data-shell-focus="wave9"` + focus outline CSS; App `data-shell-wave="wave9"`. Light deepen only — **not CLOSED**.

Bot notes: `artifacts/validation/ui-parity/bot-b/BOT_B_WAVE9_G19_G02_G08.md` (`matrix_pass_claimed: false`). E2E `g19-interactive-g02-g08-wave9.spec.ts` (chrome attrs only; env may limit; not CLOSE evidence).

## Verdict summary

| ID | Prior (`f9a56b8`) | Now (`787623d`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (headers/range inspector done; full interactive residual) | **PARTIAL (deepened)** | review bar locate/delete/edit/segment + apply/cancel + dblclick **MET**; editCell / evidence-export residual — **not CLOSED** |
| **G02** | PARTIAL (wave8 units/spacing done) | **PARTIAL (deepened, light)** | palette-unit / mode-caption QLabels **MET**; further strip residual — **not CLOSED** |
| **G08** | PARTIAL (wave8 shell-reshot done) | **PARTIAL (deepened, light)** | resize focus parity **MET**; full desktop re-shot residual — **not CLOSED** |
| G11 / G18 / G07 / G17 / G06 | prior PARTIAL | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — interactive AnnotationPanel review bar — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior wave8 Qt headers + range inspector | MET (retained) | `9e175d4` / INCREMENTAL_f9a56b8 |
| Prior wave7 edit-path empty/single/multi | MET (retained) | `5a0b035` |
| Review bar: locate / delete / edit / segment prev·next | **MET** | BottomPanel `bottom-annotation-review-bar`; M06 `m06-annotation-review-bar`; `setSelection` / `removeMark` / `replaceMark(activeSegmentId)`; `daa1125` |
| Apply + 保存 / 取消 + Esc cancel | **MET** | `applyEditMark` / `cancelEditMark`; `bottom-edit-apply` + commit |
| Row double-click → beginEdit | **MET** | BottomPanel row `onDoubleClick` → `beginEditMark` |
| `data-qt-interactive="wave9"` stamps | **MET** | BottomPanel + M06 panels + review bars |
| Inline cell edit (Qt editCell) | residual | Bot-B deferred |
| Evidence widget / export CSV | residual | Bot-B deferred |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition BLOCKED; interactive STFT
3. **G19 residual** — Qt **editCell** inline + evidence/export (review bar interactive **done** @ wave9)
4. **G11 residual** — file-fullRange clamp / non-current polish
5. **G18 residual** — plot-margin pin map / linked-cursor scrubber
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps slots
7. **G02 residual** — remaining SpectrumToolbar/strip nuances (wave9 palette/mode **done**)
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)* (wave9 focus **done**)

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 remains PARTIAL (deepened), not CLOSED. No bucket flips.