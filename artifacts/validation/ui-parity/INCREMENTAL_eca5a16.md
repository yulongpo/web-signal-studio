# INCREMENTAL_eca5a16 — B wave17 G08 keyboard / G07 inspector feed / rail twin (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:19 Asia/Shanghai |
| Web tip (audit subject) | **`eca5a16`** = merge B `becd1e4` + G `0e5ab7c` on main after A `6076251` / tip `c9ed974` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; shell column keyboard; Detect Worker inspector; rail dwell chrome) |
| Prior Bot-A | `INCREMENTAL_c9ed974.md` @ Web `c9ed974` / audit tip `6076251` |
| Scope | **G08** shell keyboard; **G07** Worker inspector feed; **rail twin** (deepens **G18** rail residual); skim G `0e5ab7c` |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `eca5a16472dce195b08b30a509e9b8af00920b82` | `origin/main` tip = audit subject |
| `becd1e4cac06ba2801f691625c9715acad414585` | Bot-B wave17: G08 keyboard + G07 inspector feed + rail linkedCursor twin |
| `0e5ab7c` | Bot-G evidence-only web-c9ed974 (wave16 Measured/Inspector + soft G18; **no wave17 PNG**) |
| `6076251` | Prior Bot-A INCREMENTAL_c9ed974 |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G08/G07/rail = B `becd1e4`; G pack = `0e5ab7c` (prior tip only). Tip `eca5a16`.

## Diff vs prior (`c9ed974` → `eca5a16`)

1. **B G08 shell keyboard (`becd1e4`):** Column separators — ArrowLeft/Right (Shift=24px) adjust width, Home restores desktop defaults 278/390, Escape blurs focus; `data-shell-keyboard="wave17"` / `data-shell-keydown="wave17"` / `data-shell-wave` includes wave17; focus-visible outline (CSS). Persist key unchanged (`wss.shellColumns.v1`). Matches desktop keyboard resize intent — **MET** for this slice; **full desktop shell re-shot still residual** → **not CLOSED**.
2. **B G07 Worker inspector feed (`becd1e4`):** Inspector adds `created` / `updated` / `uiMessages` / feed-size from **real** `detectRunFeed` only (`data-worker-chrome="wave17"`). Prior BLOCKED eye/bitstream/demod gap rows retained — **no invented engines**. Residual: full Qt Detect Worker beyond LocalCompute → **not CLOSED**.
3. **B rail linkedCursor twin (`becd1e4`) → G18 deepen:** Right-rail readout of C `uiStore.linkedCursor` + follow-selected-frame → `narrowbandPinnedDwellIndex` + clear via `clearLinkedCursor`; stamps `data-rail-linked-twin="wave17"`. Does **not** touch charts / `nb-stft-dwell-scrubber` (honors Bot-C handoff). Prior TOP “rail twin” residual **MET** for chrome twin; NB multi-view overlay + chart Esc→clear still residual → **G18 stays PARTIAL**.
4. **G `0e5ab7c`:** Evidence pack for prior tip `c9ed974` only (wave16 Measured/Inspector + soft G18 pin/clear). **No wave17 G08/G07/rail screenshots.** Code audit stands; PNG alone never CLOSE.
5. **G19:** Unchanged PARTIAL — true native QFileDialog still residual (`data-native-qfiledialog="false"`).
6. **G06 / G17:** Unchanged — stay honest **BLOCKED**.

Bot notes: `bot-b/BOT_B_WAVE17_G08_G07_RAIL_TWIN.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`c9ed974`) | Now (`eca5a16`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G08** | PARTIAL (shell re-shot residual) | **PARTIAL (deepened)** | keyboard Arrow/Home/Esc + wave17 stamps **MET** (`becd1e4`); full shell re-shot → **not CLOSED** |
| **G07** | PARTIAL (Worker residual) | **PARTIAL (deepened)** | inspector created/updated/uiMessages/feed-size **MET**; full Qt Worker → **not CLOSED** |
| **G18** | PARTIAL (NB/Esc/rail residual) | **PARTIAL (deepened)** | rail linkedCursor twin **MET**; NB multi-view + chart Esc-clear → **not CLOSED** |
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

### G08 — shell keyboard — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior width attrs / aria / bottom min-range | MET (retained) | wave14 / INCREMENTAL_b88443e |
| ArrowLeft/Right (+Shift) / Home / Escape on separators | **MET** | `App.tsx` `onKeyDown`; `data-shell-keyboard="wave17"` |
| Full desktop shell re-shot | residual | Bot-B deferred |

### G07 — inspector feed — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior real-caps Worker + BLOCKED gaps | MET (retained) | wave14 |
| Inspector created/updated/uiMessages/feed-size | **MET** | `BottomPanel` `data-worker-chrome="wave17"`; real `detectRunFeed` only |
| Full Qt Detect Worker | residual | Bot-B deferred |

### G18 — rail twin — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior Main/Aux linkedCursor store+pin | MET (retained) | C `2bcef55` |
| Right-rail linkedCursor readout + follow-frame + clear | **MET** | `RightRail` `data-rail-linked-twin="wave17"` |
| NB multi-view overlay / chart Esc→clear | residual | handoff honest gaps |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — **true native QFileDialog** (Measured+Inspector+browser OS chrome **done** @ wave16)
4. **G18 residual** — NB multi-view linked overlay + chart Esc-clear (Main/Aux + **rail twin done** @ wave17)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute (inspector feed **done** @ wave17)
6. **G02 residual** — live DSP window/overlap values
7. **G08 residual** — full desktop shell re-shot (keyboard **done** @ wave17)
8. **G11 residual** — remaining PlotWidget paint nuances *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G08/G07/G18 remain PARTIAL (deepened), not CLOSED. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.