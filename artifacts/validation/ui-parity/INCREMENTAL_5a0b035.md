# INCREMENTAL_5a0b035 — short B wave7 G19/G07/G02/G08 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:20 Asia/Shanghai |
| Web tip (audit subject) | **`5a0b035`** = Bot-B wave7 on `e14612c` (post INCREMENTAL_2d9e83b merge) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; AnnotationPanel edit; Detect Worker caps; strip QLabels; shell edge hit) |
| Prior Bot-A | `INCREMENTAL_2d9e83b.md` @ `195f2ec` / tip `2d9e83b` |
| Scope | **G19** edit-path empty evidence; **G07** real-caps engine slots; **G02** strip physical/Level/Display/STFT N; **G08** shell edge hit targets |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `5a0b035af8d448356ef66152e235c0ab9cb118fd` | `origin/main` tip = audit subject (B wave7) |
| `e14612c29d8ff08ec9eae6495c2b2c63a0271339` | Prior main (merge INCREMENTAL_2d9e83b) |
| `195f2ec8adc738d6c9fa31b2e6099bfbddf1af52` | Prior Bot-A INCREMENTAL_2d9e83b |
| `2d9e83b075ff3eb29f580be7418c89793c4bc482` | Prior content tip (G11 Overlay + G18 UI→store→DDC) |
| `85dab158509ac3de94584b7f6cfd7f2aa9c352df` | Bot-B wave6 (inline edit / Overlay restore) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G19/G07/G02/G08 = Bot-B wave7 `5a0b035`.

## Diff vs prior (`2d9e83b` → `5a0b035`)

1. **B G19 edit-path evidence (`5a0b035`):** BottomPanel + M06 stamp `data-edit-path="replaceMark"` + `data-edit-selection` empty|single|multi; empty-state hints (`bottom-edit-empty-hint` / `m06-edit-empty-hint`); edit remains `disabled` unless single selection. Prior wave6 inline `replaceMark` retained. Residual: full desktop AnnotationPanel interactive re-shot beyond attr chrome — **not CLOSED**.
2. **B G07 multi-engine slots from real caps (`5a0b035`):** `uiStore.detectCapabilities` + `setDetectCapabilities` mirrored from DetectPage `getCapabilities` (null on failure); BottomPanel `bottom-detect-engine-slots` with `data-multi-engine="local-compute-caps"`, FFSCN/SCN available|unavailable, models present/missing, honesty banner “No invented…”. Prior `detectRunFeed` retained. Residual: full Qt Detect Worker / engines beyond LocalCompute snapshot — **not CLOSED** (honest: no invented engines).
3. **B G02 strip deepen (`5a0b035`):** Spec `chart-strip-caption-physical` (“物理坐标”); Aux QLabels 电平/显示 (`chart-strip-qlabel-level-btn` / `display-btn`); overflow live STFT N (`overflow-qlabel-stft-n`). Prior mode/workspace/overflow/aux chrome retained. Residual: remaining strip/SpectrumToolbar nuances — **not CLOSED**.
4. **B G08 shell edge hit (`5a0b035`):** `data-shell-edge` left/right/bottom + `data-hit-min-px` 8/8/29; CSS `::after` widened hit targets on `.shell-col-resize` / `.bottom-panel-resize`; `data-collapse-min` on bottom resize. Prior collapse-to-min + width persist retained. Residual: full desktop shell re-shot / remaining edge polish — **not CLOSED**.

Bot-B note: `artifacts/validation/ui-parity/bot-b/BOT_B_WAVE7_G19_G07_G02_G08.md` (`matrix_pass_claimed: false`). E2E probe: `apps/web/e2e/g19-g07-g02-g08-wave7.spec.ts` (env may limit runtime; not treated as CLOSE evidence).

## Verdict summary

| ID | Prior (`2d9e83b`) | Now (`5a0b035`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (deepened, light wave6) | **PARTIAL (deepened)** | empty/single/multi edit-path attrs + empty hints **MET**; full AnnotationPanel re-shot residual — **not CLOSED** |
| **G07** | PARTIAL (deepened, light wave6) | **PARTIAL (deepened)** | real LocalCompute caps → FFSCN/SCN/model slots + honesty **MET**; full Qt Worker residual — **not CLOSED** |
| **G02** | PARTIAL (deepened, light wave6) | **PARTIAL (deepened)** | physical caption + Level/Display + STFT N QLabels **MET**; further strip residual — **not CLOSED** |
| **G08** | PARTIAL (deepened, light wave6) | **PARTIAL (deepened)** | shell-edge attrs + widened hit targets **MET**; full desktop re-shot residual — **not CLOSED** |
| G11 / G18 / G17 / G06 | prior PARTIAL | **unchanged** | no status flip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — edit-path empty evidence — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior wave6 inline replaceMark | MET (retained) | `85dab15` / `data-annotation-edit="inline-replaceMark"` |
| `data-edit-path` / `data-edit-selection` | **MET** | BottomPanel + M06 empty\|single\|multi |
| Empty hints + edit disabled unless single | **MET** | `bottom-edit-empty-hint` / `m06-edit-empty-hint`; `disabled={selected.length !== 1}` |
| Full desktop AnnotationPanel interactive re-shot | residual | Bot-B deferred |

### G07 — real-caps engine slots — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior detectRunFeed LocalCompute | MET (retained) | wave5/6 |
| Store snapshot from real getCapabilities | **MET** | `detectCapabilities` / `setDetectCapabilities` (null on fail) |
| FFSCN/SCN/model slots + honesty | **MET** | `bottom-detect-engine-*`; “No invented…” |
| Full Qt Worker / non-LocalCompute engines | residual | honest: not invented |

### G02 — strip physical / Level / Display / STFT N — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior mode/workspace/overflow/aux | MET (retained) | wave5/6 |
| Physical caption | **MET** | `chart-strip-caption-physical` |
| Aux 电平/显示 QLabels | **MET** | `chart-strip-qlabel-level-btn` / `display-btn` |
| Overflow STFT N | **MET** | `overflow-qlabel-stft-n` |
| Broader SpectrumToolbar / strip nuances | residual | not CLOSED |

### G08 — shell edge hit — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior collapse-to-min + width persist | MET (retained) | wave5/6 |
| `data-shell-edge` + hit-min attrs | **MET** | left/right 8px; bottom 29px |
| Widened CSS hit targets | **MET** | `.shell-col-resize::after` / `.bottom-panel-resize::after` |
| Full desktop shell re-shot | residual | not CLOSED |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition BLOCKED; interactive STFT
3. **G19 residual** — full desktop AnnotationPanel interactive re-shot (edit-path chrome **done** @ wave7)
4. **G11 residual** — view-bounds clamp; unselected/non-current hover (Overlay **done**)
5. **G18 residual** — broader PSD/dwell chrome (UI→store→DDC **done**)
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps slots (slots **done** @ wave7)
7. **G02 residual** — remaining strip/SpectrumToolbar nuances (physical/Level/Display/STFT N **done**)
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)* (edge hit attrs **done**)

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19/G07/G02/G08 remain PARTIAL (deepened), not CLOSED. No bucket flips.