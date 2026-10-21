# INCREMENTAL_647978c — G19/G07/G02/G08/G11 (+G18 shell / G evidence) delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 23:41 Asia/Shanghai |
| Web tip (audit subject) | **`647978c`** = merge Bot-C `2ac1f9b` over `ff06590` (Bot-B `d7d44c1` + Bot-G `635d07a` on post-`1dbf673`) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; Navigation `PlotWidget::updateHover`; AnnotationPanel table/quality; `main_window` panel resize) |
| Prior Bot-A | `INCREMENTAL_9248453.md` @ `56c58bb` / content tip `9248453` (merged as `1dbf673`) |
| Scope | Focus **G19 / G07 / G02 / G08 / G11** (CAO Wave4); skim G `635d07a` evidence + G18 shell adjacency |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`); RadioAI-360 worktree absent |

## Verified SHAs

| SHA | Role |
|-----|------|
| `647978c514780a0991d0f5de02f94a0cf9f2e4f1` | `origin/main` tip = audit subject (`merge(bot-c): G11 overview OpenHand`) |
| `2ac1f9bda46f48cdf837d9a4485b7f32308b7ffc` | Bot-C: G11 Navigation overview OpenHand/ClosedHand/PointingHand |
| `ff06590` | merge Bot-B `d7d44c1` (G19 table/paging/quality + G07/G02/G08 + G18 shell) |
| `d7d44c119d2490edc5b3f6735da39f276efc59b7` | Bot-B impl tip |
| `635d07acaf3e60cb83b9649f8993f6d7bc0d59af` | Bot-G evidence pack `qa/web-1dbf673` (no PASS) |
| `1dbf673` / `56c58bb` / `9248453` | Prior main / Bot-A tip / prior audit subject |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map:** G19=AnnotationPanel table/paging/quality · G07=fuller BottomPanel docks · G02=overflow QLabel · G08=bottom height resize · G11=Navigation overview OpenHand · G18=display-summary STFT/palette shell (B adjacency).

## Diff vs prior (`9248453` / `1dbf673` → `647978c`)

1. **B G19** (`d7d44c1`): Qt-ish **table header** (名称/来源/质量/范围) + **paging(200)** + **quality filter/actions** (待判断/已采纳/已忽略 via `replaceMark.reviewStatus`) on BottomPanel + M06MarksPanel. Evidence `BOT_B_G19_TABLE_PAGING.md` + e2e `g19-table-paging-g07-g02-g08-g18.spec.ts` + shot `g19-annotation-table-paging.png`. Residual: full Qt AnnotationPanel column/feature matrix beyond Qt-ish chrome → **not CLOSED**.
2. **B G07** (`d7d44c1`): Fuller AnnotationPanel / DetectionPanel — quality menu + paging wired into annotation dock; detect **table header** + **inspector slots** (engine/stage/params honest empty); status filter. Still **no invented Detect runs**. Evidence `g07-annotation-detection-fuller.png`. Residual: live Detect Worker feeds / full Qt port → **not CLOSED**.
3. **B G02** (`d7d44c1`): Overflow QLabel parity — `overflow-qlabel-stft` **STFT点数** / `overflow-qlabel-palette` **色板** + overflow actions **检测ROI** / **标记**. Evidence `BOT_B` + `g02-overflow-qlabel.png`. Residual: broader SpectrumToolbar/caption chrome nuances (no further B-claimed overflow residual) → **not CLOSED**.
4. **B G08** (`d7d44c1`): Bottom panel height — clamp **100–500**, drag `bottom-panel-resize`, persist `wss.bottomPanelHeight.v1` (prior column 278/390 + side resize retained). Evidence `g08-bottom-height-resize.png` + e2e. Residual: rail collapse-to-min (≥8px) not re-verified this tip → **not CLOSED**.
5. **B G18 adjacency** (`d7d44c1`): Right-rail `display-summary` shows `STFT N {stftN} · {paletteId}` + `PSD N {fft} · —`; PSD mode 驻留帧谱/统计谱 owned C/D (slot em-dash). `BOT_B_G18_OWNERSHIP.md`. → G18 **PARTIAL deepened**, not CLOSED.
6. **C G11** (`2ac1f9b`): `resolveNavigationOverviewCursor` + NavigationChart `data-nav-overview-cursor` — inside=grab, move-drag=grabbing, outside/create=pointer (replaces hard-coded `ew-resize`). Matches desktop Navigation branch. Unit + e2e. Residual: **mark-edge** resize cursors (explicitly out of C scope) → **not CLOSED**.
7. **G evidence** (`635d07a`): `qa/web-1dbf673/` pack documents prior wave (OpenHand axes / Detection全参 / G06 BLOCKED / G19 paint / G07 shell / G02 strip / G08 cols). `ui_parity_pass_claimed: false`. Evidence-only; **no status flip**.

## Verdict summary

| ID | Prior (`9248453`) | Now (`647978c`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (deepened); table/paging/quality NOT | **PARTIAL (deepened)** | table header + paging(200) + quality filter/actions **MET** (`d7d44c1`); full Qt column matrix residual → **not CLOSED** |
| **G07** | PARTIAL (deepened); shell MET | **PARTIAL (deepened)** | fuller docks (quality/paging/detect header+inspector) **MET**; live Detect feeds residual → **not CLOSED** |
| **G02** | PARTIAL (deepened); overflow QLabel NOT | **PARTIAL (deepened)** | overflow STFT点数/色板 (+检测ROI/标记) **MET**; broader chrome residual → **not CLOSED** |
| **G08** | PARTIAL (deepened); bottom height NOT | **PARTIAL (deepened)** | bottom height 100–500 + persist **MET**; collapse-to-min not re-verified → **not CLOSED** |
| **G11** | PARTIAL (deepened); overview OpenHand NOT | **PARTIAL (deepened)** | overview OpenHand/ClosedHand/PointingHand **MET** (`2ac1f9b`); mark-edge residual → **not CLOSED** |
| **G18** | PARTIAL; 参考/动态 MET; PSD/STFT lines thin | **PARTIAL (deepened)** | STFT N · palette shell **MET**; PSD mode still C/D `—` → **not CLOSED** |
| G17 / G06 / G26 | prior | **unchanged** (membership) | G pack affirms BLOCKED docs only |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — AnnotationPanel table/paging/quality — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior paint current/selected/hover + multi-select | MET (retained) | `d54af1b` lineage |
| Qt-ish table header 名称/来源/质量/范围 | **MET** (was NOT) | `bottom-annotation-table-header` / `annotation-table-header` |
| Paging pageSize=200 + prev/next | **MET** | `PAGE_SIZE=200`; `bottom-annotation-paging` |
| Quality filter + 已采纳/已忽略/待判断 actions | **MET** | `reviewStatus` via `replaceMark` |
| Full Qt AnnotationPanel column/feature matrix | **NOT MET** | Bot-B: Qt-ish only; not claimed complete |

Bot-B: `artifacts/validation/ui-parity/bot-b/BOT_B_G19_TABLE_PAGING.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G07 — Bottom AnnotationPanel / DetectionPanel fuller — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior panel shells + D→B handoff | MET (retained) | prior tips |
| Annotation dock quality + paging integration | **MET** | BottomPanel quality menu + paging |
| Detection table header + inspector slots | **MET** | honest empty; no fake DSP runs |
| Live Detect Worker feeds / full Qt port | **NOT MET** | Bot-B: explicitly not claimed |

**Not CLOSED.**

### G02 — Overflow QLabel — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior strip STFT点数/色板/参考·动态 QLabels | MET (retained) | `d54af1b` |
| Overflow menu STFT点数 / 色板 QLabels | **MET** (was NOT) | `overflow-qlabel-stft` / `overflow-qlabel-palette` |
| Overflow 检测ROI / 标记 actions | **MET** | ChartParamStrip overflow actions |
| Broader SpectrumToolbar/caption chrome matrix | **NOT MET** | no further B claim; keep PARTIAL |

**Not CLOSED.**

### G08 — Bottom height resize — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Defaults 278 / 390 + side resize + persist | MET (retained) | prior |
| Bottom height drag clamp 100–500 + persist | **MET** (was NOT) | `bottom-panel-resize`; `wss.bottomPanelHeight.v1` |
| Rail collapse-to-min (≥8px) re-verify | **NOT MET** / not evidenced | ACCEPTANCE fold criterion not re-probed |

**Not CLOSED** (honest: named TOP residual for height is MET, but fold criterion keeps item PARTIAL).

### G11 — Navigation overview OpenHand — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior axis OpenHand/ClosedHand + axis-only pan | MET (retained) | `363744f` / `3535889` |
| Overview window grab / grabbing / pointer | **MET** (was NOT) | `resolveNavigationOverviewCursor`; `2ac1f9b` |
| Mark-edge resize cursors | **NOT MET** | Bot-C STATUS: out of scope |

Bot-C: `artifacts/validation/ui-parity/bot-c/STATUS.md` (`No self-PASS`). **Not CLOSED.**

### G18 — display-summary shell (adjacency) — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| 参考 / 动态 lines | MET (retained) | prior |
| STFT N · palette shell lines | **MET** | RightRail `display-summary` |
| PSD mode 驻留帧谱 / 统计谱 | **NOT MET** | ownership C/D; slot `—` |

**Not CLOSED.**

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — AdaptiveValueEdit / physical Fs / range-ROI chrome; recognition **BLOCKED** (E)
2. **G06 residual** — eye/bitstream/recognition stay BLOCKED; workbench title + interactive STFT (D/F)
3. **G19 residual** — full Qt AnnotationPanel beyond Qt-ish table/paging/quality (B; table landed)
4. **G11 residual** — mark-edge resize cursors (C; overview OpenHand landed)
5. **G18 residual** — PSD mode 驻留帧谱/统计谱 (C/D; STFT/palette shell landed)
6. **G07 residual** — live Detect Worker feeds / full Qt port (B; fuller shell landed)
7. **G02 residual** — broader strip/SpectrumToolbar chrome nuances (B; overflow QLabel landed)
8. **G08 residual** — rail collapse-to-min (≥8px) re-verify *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 / G07 / G02 / G08 / G11 / G18 remain PARTIAL (deepened), not CLOSED. No bucket flips this wave.