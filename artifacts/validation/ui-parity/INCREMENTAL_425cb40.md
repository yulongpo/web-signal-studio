# INCREMENTAL_425cb40 — G11/G02 (C) + G17/G18/G19 (E+B) delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 22:48 Asia/Shanghai |
| Web tip (audit subject) | **`425cb40`** = `e9153b8` (B residual + E G17) + Bot-C **`5de2e6b`** (G11 box-zoom edge + G02 physical caption) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; displaySummary lineage `696ce12`) |
| Prior Bot-A | `INCREMENTAL_8783b55.md` @ `7fb0b92`. Planned **`INCREMENTAL_ef89727` / `INCREMENTAL_e9153b8` superseded** by this file per CAO tip bumps. |
| Scope | Focus **G11 / G02 / G17 / G18 / G19**; note G07/G08 membership from B (in tip) for counts |
| Rule | Read-only; **no matrix PASS**; screenshots alone never CLOSE |

## Verified SHAs

| SHA | Role |
|-----|------|
| `425cb400f8ccf10e2ca82b8d86330a851fd79965` | `origin/main` tip = audit subject |
| `5de2e6b554bb84298f9306d89dc4fbea66c25ab1` | Bot-C: G11 both-edges≥8px + G02 `formatPhysicalCaptionPair` |
| `e9153b861b80ee61100cf6a6b29b6d76d36f60a5` | merge Bot-B residual G18/G19/G07/G02/G08 |
| `0eabe567662ff7e40197e00c83c80b1f6e7efce6` | Bot-B feat residual |
| `ef897271bee6206a57170a1cf430ceefcb7c8c8f` | merge Bot-E G17 residual |
| `59f982031845acf5a3a9f70255084e8c7b25a9ec` | Bot-E Detect inventory/cancel/precheck |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

## Diff vs prior (`8783b55` → `425cb40`)

1. **E G17** (`59f9820` / `ef89727`): DetectPage models inventory, cancel queued\|running\|busy + frozen re-GET, precheck chips.
2. **B residual** (`0eabe56` / `e9153b8`): display-summary; ProjectTree tooltip/title/unread; G07 dock hosts; G02 chart-header/overflow; G08 278/390.
3. **C residual** (`5de2e6b` / `425cb40`): box-zoom both CSS edges ≥8px; physical caption MHz/ms scaling.
4. Docs/shots: Bot-A `7fb0b92`, Bot-G `ecd75cb` — shots never CLOSE.

## Verdict summary

| ID | Prior (`8783b55`) | Now (`425cb40`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G17** | PARTIAL | **PARTIAL (deepened)** | inventory/cancel/precheck MET; DetectionCard + selectable `.engine` NOT MET — **not CLOSED** |
| **G18** | OPEN | **PARTIAL** | live `display-summary` 参考/动态 MET; PSD N/STFT N/palette residual |
| **G19** | PARTIAL (API MET; UI tooltip NOT) | **PARTIAL (deepened)** | ProjectTree wires tooltip/title/sourceTooltip/unread; CN relation/glyphs/multi-select residual — **not CLOSED** |
| **G11** | PARTIAL | **PARTIAL (deepened)** | both-edges ≥8px box-zoom MET; axis-only pan residual (middle-button N/A on desktop) — **not CLOSED** |
| **G02** | PARTIAL | **PARTIAL (deepened)** | B toolbar habit/overflow + C physical caption units MET; deeper strip overflow residual — **not CLOSED** |
| G07 | PARTIAL | **PARTIAL (deepened)** *(membership)* | dock hosts MET; full Qt panel residual |
| G08 | OPEN | **PARTIAL** *(membership)* | 278/390 MET; resize/persist NOT MET |
| G06 / G14 / G05 | prior | **unchanged** | |

**Counts (membership-normalized):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, **G08**, G11–G13, G15, G17, **G18**, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G17 — Detect / engine — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| REAL_RUNTIME / TRT / draw policy | MET (prior) | `a61046d` lineage |
| `capabilities.models` read-only `.engine` inventory | **MET** | `detect-engine-inventory` (`59f9820`) |
| `.pth` blocked (G26) | **MET** | `data-blocked-pth` |
| Cancel = queued \| running \| busy + re-GET + `result=null` frozen | **MET** | `canCancel` / `detect-cancelled-message` |
| Precheck ffscn/scn present/ready + modelSearchRoots | **MET** | `detect-ffscn-present` / `detect-scn-present` / `detect-model-roots` |
| Selectable `.engine` picker | **NOT MET** | display-only list |
| DetectionCard field parity | **NOT MET** | vs `ui/detection/detection_card.*` @ `17471a6` |
| Narrowband recognition | **BLOCKED** | honest |

Bot-E: `docs/acceptance/evidence/bot-e/G17_RESIDUAL_INDEX.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G18 — Display summary — **PARTIAL** (was OPEN)

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Right-rail live `display-summary` | **MET** | `RightRail` `DisplayPage` (`0eabe56`) |
| 参考 + 动态 from `uiStore.level` | **MET** | e2e residual; `BOT_B_G18_DISPLAY.md` |
| Open Level/Display layers | **MET** | layer buttons |
| Full PSD N / STFT N / palette lines | **NOT MET** | Bot-B residual; C deferred G18 |

Screenshots ≠ CLOSE. **Not CLOSED.**

### G19 — Project tree — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| F API title/tooltip/relation/unread/detectionRuns | MET (prior) | `bb58265` |
| UI wires `tooltip` / `title` / `sourceTooltip` + unread | **MET** (was NOT @8783b55) | `ProjectTree.tsx` (`0eabe56`) |
| Compact `data-presentation="desktop-compact"` | **MET (chrome)** | e2e |
| CN relation / folder glyphs / multi-select | **NOT MET** | Bot-B residual |

**Not CLOSED.**

### G11 — Navigate / box-zoom — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| navigate → zoom-box + nav click keeps span | MET (prior) | retained |
| Commit rule: **both** CSS edges ≥ 8px | **MET** | `BOX_ZOOM_MIN_EDGE_PX` / `isBoxZoomLargeEnough` (`5de2e6b`); was diagonal hypot |
| `data-box-zoom-min-edge-px` + crosshair on zoom-box | **MET** | HeatmapCanvas / e2e attrs |
| Axis-only pan | **NOT MET** | Bot-C known gap (axis drag still pans under navigate map) |
| Middle-button pan | **N/A on desktop 17471a6** | Bot-C STATUS: no MiddleButton in plot_widget — does not block |

Bot-C `STATUS.md` WIP / no PASS; charts tests claimed 67 passed (not re-run). **Not CLOSED.**

### G02 — Captions / toolbar — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Strip / Level 参考·动态 (prior) | MET (prior+) | retained |
| Retire aux≠main SpectrumToolbar + f9f05bb overflow Esc/autofocus | **MET** | `ChartParamStrip` (`0eabe56`); `data-toolbar-habit="retired-aux-main"` |
| Charts `chart-physical-caption` displayUnit MHz/ms scaling | **MET** | `formatPhysicalCaptionPair` (`5de2e6b`); HeatmapCanvas |
| Deeper strip overflow / QLabel chrome parity | **NOT MET** | Bot-B residual |

**Not CLOSED.**

### Membership notes (in tip, not focus headline)

- **G07** PARTIAL deepened: annotation/detection dock hosts MET; full Qt panel residual.
- **G08** OPEN→PARTIAL: shell 278/390 MET; resize/saved state NOT MET — **not CLOSED**.

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — DetectionCard + selectable `.engine` (overlaps G26)
2. **G06 residual** — eye/recognition/bitstream beyond BLOCKED; workbench title + interactive STFT
3. **G19 residual** — CN relation / folder glyphs / multi-select
4. **G11 residual** — axis-only pan semantics
5. **G18 residual** — PSD N / STFT N / palette summary lines
6. **G07 residual** — full Qt AnnotationPanel / DetectionPanel port
7. **G02 residual** — deeper overflow / strip QLabel parity
8. **G08 residual** — column resize + saved UI state *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11/G02/G17/G18/G19 not CLOSED. Planned `INCREMENTAL_ef89727` and `INCREMENTAL_e9153b8` abandoned/replaced by this file.