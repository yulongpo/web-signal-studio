# INCREMENTAL_6ada5b0 — B wave13 G19 AdaptiveValueEdit/Evidence/browserSave (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:57 Asia/Shanghai |
| Web tip (audit subject) | **`6ada5b0`** = merge G `03381ce` on B `ad4b617` + A `0c27fe9` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; AnnotationPanel AdaptiveValueEdit fields + AnnotationEvidenceWidget + QFileDialog::getSaveFileName) |
| Prior Bot-A | `INCREMENTAL_6df15bc.md` @ `0c27fe9` |
| Scope | **G19** AdaptiveValueEdit-in-cell / Evidence / browserSaveFile (prior TOP residual); G06/G17 honesty check |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `6ada5b078adb7c656776a9835fe393fa09645139` | `origin/main` tip = audit subject |
| `ad4b617cc8cb13682326b807dc754f289b46d9ef` | Bot-B wave13: G19 AdaptiveValueEdit-in-cell + Evidence + browserSaveFile |
| `03381ce` | Bot-G evidence-only web-6df15bc (wave12 pin + G11 polish; **no wave13 G19 PNG**) |
| `0c27fe9` | Prior Bot-A INCREMENTAL_6df15bc |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G19 Adaptive/Evidence/save = B `ad4b617`; G pack = `03381ce` (prior tip only). Tip `6ada5b0`.

## Diff vs prior (`6df15bc` → `6ada5b0`)

1. **B G19 AdaptiveValueEdit-in-cell (`ad4b617`):** Table cols **4/5 Time** + **6/7 Frequency** now mount shared `AdaptiveValueEdit` (unit parse/format, Enter/Tab commit, Esc discard) → `applyCellNumeric` → `session.replaceMark`. Stamps `data-qt-adaptive-cell="wave13"` / `data-adaptive-cell="wave13"`. Col 1 name stays plain text editCell (wave11). Matches desktop `AdaptiveValueEdit` Enter/Esc + Tab-focusOut commit (`ui/controls/adaptive_value_edit.cpp` ~147–162) and AnnotationPanel numeric field commit path — **not CLOSED** (desktop also has richer range-inspector AdaptiveValueEdit begin/end/low/high + more editable columns / policies).
2. **B G19 Evidence (`ad4b617`):** New `AnnotationEvidencePanel` reads real `originEvidence` only (method / timeBasis / uncertainty / frequencyBasis / mean / max / class / origin); honest `—` / empty when missing; raw JSON `<details>` only if keys exist. Mounted beside annotation table (`data-qt-evidence="wave13"`). Matches desktop fact labels in `annotation_evidence_widget.cpp` buildFacts (~462–482: 原始精修 / 时间依据 / 不确定度 / 频率依据 / mean / max / 原始类别 / originRef). Residual: full Qt **Auxiliary 3-col** layout + extra facts (CurrentRange / OriginalRange / Observation / Windows / Noise / Reason / Format / Coordinates / time-vs-score panels) — **not CLOSED**. Never invents scores.
3. **B G19 browserSaveFile (`ad4b617`):** `browserSaveFile.ts` prefers `showSaveFilePicker`, falls back to download anchor; JSON/CSV export wired through it (`data-browser-save="wave13"`). Honest substitute for desktop `QFileDialog::getSaveFileName` in `AnnotationPanel::exportFile` (~1661). Residual: **native OS dialog chrome** (browser APIs only by design) — **not CLOSED**.
4. **G `03381ce`:** Evidence pack for prior tip `6df15bc` only (pin z-index + G11 polish). **No wave13 Adaptive/Evidence/save screenshots.** Code audit stands; PNG alone never CLOSE.
5. **G06 / G17:** Unchanged. Narrowband still stamps `data-nb-bitstream=BLOCKED` / `data-nb-eye-status=BLOCKED` / `NARROWBAND_RECOGNITION_BLOCKED`; **no invented** eye/bitstream/recognition paths — stay honest **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE13_G19_ADAPTIVE_EVIDENCE_SAVE.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`6df15bc`) | Now (`6ada5b0`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (AdaptiveValueEdit/Evidence/QFileDialog residual) | **PARTIAL (deepened)** | Adaptive-in-cell + Evidence + browserSave **MET** (`ad4b617`); Auxiliary 3-col / native dialog chrome residual — **not CLOSED** |
| G11 / G18 / G02 / G08 / G07 | prior PARTIAL | **unchanged** | no status flip |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — AdaptiveValueEdit / Evidence / browserSave — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior wave11 editCell cols 1/4/5/6/7 + JSON/CSV | MET (retained) | `797a5f1` / INCREMENTAL_4c28588 |
| AdaptiveValueEdit-in-cell cols 4–7 | **MET** | `BottomPanel` + `AdaptiveValueEdit`; `data-qt-adaptive-cell="wave13"`; desktop Enter/Tab/Esc |
| AnnotationEvidencePanel (honest originEvidence) | **MET** | `AnnotationEvidencePanel.tsx`; 8 core facts; desktop buildFacts labels |
| browserSaveFile vs QFileDialog | **MET (browser-honest)** | `showSaveFilePicker` → download fallback; `data-browser-save="wave13"` |
| Full Qt Auxiliary 3-col + extra facts | residual | desktop `buildAuxiliary` / CurrentRange / Noise / Format / … |
| Native OS save-dialog chrome | residual | browser APIs only; Bot-B deferred |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — Evidence Auxiliary 3-col / extra facts + native dialog chrome (Adaptive-in-cell + Evidence shell + browserSave **done** @ wave13)
4. **G11 residual** — per-sourceKind colors + table hover sync (polish **done** @ `58df6bf`)
5. **G18 residual** — multi-chart linked-cursor sync (pin stack **done** @ wave12)
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps
7. **G02 residual** — remaining strip nuances
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 remains PARTIAL (deepened), not CLOSED. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.