# INCREMENTAL_c9ed974 — B wave16 G19 MeasuredEvidenceTrace / Inspector / OS chrome (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:14 Asia/Shanghai |
| Web tip (audit subject) | **`c9ed974`** = merge A `afe7f26` on main that folded B `b50b3c5` (wave16 G19) atop C G18 `2bcef55` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; AnnotationEvidenceWidget MeasuredEvidenceTrace / Inspector + QFileDialog::getSaveFileName) |
| Prior Bot-A | `INCREMENTAL_2bcef55.md` @ Web `2bcef55` / audit tip `afe7f26` |
| Scope | **G19** MeasuredEvidenceTrace + Inspector polish + OS dialog chrome deepen (B wave16); note true native QFileDialog residual |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `c9ed97458520f4735d21e4472767ca5a878b37c6` | `origin/main` tip = audit subject |
| `b50b3c51ec737d8ae84df99a22c11237b2c40d0e` | Bot-B wave16: MeasuredEvidenceTrace + Inspector + OS dialog chrome |
| `afe7f26` | Prior Bot-A INCREMENTAL_2bcef55 (G18) |
| `2bcef55` | Prior C G18 linked-cursor (ancestry) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G19 Measured/Inspector/OS = B `b50b3c5`. Tip `c9ed974`.

## Diff vs prior (`2bcef55` → `c9ed974`)

1. **B G19 MeasuredEvidenceTrace (`b50b3c5`):** Parses real `originEvidence.timeAnalysis.trace` (or via `originalFieldsJson` → timeAnalysis) **only** when `kind === measured-causal-mean-power-v1` with validated points/range → SVG envelope + threshold dash. Attrs `data-measured-trace` / `data-measured-point-count` / `data-invented="false"` / `data-object-name="annotationMeasuredEvidenceTrace"`. No valid path → honest empty stub — **never invents traces**. Matches desktop MeasuredEvidenceTrace honesty — **MET** for this slice; **not CLOSED** (full Qt interaction/polish residual may remain).
2. **B G19 Inspector polish (`b50b3c5`):** Mode toggle Auxiliary ↔ Inspector; Inspector shows fact grid (`INSPECTOR_KEYS`), measured trace (or stub), score-definition copy vs Qt, raw fields retained. Stamps `data-qt-evidence="wave16"`. Aligns with desktop Inspector mode — **MET** for toggle+grid+trace chrome.
3. **B G19 OS dialog chrome deepen (`b50b3c5`):** Dialog title echo + richer `filterDescription` into `browserSaveFile` / picker types; Qt-closer status strings; `data-os-dialog-chrome="wave16"`. **`data-native-qfiledialog="false"` retained** — **no native QFileDialog claim**. `browserSaveFile` still MET (wave13). True native OS dialog **still residual by design** (impossible on web) — **not CLOSED**.
4. **G18 / others:** No C/D/E delta this tip beyond ancestry. G18 stays PARTIAL (deepened @ `2bcef55`).
5. **G06 / G17:** Unchanged — stay honest **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE16_G19_MEASURED_INSPECTOR_OS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`2bcef55`) | Now (`c9ed974`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (MeasuredEvidenceTrace / Inspector / native QFileDialog residual) | **PARTIAL (deepened)** | MeasuredEvidenceTrace + Inspector toggle/grid + OS chrome deepen **MET** (`b50b3c5`); **true native QFileDialog still residual** → **not CLOSED** |
| G18 | PARTIAL (deepened) | **unchanged** | Main/Aux done; NB/Esc/rail residual |
| G11 / G02 / G07 / G08 | prior PARTIAL | **unchanged** | no status flip |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — MeasuredEvidenceTrace / Inspector / OS chrome — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior Adaptive-in-cell + Evidence + browserSave + Auxiliary 3-col + OS chrome stub | MET (retained) | wave13–15 / prior incrementals |
| MeasuredEvidenceTrace (kind-gated, never invent) | **MET** | `parseMeasuredTrace`; `data-invented="false"` |
| Inspector mode toggle + fact grid + score-definition | **MET** | Auxiliary ↔ Inspector; `data-qt-evidence="wave16"` |
| OS dialog title / filterDescription deepen | **MET (browser-honest)** | `browserSaveFile` + `data-os-dialog-chrome="wave16"` |
| True native QFileDialog | **still residual** | `data-native-qfiledialog="false"`; Bot-B non-goal |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (MeasuredEvidenceTrace + Inspector + browser OS chrome **done** @ wave16; native impossible on web)
4. **G18 residual** — NB multi-view linked overlay + Esc-clear + rail twin (Main/Aux **done** @ `2bcef55`)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 remains PARTIAL (deepened), not CLOSED — true native QFileDialog still open residual. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.