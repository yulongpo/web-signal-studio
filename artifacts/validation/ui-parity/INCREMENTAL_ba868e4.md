# INCREMENTAL_ba868e4 — multi-lane delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 22:30 Asia/Shanghai |
| Web tip | **`ba868e4`** = `cf1b3f8` (F G19 + E G17) + Bot-B **`15022b5`** + Bot-D **`d925a2e`** + Bot-C **`c650273`** |
| Desktop | **`17471a6`** (`rebuild/a143-native`) |
| Prior Bot-A | `INCREMENTAL_23c38d0.md` @ `c63f1de`; unpushed `INCREMENTAL_cf1b3f8` draft **abandoned/replaced** per CAO |
| Scope | Focus **G06 / G07 / G11 / G13 / G14 / G17 / G19 / G02**; other IDs only if clearly affected |
| Rule | Read-only; **no matrix PASS**; screenshots alone never CLOSE |

## Verified SHAs (on `ba868e4`)

| SHA | Role |
|-----|------|
| `ba868e4895bd6170cfa91d3642fe0dd516686242` | `origin/main` tip |
| `c6502736392b0317a1793b2e607a9d4c57fcd472` | Bot-C G11/G14/G02/G13 charts |
| `d925a2e782e7441edea748b5c968e155bcefbc4a` | Bot-D G06 mod/demod DDC hooks |
| `15022b5e4c4013009e073d2aca9be6911e4e281d` | Bot-B G07/G06 chrome/G02 captions/G19 tree UI |
| `a61046dc70d69fbe54f92dffb1a5a2bae85056c0` | Bot-E G17 REAL_RUNTIME honesty |
| `733bde4d20b8ceaf0a2f7c116db6cd55c41eb369` / `d5cea47…` | Bot-F G19 engineering-tree API |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |

## Verdict summary

| ID | Prior (`23c38d0`) | Now (`ba868e4`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G14** | PARTIAL (near-exit) | **CLOSED** | Header Detection ROI + `select` no longer writes ROI; confirm bar retained |
| **G17** | OPEN | **PARTIAL** | REAL_RUNTIME/TRT honesty + engine chips; DetectionCard / `.engine` picker still open |
| **G07** | OPEN | **PARTIAL** | BottomPanel 29/150 + tasks/log; full Annotation/Detection dock hosts residual |
| **G06** | PARTIAL | **PARTIAL (deepened)** | Page chrome + mod/demod DDC previews; recognition/eye/bitstream BLOCKED; STFT interact residual |
| **G02** | PARTIAL | **PARTIAL (deepened)** | Strip captions + `chart-physical-caption`; f9f05bb overflow focus residual |
| **G11** | PARTIAL | **PARTIAL (deepened)** | navigate→zoom-box + nav click keeps span; axis-only / middle-button pan residual |
| **G13** | PARTIAL | **PARTIAL (deepened)** | Four corner handles + continuous-create; M06 undo sync / waterfall CSS residual |
| **G19** | PARTIAL | **PARTIAL (deepened)** | ProjectTree maps engineeringTree + mark select/soft-delete; full desktop tree residual |

**Counts (membership-normalized):** OPEN **9** · PARTIAL **14** · CLOSED **2** (G05, **G14**) · DOCS **1** (G25). **No PASS.**

- OPEN: G08–G10, G16, G18, G21–G24  
- PARTIAL: **G01**, **G02**–G04, **G06**, **G07**, **G11**–G13, **G15**, **G17**, **G19**–G20, G26  
- CLOSED: G05, **G14**

## Focus detail

### G14 — Detection ROI → **CLOSED**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Independent `detection-roi` tool + confirm bar | MET (prior) | `detection-roi-confirmation` / Enter/Esc / no auto-run |
| Header 「检测 ROI」 | **MET** | `ChartParamStrip` `data-testid="btn-header-detection-roi"` (`c650273`) |
| Retire `select` as ROI writer | **MET** | `MainChartHost`: only `detection-roi` writes confirm; `select` → note “retired” |
| MenuBar / NavChrome / overflow entry | **MET** | remap to `detection-roi` (`c650273`) |

Residual noted (does **not** block CLOSED): `ActiveTool` union may still list `select` as provisional type. Bot-C STATUS: WIP / no PASS — audit CLOSED is criterion-based, **not** matrix PASS.

Evidence: `apps/web/src/components/MainChartHost.tsx`, `ChartParamStrip.tsx`, `artifacts/validation/ui-parity/bot-c/STATUS.md`, `apps/web/e2e/chart-gestures.spec.ts`.

### G17 — Detect/engine → **PARTIAL** (was OPEN)

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| REAL_RUNTIME engine-agnostic + TENSORRT_OK | **MET** | `a61046d`; `docs/acceptance/evidence/bot-e/g17_*.json` |
| DetectPage engine / tensorrtVerified chips | **MET** | `detect-runtime-engine`, `detect-tensorrt-verified`, `detect-real-runtime` |
| Engine/model **picker** (desktop `model_`) | **NOT MET** | display-only chip; no selectable `.engine` |
| DetectionCard field parity | **NOT MET** | still FFSCN/SCN gate + run; not card port |

Bot-E `matrix_pass_claimed: false`. Screenshots never CLOSE.

### G07 — Bottom panel → **PARTIAL** (was OPEN)

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Tabs 标记/任务/日志 + 29px collapse / ~150 open | **MET (chrome)** | `BottomPanel.tsx` testids `bottom-panel`, `bottom-tabs`, `bottom-toggle`, panes |
| Task progress honest (no fake %) | **MET (honesty)** | `bottom-task-*`; Bot-B WIP note |
| Log strip | **MET** | `bottom-log-strip` |
| Full AnnotationPanel / DetectionPanel dock hosts | **NOT MET** | Bot-B: “full hosts remain partial” |

Evidence: `apps/web/src/components/BottomPanel.tsx`, `artifacts/validation/ui-parity/bot-b/BOT_B_G07_BOTTOM.md`, `g07-bottom-*.png` (shots ≠ CLOSE).

### G06 — Narrowband → **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Observe-page real DDC | MET (prior) | unchanged |
| Mod / DL / demod **control chrome** | **MET** | `15022b5` NarrowbandWorkspace; Bot-B G06 md + pngs |
| Mod constellation/STFT + demod AM/FM/RMS DDC hooks | **MET (preview)** | `d925a2e` `narrowbandModulationDdc.ts`, `narrowbandDemodDdc.ts`, chart components |
| Eye / DL recognition / bitstream | **BLOCKED (honest)** | `narrowbandPageDspContracts.ts` typed BLOCKED |
| Workbench title / channel-linked interactive STFT | **NOT MET** | Bot-B/D residuals |

Item **not CLOSED**. No PASS.

### G02 — Captions / chrome → **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Strip captions nav/aux/main | **MET** | `chart-strip-caption-*` (`15022b5`) |
| Charts physical caption live ranges | **MET** | HeatmapCanvas `chart-physical-caption` (`c650273`) |
| Level 参考/动态 (prior) | MET (prior) | unchanged |
| Kill aux≠main SpectrumToolbar / f9f05bb overflow focus | **NOT MET** | toolbar still `data-variant=chart-header`; Bot-B/C residuals |

### G11 — Navigate box-zoom → **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| `navigate` → HeatmapCanvas `zoom-box` (≥8px) | **MET** | `MainChartHost` gesture map (`c650273`) |
| Nav click outside keeps span | **MET** | NavigationChart `data-nav-click-keeps-span` |
| Axis-only pan / middle-button pan | **NOT MET** | Bot-C known gap |

### G13 — Mark handles → **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Four corner handles + live resize | **MET** | `ChartMarkOverlay.tsx` (`c650273`) |
| Continuous-create while marker | **MET** | `data-continuous-create` |
| Ctrl/Shift multi-select | MET (prior+) | retained |
| Waterfall mark CSS / deeper list sync | residual | Bot-C STATUS |

### G19 — Project tree → **PARTIAL (deepened)**

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| engineering-tree three-source API | MET (`733bde4`) | prior F tip |
| ProjectTree maps `engineeringTreeFromSession` / mark select / soft-delete | **MET (UI wire)** | `ProjectTree.tsx` (`15022b5`); SAMPLE_TREE removed |
| Full desktop presentation parity (badges/relations/compact detail) | **NOT MET** | Bot-B G19 WIP / NOT PASS |

Evidence: `BOT_B_G19_TREE.md`, `g19-project-tree.png`, `e2e/g19-project-tree.spec.ts`.

## Other gaps

No status flip claimed for G01, G03–G05, G08–G10, G12, G15–G16, G18, G20–G26 beyond notes above. G12 unchanged PARTIAL. G26 unchanged PARTIAL (engine picker still open → overlaps G17).

## TOP OPEN (max 8, parallel-friendly)

1. **G17 residual** — DetectionCard fields + selectable `.engine` picker (Bot-E/B; overlaps G26)  
2. **G06 residual** — recognition/eye/bitstream beyond BLOCKED; workbench title + channel-linked interactive STFT (Bot-D/B)  
3. **G02 residual** — retire aux≠main SpectrumToolbar habit; f9f05bb overflow focus parity (Bot-B/C)  
4. **G07 residual** — AnnotationPanel / DetectionPanel full bottom hosts (Bot-B)  
5. **G11 residual** — axis-only / middle-button pan semantics (Bot-C)  
6. **G08** — left/right column widths vs desktop 278/390 (layout; OPEN)  
7. **G19 residual** — desktop badge/relation/compact-detail presentation (Bot-B on F API)  
8. **G18** — display/channel page fill + 参考/动态 summary copy (OPEN; Level layer already on G02)

## Explicit

**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G14 CLOSED ≠ matrix PASS. G17/G06/G02/G07/G11/G13/G19 not CLOSED.
