# INCREMENTAL_85596ed — B wave15 G19 Auxiliary 3-col / OS dialog chrome (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:03 Asia/Shanghai |
| Web tip (audit subject) | **`85596ed`** = merge A `5cf9192` on main that folded B `d178f8e` + G `014ec83` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; AnnotationEvidenceWidget Auxiliary 3-col + QFileDialog::getSaveFileName) |
| Prior Bot-A | `INCREMENTAL_b88443e.md` @ Web `b88443e` / audit tip `5cf9192` |
| Scope | **G19** Auxiliary 3-col / extra facts / OS dialog chrome (B wave15); skim G `014ec83` |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `85596ede0720b3b937b91887eaa1f5aae6ac9cdf` | `origin/main` tip = audit subject |
| `d178f8ec6e8b834f9459b0d70a86e8d6a031ea9f` | Bot-B wave15: G19 Auxiliary 3-col + OS dialog chrome |
| `014ec83` | Bot-G evidence-only web-b88443e (G11/G02/G07/G08; **no wave15 G19 PNG**) |
| `5cf9192` / `c13c860` | Prior Bot-A INCREMENTAL_b88443e |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G19 Auxiliary/OS chrome = B `d178f8e`; G pack = `014ec83` (prior tip only). Tip `85596ed`.

## Diff vs prior (`b88443e` → `85596ed`)

1. **B G19 Auxiliary 3-col (`d178f8e`):** `AnnotationEvidencePanel` `mode="auxiliary"` — time / scores / diagnostics columns with `data-qt-auxiliary-cols="3"`; details toggle for remaining facts. Honest `—` from real `originEvidence` + annotation range fields only — **never invents scores**. Matches desktop Auxiliary layout intent @ `17471a6` — **MET** for 3-col chrome; **not CLOSED** (MeasuredEvidenceTrace plot + full Inspector polish deferred per Bot-B).
2. **B G19 extra Qt facts (`d178f8e`):** Bound when present — uncertainty, frequencyBasis, current/original range, observation, windows/windowIds, noise, reason, class, format, origin, coordinates (plus prior method/timeBasis/mean/max). Aligns with desktop `buildFacts` / Auxiliary extras — **MET** for bound facts; empty stays honest `—`.
3. **B G19 OS dialog chrome (`d178f8e`):** Export filter select + suggested filename + status under `data-os-dialog-chrome="wave15"`; **`browserSaveFile` unchanged (MET @ wave13)**; explicit `data-native-qfiledialog="false"` — **no native QFileDialog claim**. Browser-honest chrome around existing save path — **MET (browser-honest)**; true OS/native dialog chrome residual by design — **not CLOSED**.
4. **G `014ec83`:** Evidence pack for prior tip `b88443e` only (G11 sourceKind/hover + wave14 G02/G07/G08). **No wave15 Auxiliary/OS-dialog screenshots.** Code audit stands; PNG alone never CLOSE.
5. **G06 / G17:** Unchanged. `data-nb-bitstream` / `data-nb-eye-status` / `NARROWBAND_RECOGNITION_BLOCKED` + G07 honest BLOCKED gap rows remain — **no invented** eye/bitstream/recognition paths → stay honest **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE15_G19_AUXILIARY_OS_DIALOG.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`b88443e`) | Now (`85596ed`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (Auxiliary 3-col / native dialog residual) | **PARTIAL (deepened)** | Auxiliary 3-col + extra facts + OS chrome stub **MET** (`d178f8e`); MeasuredEvidenceTrace / true native QFileDialog / Inspector polish residual → **not CLOSED** |
| G11 / G02 / G07 / G08 / G18 | prior PARTIAL | **unchanged** | no status flip |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — Auxiliary 3-col / OS dialog chrome — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior AdaptiveValueEdit-in-cell + Evidence shell + browserSave | MET (retained) | wave13 `ad4b617` / INCREMENTAL_6ada5b0 |
| Auxiliary 3-col (time / scores / diagnostics) | **MET** | `AnnotationEvidencePanel` `mode="auxiliary"`; `data-qt-auxiliary-cols="3"` |
| Extra Qt facts (range / noise / format / …) | **MET (bound-honest)** | FACTS map; empty → `—` |
| OS dialog chrome (filter / suggested path / status) | **MET (browser-honest)** | `data-os-dialog-chrome="wave15"`; `data-native-qfiledialog="false"` |
| MeasuredEvidenceTrace plot | residual | Bot-B deferred |
| True native QFileDialog chrome | residual | browser APIs only by design |
| Full Inspector mode polish | residual | Bot-B deferred |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — MeasuredEvidenceTrace / Inspector polish / true native QFileDialog (Auxiliary 3-col + OS chrome stub **done** @ wave15)
4. **G18 residual** — multi-chart linked-cursor sync (pin stack **done** @ wave12)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute (wave14 real-caps + BLOCKED rows **done**)
6. **G02 residual** — live DSP window/overlap values (wave14 honest `—` chrome **done**)
7. **G08 residual** — full desktop shell re-shot (wave14 width/aria/bottom attrs **done**)
8. **G11 residual** — remaining PlotWidget paint nuances (sourceKind + hover sync **done** @ `b71010b`) *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 remains PARTIAL (deepened), not CLOSED. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.