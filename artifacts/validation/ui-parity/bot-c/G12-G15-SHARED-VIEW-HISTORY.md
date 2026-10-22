# Bot-C tip — G12/G15 shared main-view history (broadband residual; no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 08:40 |
| Base | `b72c2fd` = `b72c2fdd8f3f7014b728df0f3848571b4bb7ac0d` |
| Branch | `work/bot-c-charts` |
| Desktop ref | `17471a6` Session::canBack/canForward + PlotWidget contextBack/Forward |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |

## Decision

**TIP_CODE** — only G12/G15 dual-stack residual was landable without inventing.

## Priority scan (CAO order)

| ID | Decision | Why |
|----|----------|-----|
| **G09** | no code | physical-view bind already PARTIAL (WAVE-D4 / e6bdd01); `qa/web-ce29329` shot floor present; optional MET gate would invent pixel budget — keep PARTIAL |
| **G11** | no code | axis-only pan + OpenHand/ClosedHand already in `@wss/charts` chartHitZone + HeatmapCanvas desktop-axis + tests citing 17471a6; no further desktop-specified delta without invent polish |
| **G12/G15** | **LANDED** | MenuBar + chart context used dual stacks (uiStore.viewHistory vs MainChartHost local historyRef). Desktop session_.back/forward is one stack. Unified onto store mainViewPast/Future + restore seq |
| **G13** | no code | Ctrl/Shift multi-select + 8 handles already in ChartMarkOverlay (backticks=16); further handle polish not desktop-delta-specified this wave |

G03/G04 out of steering priority (B shell / already PARTIAL hosts).

## Code delta (G12/G15)

- `apps/web/src/store/uiStore.ts` — mainViewPast/Future/Current/Restore* + commitMainViewChange / mainViewBack / mainViewForward / resetMainViewHistory (cap 40, desktop maximumHistory)
- `apps/web/src/components/MainChartHost.tsx` — remove local history refs; onViewCommit → store; context 视图后退/前进 → store; restore effect applies viewCommand + syncs navWindowTime (recordHistory: false)
- `apps/web/src/components/MenuBar.tsx` — Alt+Left/Right + 视图后退/前进 prefer mainView stack; fall back to nav-only viewHistory when main stack empty (nav-drag bridge residual)

Stamps: `data-g12-g15-shared-history="true"` on menu + chart context back/forward.

## Fence

- No G16 enable-matrix invent
- No ChartMarkOverlay backtick/${} strip
- No fake PASS / CLOSED claim — G12/G15 remain **PARTIAL** (nav-drag → mainView commit bridge still soft; aux ranges not in snap vs full desktop ViewSnapshot)

## Checks

- `npm run typecheck` (web workspace) — pass
