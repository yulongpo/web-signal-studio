# INCREMENTAL_2bcef55 — C G18 multi-chart linked-cursor Main/Aux sync (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:12 Asia/Shanghai |
| Web tip (audit subject) | **`2bcef55`** = Bot-C G18 linked-cursor on main that already holds G19 Auxiliary tip `85596ed` + G `cf0bca5` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; Session::LinkedCursorState / PlotWidget::pinAt / NarrowbandWorkspace::updateLinkedCursors) |
| Prior Bot-A | `INCREMENTAL_85596ed.md` @ Web `85596ed` / audit tip `d4f9437` |
| Scope | **G18** linked-cursor / Main↔Aux multi-chart sync (C); confirm **G19** residual still PARTIAL; skim G `cf0bca5` |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `2bcef55b632ca2c3320b84eb5a43c1ecc5fb7cd6` | `origin/main` tip = audit subject (C G18) |
| `cf0bca5` | Bot-G evidence-only web-85596ed (wave15 Auxiliary/OS chrome; **no G18 PNG**) |
| `d4f9437` | Prior Bot-A INCREMENTAL_85596ed |
| `d178f8e` | Prior B wave15 G19 (still on tip ancestry) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G18 linked-cursor = C `2bcef55`; G pack = `cf0bca5` (prior tip only). Tip `2bcef55`.

## Diff vs prior (`85596ed` → `2bcef55`)

1. **C G18 linkedCursor store (`2bcef55`):** `uiStore.linkedCursor` + `pinLinkedCursor` / `clearLinkedCursor` with desktop-style dim-merge (missing dim keeps prior pinned value or falls back to view center). Types in `provisional.ts` (`LinkedCursorState` / `LinkedCursorPinSource`). Unit test `uiStore.linkedCursor.test.ts`. Matches desktop `Session::LinkedCursorState` contract — **MET** for store API.
2. **C G18 Main↔Aux sync (`2bcef55`):** `HeatmapCanvas` solid pin crosshair + `onPinCursor` (click when zoom-box/pan too small); `WaveformChart` `linkedX` + `onPinX`; `MainChartHost` ↔ `AuxChartHost` via store. Probes `data-g18-linked-cursor` / `data-linked-cursor-pinned` / `data-linked-x`. Context menu **清除驻留游标**. Matches desktop pinAt / cross-panel sync intent for Main/Aux — **MET** for this charts-owned slice.
3. **C G18 honest gaps (not CLOSED):** Nav strip does not draw linked cursor (matches desktop Kind::Navigation skip). Narrowband observe wave/PSD linked overlay still thin vs desktop `updateLinkedCursors` on all NB charts (STFT pin path exists; full NB multi-view polish residual). Esc→clear pin not wired (menu clear only). Right-rail `rail-dwell-scrubber` twin remains **Bot-B** (untouched; handoff doc). → **G18 stays PARTIAL**, not CLOSED.
4. **G19 confirm:** No B change this tip. Auxiliary 3-col + OS chrome stub remain from `d178f8e`; MeasuredEvidenceTrace / true native QFileDialog / Inspector polish residual unchanged → **G19 still PARTIAL**.
5. **G `cf0bca5`:** Evidence pack for prior tip `85596ed` only (wave15 G19). **No G18 linked-cursor screenshots.** Code audit stands; PNG alone never CLOSE.
6. **G06 / G17:** Unchanged — stay honest **BLOCKED** (no invented eye/bitstream/recognition paths).

Bot notes: `bot-c/G18-LINKED-CURSOR-HANDOFF.md`, `bot-c/STATUS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`85596ed`) | Now (`2bcef55`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G18** | PARTIAL (multi-chart linked-cursor residual) | **PARTIAL (deepened)** | Main/Aux linkedCursor store + pin overlays + clear menu **MET** (`2bcef55`); NB multi-view / Esc-clear / rail twin residual → **not CLOSED** |
| **G19** | PARTIAL (MeasuredEvidenceTrace / native QFileDialog) | **unchanged PARTIAL** | confirm residual still open; no B delta this tip |
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

### G18 — linked-cursor Main/Aux — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior pin stack / margin-map / scrubber chrome | MET (retained) | prior waves / INCREMENTAL_b88443e TOP |
| linkedCursor store pin/clear + dim-merge | **MET** | `uiStore.ts` + `linkedCursor.test.ts`; desktop Session |
| HeatmapCanvas / WaveformChart pin overlay | **MET** | `data-linked-cursor-pinned` / `linkedX` |
| MainChartHost ↔ AuxChartHost sync | **MET** | `data-g18-linked-cursor`; clear menu |
| Nav strip linked cursor | N/A (desktop skip) | Kind::Navigation |
| Full NB multi-view updateLinkedCursors | residual | handoff honest gaps |
| Esc→clear pin | residual | menu only this tip |
| Right-rail dwell scrubber twin | Bot-B | handoff; not this tip |

### G19 — confirm residual — **PARTIAL (unchanged)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Auxiliary 3-col + OS chrome stub | MET (retained) | `d178f8e` / INCREMENTAL_85596ed |
| MeasuredEvidenceTrace / true native QFileDialog / Inspector polish | **still residual** | no B delta @ `2bcef55` |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — MeasuredEvidenceTrace / Inspector polish / true native QFileDialog (Auxiliary 3-col + OS chrome stub **done** @ wave15)
4. **G18 residual** — NB multi-view linked overlay + Esc-clear + rail twin (Main/Aux store+pin **done** @ `2bcef55`)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18 remains PARTIAL (deepened), not CLOSED. G19 residual confirmed still PARTIAL. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.