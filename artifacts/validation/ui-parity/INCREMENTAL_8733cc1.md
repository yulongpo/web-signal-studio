# INCREMENTAL_8733cc1 — G17/G19/G11 (E+B+C) delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 23:00 Asia/Shanghai |
| Web tip (audit subject) | **`8733cc1`** = merge Bot-C G11 `3535889` over Bot-E G17 `ecee9a2`/`8bf1390` over Bot-B G19 `487d04d` (base `ee64b70`/`23412f2`) |
| Desktop | **`17471a6`** (`rebuild/a143-native`; PlotWidget `zoneAt` + `ui/detection/detection_card.*` + `project_tree_presentation.h`) |
| Prior Bot-A | `INCREMENTAL_425cb40.md` @ `83cdbf4` / content tip `425cb40` |
| Scope | Focus **G17 / G19 / G11** (CAO residual TOP after 425cb40); membership skim only |
| Rule | Read-only on implementation; **no matrix PASS**; screenshots alone never CLOSE |
| Machine | HH-laptop (`D:\project\_wt_bot_a_audit`); RadioAI-360 worktree absent |

## Verified SHAs

| SHA | Role |
|-----|------|
| `8733cc10d77e8a17077d398c0d9ef9a4c07139ee` | `origin/main` tip = audit subject (`merge(bot-c): G11 axis-only pan`) |
| `e0e83d5` / `ecee9a2` / `8bf1390` | Bot-E: G17 DetectionCard selectable `.engine` + evidence stamp |
| `23412f2` / `487d04d` | Bot-B: G19 CN tree chrome |
| `3535889` | Bot-C: G11 axis-only pan (`hitChartZone`) |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip (unchanged) |

**ID map (commit messages, not the CAO brief swap):** G17=DetectionCard (E) · G19=CN tree chrome (B) · G11=axis-only pan (C).

## Diff vs prior (`425cb40` → `8733cc1`)

1. **B G19** (`487d04d` / `23412f2`): ProjectTree CN presentation overlay — section headers, badge chips, `relationText` Chinese, folder glyphs, active/selection/hover, mark checkbox + Ctrl/Meta/Shift multi-select, `data-presentation="desktop-cn-chrome"`. Evidence `BOT_B_G19_CN_CHROME.md` + e2e `g19-cn-tree-chrome.spec.ts`. **matrix_pass_claimed: false**.
2. **E G17** (`8bf1390` / `ecee9a2` / `e0e83d5`): `detection-card` + `detection-engine-select`; inventory `data-selectable`; spectrum mode / time strategy / split-bursts / draft-preflight-summary / phase bar; local-compute honors `params.modelId`/`enginePath` under model roots; `.pth` non-selectable (G26). Evidence `G17_DETECTION_CARD_INDEX.md`. Recognition stays **BLOCKED**.
3. **C G11** (`3535889` / `8733cc1`): `hitChartZone` + `resolvePointerDragMode` mirror desktop `zoneAt`; under `wheelModel=desktop-axis`, plot-body pan disabled (navigate stays zoom-box); axes pan-x/pan-y; `data-axis-only-pan=true`. Unit + e2e. OpenHandCursor CSS residual noted by Bot-C.

## Verdict summary

| ID | Prior (`425cb40`) | Now (`8733cc1`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G17** | PARTIAL (deepened); DetectionCard + selectable `.engine` NOT MET | **PARTIAL (deepened)** | selectable `.engine` + DetectionCard chrome **MET**; full Qt param grid NOT; recognition **BLOCKED** — **not CLOSED** |
| **G19** | PARTIAL (deepened); CN relation/glyphs/multi-select NOT MET | **PARTIAL (deepened)** | CN chrome / glyphs / multi-select / relationText **MET**; full Qt AnnotationPanel paint residual — **not CLOSED** |
| **G11** | PARTIAL (deepened); axis-only pan NOT MET | **PARTIAL (deepened)** | axis-only pan under `desktop-axis` **MET**; OpenHandCursor / uniform HeatmapDemo legacy residual — **not CLOSED** |
| G18 / G02 / G07 / G08 / G06 / G26 | prior | **unchanged** (membership) | no status flip from B/E/C tips |
| G05 / G14 | CLOSED | **CLOSED** | unchanged |
| G25 | DOCS | **DOCS** | unchanged |

**Counts (membership-normalized, unchanged bucket sizes):** OPEN **7** · PARTIAL **16** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G09–G10, G16, G21–G24
- PARTIAL: G01, G02–G04, G06, G07, G08, G11–G13, G15, G17, G18, G19–G20, G26
- CLOSED: G05, G14

## Focus detail

### G17 — Detect / DetectionCard / `.engine` — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior inventory/cancel/precheck | MET (retained) | `59f9820` lineage @425cb40 |
| Selectable `.engine` picker | **MET** (was NOT) | `DetectPage.tsx` `detection-engine-select`; inventory `data-selectable`; `8bf1390` |
| `.pth` blocked (G26) | **MET** | `data-selectable=false`; never in select options |
| DetectionCard chrome (profile/strategy/phase) | **MET** (was NOT) | spectrum mode, time strategy, split-bursts, draft/preflight/summary, 5-step phase bar; `data-testid="detection-card"` |
| Pipeline honors selected engine | **MET** | `pipeline.py` + `test_selected_engine.py` |
| Full Qt DetectionCard parameter grid | **NOT MET** | hop/noise/edge/smooth/minOn/Off etc. residual (Bot-E) |
| Narrowband recognition | **BLOCKED** | honest; no fake package |

Bot-E: `docs/acceptance/evidence/bot-e/G17_DETECTION_CARD_INDEX.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G19 — Project tree CN chrome — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior F API + tooltip/title/unread wire | MET (retained) | @425cb40 / `0eabe56` |
| CN section headers / badge chips | **MET** (was NOT) | Chinese sections/badges (`487d04d`) |
| Relation tooltips → desktop `relationText` | **MET** (was NOT) | `ProjectTree.tsx` overlay |
| Folder/section glyphs + active/selection/hover | **MET** (was NOT) | App.css + ProjectTree |
| Mark checkbox + Ctrl/Meta/Shift multi-select | **MET** (was NOT) | M06 `setSelection`; e2e |
| `data-presentation="desktop-cn-chrome"` | **MET** | ProjectTree |
| Full Qt AnnotationPanel multi-select paint | **NOT MET** | Bot-B explicit residual |

Bot-B: `artifacts/validation/ui-parity/bot-b/BOT_B_G19_CN_CHROME.md` (`matrix_pass_claimed: false`). **Not CLOSED.**

### G11 — Navigate / axis-only pan — **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Prior navigate→zoom-box + both-edges ≥8px | MET (retained) | `5de2e6b` |
| Axis-only pan (`desktop-axis`) | **MET** (was NOT) | `chartHitZone.ts` / `HeatmapCanvas.tsx`; plot-body no pan-both; axes pan-x/pan-y; `data-axis-only-pan=true` (`3535889`) |
| Middle-button pan | **N/A on desktop 17471a6** | retained |
| OpenHandCursor on axes | **NOT MET** | Bot-C STATUS residual |
| `uniform` + gesture pan HeatmapDemo legacy | **out of G11 desktop path** | does not block desktop-axis host |

Bot-C: `artifacts/validation/ui-parity/bot-c/STATUS.md` (WIP / no PASS). **Not CLOSED.**

## TOP residual (max 8, parallel-friendly)

1. **G17 residual** — full Qt DetectionCard parameter grid (timing/thresholds/branches); recognition **BLOCKED** (E)
2. **G06 residual** — eye/recognition/bitstream beyond BLOCKED; workbench title + interactive STFT (F/D)
3. **G19 residual** — full Qt AnnotationPanel multi-select paint parity (B; CN chrome landed)
4. **G11 residual** — OpenHandCursor CSS on axes (C; axis-only pan landed)
5. **G18 residual** — PSD N / STFT N / palette summary lines (B/C)
6. **G07 residual** — full Qt AnnotationPanel / DetectionPanel port (D)
7. **G02 residual** — deeper overflow / strip QLabel parity (B)
8. **G08 residual** — column resize + saved UI state *(or G09/G16 OPEN)*

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G17 / G19 / G11 remain PARTIAL (deepened), not CLOSED.
