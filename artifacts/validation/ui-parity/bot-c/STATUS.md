# Bot-C G11 OpenHandCursor STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 23:10 |
| Base tip | 97fc7c0 (origin/main; CAO FYI rebase target) |
| Branch | work/bot-c-charts |
| Scope | G11 **OpenHandCursor** (axis pan cursor residual): open-hand on axis hover, closed-hand while axis pan drag; plot ZoomBox keeps crosshair |
| Out of scope | G18 display-summary / Bot-B chrome; Navigation-kind overview hand cursor |
| Desktop对照 | signal_studio_rebuild @ 17471a6 chart_feedback::cursor + PlotWidget updateCursor |
| Push | tip on origin/work/bot-c-charts |

## Desktop audit (17471a6)

ui/charts/interaction_feedback.h:
- pan → Qt::ClosedHandCursor
- selecting || Zone::Plot → Qt::CrossCursor
- Zone::XAxis / YAxis → Qt::OpenHandCursor
- else → Qt::ArrowCursor

CSS map: OpenHand→grab, ClosedHand→grabbing, Cross→crosshair, Arrow→default.

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G11 OpenHandCursor | 
esolveInteractionCursor mirrors desktop feedback. HeatmapCanvas sets style.cursor + data-interaction-cursor from hit zone + drag mode under desktop-axis. Axis hover=grab, axis pan drag=grabbing, plot=crosshair. | Navigation overview window OpenHand (Kind::Navigation) not in HeatmapCanvas scope. Mark-edge resize cursors not owned here. |
| G11 axis-only pan | Prior (on main). | — |
| G11 box-zoom | Prior (on main). | — |

## Evidence
- packages/charts/src/interaction/chartHitZone.ts (
esolveInteractionCursor)
- packages/charts/src/react/HeatmapCanvas.tsx
- packages/charts/src/interaction/chartHitZone.test.ts
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ docs dual-write)

## Tests
- charts unit: resolveInteractionCursor OpenHand/ClosedHand cases
- typecheck charts (if run)

**No self-PASS.**
