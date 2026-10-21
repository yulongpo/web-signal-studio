# INCREMENTAL_9248453 — G19/G02/G08/G07 (Bot-B d54af1b) delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 23:20 Asia/Shanghai |
| Web tip (audit subject) | **`9248453`** = merge Bot-B `d54af1b` over `379fa84` (post-INCREMENTAL_f4c67be) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; `ui/annotations/annotation_panel.cpp` colors; `app/main_window.cpp` resourceWidth/propertyWidth) |
| Prior Bot-A | `INCREMENTAL_f4c67be.md` @ `9862a98` / content tip `f4c67be` |
| Scope | Focus **G19 / G02 / G08 / G07** (CAO residual TOP after f4c67be; B ownership) |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`); RadioAI-360 worktree absent |

## Verified SHAs

| SHA | Role |
|-----|------|
| `9248453b0f58375bd50e93719a6371574c3d0a84` | `origin/main` tip = audit subject (`merge(bot-b): G19 paint/G02 strip/G08 cols/G07 panels`) |
| `d54af1bc0d6505f696124783c90706eeaea950b3` | Bot-B: G19 annotation paint + G02 QLabel + G08 resize + G07 panel shell |
| `379fa84` | Prior main base (merge Bot-A INCREMENTAL_f4c67be `9862a98`) |
| `f4c67be` / `9862a98` | Prior audit subject / Bot-A tip |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map (commit messages):** G19=AnnotationPanel multi-select paint · G02=strip QLabel · G08=column resize · G07=BottomPanel AnnotationPanel+DetectionPanel shell (all Bot-B).

## Diff vs prior (`f4c67be` / `379fa84` → `9248453`)

1. **B G19** (`d54af1b`): Independent **current** `#205d7c` / **selected** `#183f59` / **hover** `#22425a` paint cues (match desktop `annotation_panel.cpp` L156–158). ChartMarkOverlay separates `data-selected` / `data-current` / hover (no longer conflated). M06MarksPanel + BottomPanel AnnotationPanel: checkbox rows, 已选 summary, Ctrl/Meta multi-select, 全选, `data-annotation-paint="desktop-multi"`. Evidence `BOT_B_G19_ANNOTATION_PAINT.md` + e2e `g19-g02-g08-top.spec.ts`. Residual: full Qt table columns / paging / quality menu → **not CLOSED**.
2. **B G02** (`d54af1b`): SpecParamStrip QLabel chrome — live `参考 · 动态` summary + `STFT点数` + `色板` (`chart-strip-qlabel-*`); Aux strip `视图` qlabel. Evidence `BOT_B_G02_STRIP.md`. Residual: deeper overflow-menu QLabel matrix → **not CLOSED**.
3. **B G08** (`d54af1b`): Defaults **278 / 390** retained; **resize handles** `shell-col-resize-left/right`; CSS vars + `data-shell-resizable`; persist `localStorage wss.shellColumns.v1`; clamp 190–450 / 320–650 matches desktop `bindPanelResize` / settings. Evidence `BOT_B_G08_COLUMNS.md`. Residual: bottom-panel height resize not in tip → **not CLOSED**.
4. **B G07** (`d54af1b`): BottomPanel AnnotationPanel + DetectionPanel **shell** under B ownership (post-D handoff). Annotation dock: multi-select paint + select-all + `data-panel-shell="annotation-panel"`. Detection dock: 运行/详情 columns, honest empty run list, **disabled** refresh/cancel (no fake DSP), `data-panel-shell="detection-panel"`. Evidence `BOT_B_G07_BOTTOM.md`. Residual: full Qt table/paging/quality + live Detect Worker feeds → **not CLOSED**.

## Verdict summary

| ID | Prior (`f4c67be`) | Now (`9248453`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G19** | PARTIAL (deepened); multi-select paint NOT MET | **PARTIAL (deepened)** | current/selected/hover paint **MET** (`d54af1b`); Qt table/paging/quality residual → **not CLOSED** |
| **G02** | PARTIAL (deepened); strip QLabel residual | **PARTIAL (deepened)** | Spec/Aux QLabel chrome **MET** (`d54af1b`); overflow QLabel matrix residual → **not CLOSED** |
| **G08** | PARTIAL; 278/390 MET, resize NOT | **PARTIAL (deepened)** | column resize + persist **MET** (`d54af1b`); bottom height residual → **not CLOSED** |
| **G07** | PARTIAL (handoff→B); dock hosts | **PARTIAL (deepened)** | Annotation+Detection panel shell **MET** (`d54af1b`); full Qt panel port residual → **not CLOSED** |
| G11 / G17 / G06 / G18 / G26 | prior | **unchanged** (membership) | no status flip from B tip |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G19 — AnnotationPanel multi-select paint — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior CN chrome / tree API / multi-select hooks | MET (retained) | `487d04d` lineage @8733cc1 |
| Independent current / selected / hover colors | **MET** (was NOT) | CSS `#205d7c` / `#183f59` / `#22425a`; desktop `annotation_panel.cpp` |
| Chart overlay selected≠current | **MET** | `ChartMarkOverlay` `data-selected` / `data-current` / hover |
| List checkbox + 已选 summary + Ctrl multi + 全选 | **MET** | `M06MarksPanel` + BottomPanel; `data-annotation-paint="desktop-multi"` |
| Full Qt table columns / paging / quality menu | **NOT MET** | Bot-B: explicitly not claimed |

Bot-B: `artifacts/validation/ui-parity/bot-b/BOT_B_G19_ANNOTATION_PAINT.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G02 — Spec strip QLabel — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior strip captions / physical caption pair | MET (retained) | prior tips |
| STFT点数 / 色板 / 参考·动态 QLabel chrome | **MET** (was NOT) | `ChartParamStrip` SpecParamStrip + Aux `视图` |
| Deeper overflow-menu QLabel matrix | **NOT MET** | Bot-B residual note |

Bot-B: `BOT_B_G02_STRIP.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G08 — Column widths + resize — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Defaults 278 / 390 | MET (retained) | prior @425cb40 |
| Drag resize handles | **MET** (was NOT) | `shell-col-resize-left/right`; App.tsx |
| Persist + clamp 190–450 / 320–650 | **MET** | `wss.shellColumns.v1`; matches desktop `main_window.cpp` |
| Bottom panel height resize | **NOT MET** | Bot-B: not in this tip |

Bot-B: `BOT_B_G08_COLUMNS.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G07 — Bottom AnnotationPanel / DetectionPanel shell — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior dock hosts + D→B handoff | MET / ownership B (retained) | `e3b86f0` handoff |
| AnnotationPanel shell (paint + select-all) | **MET** | BottomPanel `data-panel-shell="annotation-panel"` |
| DetectionPanel shell (运行/详情; disabled refresh/cancel) | **MET** | honest empty; no fake DSP |
| Full Qt table / paging / quality / live Detect feeds | **NOT MET** | Bot-B: not claimed |

Bot-B: `BOT_B_G07_BOTTOM.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — AdaptiveValueEdit / physical Fs / range-ROI chrome; recognition **BLOCKED** (E)
2. **G06 residual** — eye/bitstream/recognition stay BLOCKED; workbench title + interactive STFT (D/F)
3. **G19 residual** — full Qt AnnotationPanel table columns / paging / quality menu (B; paint landed)
4. **G11 residual** — Navigation overview OpenHand + mark-edge cursors (C; axis OpenHand landed)
5. **G18 residual** — PSD N / STFT N / palette summary lines (B/C)
6. **G07 residual** — full Qt AnnotationPanel / DetectionPanel port beyond shell (B; shell landed)
7. **G02 residual** — deeper overflow-menu QLabel matrix (B; strip QLabels landed)
8. **G08 residual** — bottom-panel height resize *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G19 / G02 / G08 / G07 remain PARTIAL (deepened), not CLOSED.