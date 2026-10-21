# INCREMENTAL_b88443e — C G11 sourceKind/hover + B wave14 G02/G07/G08 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 01:00 Asia/Shanghai |
| Web tip (audit subject) | **`b88443e`** = merge A `977d0dd` on main that already folded C `b71010b` + B `b057d2d` + G `2bc48d3` |
| Desktop | **`17471a6`** (`signal_studio_rebuild`; PlotWidget sourceColor + setHoveredMark; strip QLabels; Detect Worker; shell 278/390) |
| Prior Bot-A | `INCREMENTAL_6ada5b0.md` @ Web `6ada5b0` / audit commit `977d0dd` |
| Scope | **G11** sourceKind stroke + hover sync (C); **G02** / **G07** / **G08** wave14 (B); skim G `2bc48d3` |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`) |

## Verified SHAs

| SHA | Role |
|-----|------|
| `b88443e308c99a18053b446d02d4ecf2f8b9cb73` | `origin/main` tip = audit subject |
| `b71010b1d17b170c07aa8aae661b9307fe4b5669` | Bot-C: G11 sourceKind stroke colors + annotation hover sync |
| `b057d2dc9db9fe6e7b1496c5714a6ddeb9b694bb` | Bot-B wave14: G02 strip + G07 Worker honest gaps + G08 shell |
| `2bc48d3` | Bot-G evidence-only web-6ada5b0 (wave13 G19 PNGs; **no wave14 G02/G07/G08/G11 PNG**) |
| `977d0dd` | Prior Bot-A INCREMENTAL_6ada5b0 |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

**ID map:** G11 = C `b71010b`; G02/G07/G08 = B `b057d2d`; G pack = `2bc48d3` (prior tip only). Tip `b88443e`.

## Diff vs prior (`6ada5b0` → `b88443e`)

1. **C G11 sourceKind stroke/fill (`b71010b`):** Chart marks paint by `sourceKind` — ImportedLabel `#65d2bd` / Manual `#edc56d` / Algorithm `#51c4e9` (CSS + inline `borderColor` / `--mark-source`); annotation table rows get matching `color` via `.annotation-mark-row[data-source-kind=…]`. Stamps `data-g11-source-kind` / `data-source-kind` / `data-g11-source-stroke`. Matches desktop `PlotWidget` sourceColor @ `17471a6` — **not CLOSED** (other PlotWidget paint/selection nuances may remain).
2. **C G11 hover sync (`b71010b`):** Ephemeral `hoveredMarkId` on `M06MarkSession` + `setHoveredMark` (not persisted / not undo); chart overlay `onPointerEnter/Leave` ↔ `BottomPanel` / `M06MarksPanel` row hover. Stamps `data-g11-hover-sync`. Matches desktop `FileState.hoveredMarkId` / `AnnotationService::setHoveredMark` cross-panel path — **MET** for this residual; multi-chart linked-cursor stays under **G18**.
3. **B G02 strip wave14 (`b057d2d`):** Chart strip QLabels — 频率 mode (RF/基带 from `display.freqMode`); 窗 / 重叠 honest `—` with `data-strip-empty` until DSP wired; overflow window/overlap/colormap. Stamp `data-strip-wave="wave11 wave14"`. Residual: live DSP window/overlap values — **not CLOSED**.
4. **B G07 Worker honest gaps (`b057d2d`):** Worker status from **real** LocalCompute caps only (`protocolVersion` / `serviceVersion` / feed q/r/s/f/c/b counts). Explicit disabled rows: eye-diagram / bitstream / demod-recognition stamped `data-blocked="true"` + honesty banner — **not invented**. Residual: full Qt Detect Worker beyond LocalCompute — **not CLOSED**.
5. **B G08 shell wave14 (`b057d2d`):** Desktop default width attrs `data-shell-desktop-left="278"` / `right="390"`; resize `aria-valuemin/max/now`; bottom `data-bottom-desktop-min="29"` + `data-bottom-desktop-range="100-500"`; `data-shell-wave` includes wave14. Residual: full desktop shell re-shot — **not CLOSED**.
6. **G `2bc48d3`:** Evidence pack for prior tip `6ada5b0` only (wave13 Adaptive/Evidence/save). **No wave14 G02/G07/G08/G11 screenshots.** Code audit stands; PNG alone never CLOSE.
7. **G06 / G17:** Unchanged. Narrowband still stamps `data-nb-bitstream=BLOCKED` / `data-nb-eye-status=BLOCKED` / `NARROWBAND_RECOGNITION_BLOCKED`; B wave14 adds honest BLOCKED gap rows — **no invented** eye/bitstream/recognition paths → stay honest **BLOCKED**.

Bot notes: `bot-c/STATUS.md`, `bot-b/BOT_B_WAVE14_G02_G07_G08.md` (`matrix_pass_claimed: false`).

## Verdict summary

| ID | Prior (`6ada5b0`) | Now (`b88443e`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G11** | PARTIAL (sourceKind/hover residual) | **PARTIAL (deepened)** | sourceKind colors + setHoveredMark chart↔table **MET** (`b71010b`); PlotWidget residual nuances → **not CLOSED** |
| **G02** | PARTIAL | **PARTIAL (deepened)** | wave14 freq/window/overlap QLabels **MET** (`b057d2d`); live DSP window/overlap residual → **not CLOSED** |
| **G07** | PARTIAL | **PARTIAL (deepened)** | Worker real-caps status + honest BLOCKED gaps **MET** (`b057d2d`); full Qt Worker residual → **not CLOSED** |
| **G08** | PARTIAL | **PARTIAL (deepened)** | desktop 278/390 + aria resize + bottom min/range **MET** (`b057d2d`); full shell re-shot residual → **not CLOSED** |
| G19 / G18 | prior PARTIAL | **unchanged** | Auxiliary/native dialog; multi-chart sync |
| **G17** | PARTIAL (recognition BLOCKED) | **unchanged — recognition still BLOCKED** | no invented path |
| **G06** | PARTIAL (eye/bitstream BLOCKED) | **unchanged — eye/bitstream still BLOCKED** | no invented path |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G11 — sourceKind + hover sync — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior unselected polish dashed+tip | MET (retained) | `58df6bf` / INCREMENTAL_6df15bc |
| sourceKind stroke/fill + table ForegroundRole | **MET** | `ChartMarkOverlay` + `App.css`; desktop PlotWidget sourceColor |
| setHoveredMark chart ↔ BottomPanel / M06MarksPanel | **MET** | `m06-mark-session.setHoveredMark`; `data-g11-hover-sync` |
| Multi-chart linked-cursor | under G18 | deferred (Bot-C STATUS) |

### G02 / G07 / G08 — wave14 — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Strip 频率 RF/基带 + 窗/重叠 `—` + overflow | **MET (honest empty)** | `ChartParamStrip` `data-strip-wave=wave14` |
| Worker protocol/service/feed from real caps | **MET** | `BottomPanel` `data-worker-chrome=wave14` |
| eye / bitstream / demod BLOCKED rows | **MET (honest)** | `data-honest-blocked=g06-g17`; not invented |
| Shell 278/390 + aria + bottom 29 / 100–500 | **MET** | `App.tsx` + bottom resize attrs |
| Live DSP window/overlap; full Qt Worker; full shell re-shot | residual | Bot-B deferred |

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — recognition **BLOCKED**
2. **G06 residual** — eye/bitstream/recognition **BLOCKED**; interactive STFT
3. **G19 residual** — Evidence Auxiliary 3-col / extra facts + native dialog chrome (Adaptive-in-cell + Evidence shell + browserSave **done** @ wave13)
4. **G18 residual** — multi-chart linked-cursor sync (pin stack **done** @ wave12)
5. **G07 residual** — full Qt Detect Worker beyond LocalCompute (wave14 real-caps + BLOCKED rows **done**)
6. **G02 residual** — live DSP window/overlap values (wave14 honest `—` chrome **done**)
7. **G08 residual** — full desktop shell re-shot (wave14 width/aria/bottom attrs **done**)
8. **G11 residual** — remaining PlotWidget paint nuances (sourceKind + hover sync **done** @ `b71010b`) *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G11/G02/G07/G08 remain PARTIAL (deepened), not CLOSED. G06 eye/bitstream and G17 recognition stay honest **BLOCKED**. No bucket flips.