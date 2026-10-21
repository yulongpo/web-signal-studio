# INCREMENTAL_14cc45f — C G18 Esc clear pin + NB multi-view wave linkedX (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:22 Asia/Shanghai |
| Web tip (audit subject) | **`14cc45f`** = merge A `6344cda` on main that folded C `ae63355` (Esc clear + NB multi-view) atop tip `eca5a16` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; MainWindow Esc→clearActiveLinkedCursor / Session::clearCursor; NarrowbandWorkspace::updateLinkedCursors) |
| Prior Bot-A | `INCREMENTAL_eca5a16.md` @ Web `eca5a16` / audit tip `6344cda` |
| Scope | **G18** Esc-clear / NB multi-view wave sync (C); deepen PARTIAL only — **not CLOSED** without full desktop parity |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `14cc45fdab0675c44750da2d724c8e9436fc33bf` | `origin/main` tip = audit subject |
| `ae633551a282472f40cd2e5ace9e8c99b3418cf4` | Bot-C: Esc clearActivePinnedCursor + NB wave linkedX |
| `6344cda` | Prior Bot-A INCREMENTAL_eca5a16 |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G18 Esc/NB multi-view = C `ae63355`. Tip `14cc45f`.

## Diff vs prior (`eca5a16` → `14cc45f`)

1. **C G18 Esc clear pin (`ae63355`):** `clearActivePinnedCursor()` — wideband clears `linkedCursor`; narrowband clears `narrowbandPinnedDwellIndex` + restores `narrowbandPsdMode` to `statistical` (desktop Session::clearCursor drops framePsd). Hook `useEscClearPinnedCursor` mounted in App with priority after temp-layer / ROI / dialog / editing / context menu. Main clear-menu + NB clear / Alt-click use same helper. Stamp `data-g18-esc-clear`. Unit tests `uiStore.escClearPin.test.ts`. Matches desktop MainWindow Key_Escape path — **MET** for prior “chart Esc-clear” residual.
2. **C G18 NB multi-view (`ae63355`):** Observe waveform gets `linkedX={dwellTimeSec}` mapped from pinned dwell index → STFT time span; stamps `data-g18-nb-multi-view` / `data-g18-linked-cursor`. Subset of desktop `updateLinkedCursors` — **MET** for wave sync slice.
3. **C G18 honest gaps (not CLOSED):** NB PSD vertical freq pin overlay still thin (STFT pin stores frame index only; no `pin-frequencyHz` yet). Nav strip still skips linked cursor (matches desktop Kind::Navigation). Rail twin remains Bot-B (already MET @ wave17). → **G18 stays PARTIAL**.
4. **G08 / G07 / G19 / others:** No B delta this tip beyond ancestry. Statuses unchanged from `INCREMENTAL_eca5a16`.
5. **G06 / G17:** Unchanged — stay honest **BLOCKED**.

Bot notes: `bot-c/G18-ESC-CLEAR-HANDOFF.md`, `bot-c/STATUS.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`eca5a16`) | Now (`14cc45f`) | One-liner |
|----|---------------------|-------------------|-----------|
| **G18** | PARTIAL (NB multi-view / chart Esc-clear residual) | **PARTIAL (deepened)** | Esc clearActivePinnedCursor + NB wave linkedX **MET** (`ae63355`); NB PSD freq overlay residual → **not CLOSED** |
| G08 / G07 | PARTIAL (deepened @ wave17) | **unchanged** | keyboard / inspector feed retained |
| **G19** | PARTIAL (true native QFileDialog) | **unchanged PARTIAL** | native still residual |
| G11 / G02 | prior PARTIAL | **unchanged** | no status flip |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G18 — Esc clear + NB multi-view — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior Main/Aux linkedCursor store+pin + rail twin | MET (retained) | C `2bcef55` / B wave17 |
| Esc → clearActivePinnedCursor (WB + NB) | **MET** | `useEscClearPinnedCursor`; `data-g18-esc-clear`; escClearPin tests |
| Clear menu / NB clear / Alt-click unified helper | **MET** | MainChartHost + NarrowbandObserveCharts / Workspace |
| NB observe wave linkedX from pinned dwell | **MET** | `data-g18-nb-multi-view`; dwellTimeSec map |
| NB PSD vertical freq pin overlay | residual | handoff: no pin-frequencyHz yet |
| Full desktop updateLinkedCursors on all NB charts | residual | wave sync subset only → **not CLOSED** |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog**
4. **G18 residual** — NB PSD freq overlay / full NB multi-view polish (Esc-clear + wave linkedX + rail twin **done**)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G18 remains PARTIAL (deepened), not CLOSED. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.