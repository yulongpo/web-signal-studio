# INCREMENTAL_6df15bc — C G11 unselected polish + B wave12 pin z-index (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 00:51 Asia/Shanghai |
| Web tip (audit subject) | **`6df15bc`** = merge A `130d078` on C `58df6bf` + B `7d1a6ed` |
| Desktop | **`17471a6`** (`rebuild/a143-native`; PlotWidget unselected DashPattern + hover tip `name · 点击选中`; setHoveredMark) |
| Prior Bot-A | `INCREMENTAL_4c28588.md` @ `130d078` |
| Scope | **G11** unselected polish; **G18** rail pin/scrubber z-index (B wave12); light skim |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `6df15bcae8fe32d93213e91acb83a12a578e708f` | `origin/main` tip = audit subject |
| `58df6bfba8b4151193d7a4e59231ae3adcf506de` | Bot-C: G11 unselected polish (dashed + hover tip) |
| `7d1a6ed2a798b115a25ceb8d3850d65cae3994a8` | Bot-B wave12: rail pin/scrubber z-index / pointer-events |
| `d888b42` | merge(bot-c) G11 polish |
| `80d71fd` | merge(bot-b) wave12 pin z-index |
| `130d078` | Prior Bot-A INCREMENTAL_4c28588 |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G11 polish = C `58df6bf`; G18 pin stack = B `7d1a6ed`; tip `6df15bc`.

## Diff vs prior (`4c28588` → `6df15bc`)

1. **C G11 unselected polish (`58df6bf`):** `ChartMarkOverlay` — `data-unselected` / `data-hovered` / `hoveredId` state; hover tip `chart-mark-hover-tip` text **`{name} · 点击选中`**; `data-g11-unselected-polish="true"`; title hint for unselected vs selected. CSS: unselected **dashed 1px** + low fill `rgba(81,196,233,0.09)` (~alpha 23); selected/current solid 2px; unselected hover soft glow rings + dotted outline. Overlay backticks **15** (templates intact; no Overlay BLOCKER). Matches desktop `plot_widget.cpp` ~2363–2419 (`DashPattern{5,3}` when `!selected`; fill alpha 23; label `mark.name + " · 点击选中"`; tip colors `#10374f`/`#95e3ff`/`#e2f9ff`). PointingHand path retained. Residual: **per-sourceKind** stroke colors (Imported `#65d2bd` / Manual `#edc56d` / Algorithm `#51c4e9`); **cross-panel** `setHoveredMark` → annotation table hover sync — **not CLOSED**.
2. **B G18 pin z-index (`7d1a6ed`):** Workspace `z-index:0; overflow:hidden`; right-rail `z-index:6; isolation:isolate`; pin/scrubber `pointer-events:auto`; resize `::after` no right overhang into rail. Stamps `data-rail-stack="wave12"`. e2e `rail-dwell-pin-clickable-wave12.spec.ts` (elementFromPoint must not be canvas). Fixes Bot-G QA gap (canvas stealing pin clicks). Residual: live pin interaction re-shot; multi-chart linked-cursor sync — **not CLOSED**.
3. **G06 / G17:** Unchanged. Narrowband still stamps `data-nb-bitstream=BLOCKED` / `NARROWBAND_RECOGNITION_BLOCKED`; **no invented** eye/bitstream/recognition paths — stay honest **BLOCKED**.

Bot notes: `bot-c/STATUS.md` / `bot-b/BOT_B_WAVE12_PIN_ZINDEX.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`4c28588`) | Now (`6df15bc`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (file-fullRange done; unselected polish residual) | **PARTIAL (deepened)** | dashed+tip+hover glow **MET** (`58df6bf`); sourceKind colors / table hover sync residual — **not CLOSED** |
| **G18** | PARTIAL (rail scrubber twin largely done) | **PARTIAL (deepened)** | pin/scrubber above canvas **MET** (`7d1a6ed`); live re-shot / multi-chart sync residual — **not CLOSED** |
| G19 / G02 / G08 / G07 | prior PARTIAL | **unchanged** | no status flip |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — unselected polish — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior file-fullRange / ClosedHand / PointingHand | MET (retained) | prior INCREMENTALs / `data-g11-*` stamps |
| Unselected dashed stroke + low fill | **MET** | CSS `[data-unselected='true']`; desktop DashPattern + alpha 23 |
| Hover tip `name · 点击选中` | **MET** | `chart-mark-hover-tip`; desktop label identical |
| Unselected hover glow / dotted inner | **MET** | CSS rings + dotted outline; desktop thickness 10/6 + DotLine |
| Overlay template integrity | **MET** | backticks ≈15; `data-g11-unselected-polish` |
| Per-sourceKind stroke colors | residual | desktop Imported/Manual/Algorithm palette |
| Hover → annotation table sync | residual | desktop `setHoveredMark` + `annotationHoverChanged` |

### G18 — pin stack (wave12) — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Rail pin clickable above canvas | **MET** | App.css z-index 6; e2e elementFromPoint; `data-rail-stack="wave12"` |
| Resize hit not stealing rail clicks | **MET** | `shell-col-resize-right::after` right:0 |
| Live pin re-shot / multi-chart sync | residual | Bot-B deferred; prior G18 TOP |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — AdaptiveValueEdit-in-cell / Evidence / QFileDialog
4. **G11 residual** — per-sourceKind colors + table hover sync (polish **done** @ `58df6bf`)
5. **G18 residual** — multi-chart linked-cursor sync (pin stack **done** @ wave12)
6. **G07 residual** — full Qt Detect Worker beyond LocalCompute caps
7. **G02 residual** — remaining strip nuances
8. **G08 residual** — full desktop shell re-shot *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11/G18 remain PARTIAL (deepened), not CLOSED. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.