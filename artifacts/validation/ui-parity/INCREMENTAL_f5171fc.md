# INCREMENTAL_f5171fc — G17 Adaptive/Fs/ROI chrome short delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 23:47 Asia/Shanghai |
| Web tip (audit subject) | **`f5171fc`** = merge Bot-A `846e849` (INCREMENTAL_647978c) over Bot-E Adaptive/Fs/ROI `49997d1`←`72f208c` |
| Desktop | **`17471a6`** (`rebuild/a143-native`; `ui/controls/adaptive_value_edit.*` + `detection_card` physical-times / rangeOrigin) |
| Prior Bot-A | `INCREMENTAL_647978c.md` @ `846e849` / content tip `647978c` |
| Scope | Focus **G17 AdaptiveValueEdit / physical Fs notes / range-ROI chrome** (CAO short tip); membership skim only |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`); RadioAI-360 worktree absent |

## Verified SHAs

| SHA | Role |
|-----|------|
| `f5171fc834c2a53aa36363e79f5bd359ff79aee9` | `origin/main` tip = audit subject (`merge(bot-a): INCREMENTAL_647978c`) |
| `49997d1a6f5ba6d12f922d71cd92c30453403e91` | merge Bot-E G17 Adaptive/Fs/ROI |
| `72f208c52bf74f789dafeac6aaf3c5a9642e5a63` | Bot-E impl: AdaptiveValueEdit + Fs notes + ROI chrome |
| `846e849c63fee9e03955d6cc6477404e2dba3488` | Prior Bot-A INCREMENTAL_647978c |
| `647978c` | Prior audit subject (pre-E Adaptive wave) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged; external rebuild tip) |

**ID map:** G17 = DetectionCard AdaptiveValueEdit / physical-times Fs / detectionRangeOrigin+ROI chrome (E). Recognition remains out-of-scope BLOCKED.

## Diff vs prior (`647978c` → `f5171fc`)

1. **E G17 AdaptiveValueEdit** (`72f208c`): New `adaptiveValue.ts` (parse/format Frequency|SampleRate|Time|Scalar) + `AdaptiveValueEdit.tsx` (Enter/Tab commit, Esc discard, draft/invalid attrs). Wired onto DetectionCard Scalar param fields (hop/score/nms/margins/fine/coarse/…); unit tests in `adaptiveValue.test.ts`. Evidence `docs/acceptance/evidence/bot-e/G17_ADAPTIVE_ROI_CHROME.md` (`matrix_pass_claimed: false`).
2. **E G17 physical-times Fs notes** (`72f208c`): `formatDetectionPhysicalTimes` — honest without Fs (`hasFs=false`, 待载入真实 IQ); with Fs computes FFT窗/谱步长/上下文/滑动 via `floor(Fs×hop)` and fills `detectionPhysicalTimes` + `detectionCalculationDetails` details/pre. No invented Fs.
3. **E G17 rangeOrigin / ROI chrome** (`72f208c`): `detectionRangeOrigin` select (visible / available-file / active-segment / custom) + `selectDetectionRoi` → `detection-roi` tool; mirrors chart/file ROI confirm into origin chrome (no auto-run). Active-segment `<select>` disabled with honest PARTIAL placeholder (no invented segment list). Visible-region ↔ main-chart window alignment still PARTIAL note.
4. **Recognition**: still **BLOCKED** — no recognition engine path, no fake labels (Bot-E evidence + DetectPage comments). Unchanged from prior TOP residual.

## Verdict summary

| ID | Prior (`647978c`) | Now (`f5171fc`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G17** | PARTIAL (deepened); Adaptive/Fs/ROI residual + recognition BLOCKED | **PARTIAL (deepened)** | AdaptiveValueEdit + Fs-gated physical times + rangeOrigin/ROI chrome **MET** (`72f208c`); active-segment list + visible-region align residual; recognition **BLOCKED** → **not CLOSED** |
| G19 / G07 / G02 / G08 / G11 / G18 / G06 | prior | **unchanged** (membership) | no status flip this short tip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G17 — AdaptiveValueEdit / Fs notes / ROI chrome — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior inventory/cancel/precheck + selectable `.engine` + DetectionCard chrome | MET (retained) | `8bf1390` / `ecee9a2` lineage |
| Full DetectionCard param grid + TRT honor | MET (retained) | `09ae79b` / `f87b94b` @f4c67be |
| AdaptiveValueEdit Enter/Tab/Esc + unit parse/format | **MET** (was NOT) | `AdaptiveValueEdit.tsx` + `adaptiveValue.ts`; wired on Scalar fields (`72f208c`) |
| Physical-times Fs notes (honest without Fs; floor(Fs×hop) with Fs) | **MET** (was NOT) | `formatDetectionPhysicalTimes`; `detectionPhysicalTimes` / `detectionCalculationDetails` |
| detectionRangeOrigin + selectDetectionRoi chrome | **MET** (was NOT) | visible / available-file / active-segment / custom; ROI tool handoff |
| Active-segment list binding (real mark segments) | **NOT MET** | disabled select; Bot-E: no invented segment list |
| Visible-region ↔ main-chart window alignment | **NOT MET** / PARTIAL note | chrome text acknowledges PARTIAL |
| Recognition engine / labels | **BLOCKED** | no path; honest BLOCKED retained |

Bot-E: `docs/acceptance/evidence/bot-e/G17_ADAPTIVE_ROI_CHROME.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — active-segment list binding + visible-region chart align; recognition **BLOCKED** (E; Adaptive/Fs/ROI chrome landed)
2. **G06 residual** — eye/bitstream/recognition stay BLOCKED; workbench title + interactive STFT (D/F)
3. **G19 residual** — full Qt AnnotationPanel beyond Qt-ish table/paging/quality (B)
4. **G11 residual** — mark-edge resize cursors (C; overview OpenHand landed)
5. **G18 residual** — PSD mode 驻留帧谱/统计谱 (C/D; STFT/palette shell landed)
6. **G07 residual** — live Detect Worker feeds / full Qt port (B)
7. **G02 residual** — broader strip/SpectrumToolbar chrome nuances (B)
8. **G08 residual** — rail collapse-to-min (≈8px) re-verify *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G17 remains PARTIAL (deepened), not CLOSED. No bucket flips this wave.