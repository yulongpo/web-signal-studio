# Bot-C G11 axis-only pan STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 22:55 |
| Base tip | 23412f2 (origin/main; CAO bump — finish then rebase) |
| Branch | work/bot-c-charts |
| Scope | G11 **axis-only pan** (A residual): pan restricted to axis regions; plot-body stays zoom-box under navigate |
| Out of scope | G18 display-summary / Bot-B chrome; middle-button pan (N/A on desktop 17471a6) |
| Desktop对照 | signal_studio_rebuild @ 17471a6 PlotWidget + chart_feedback::zoneAt |
| Push | tip on origin/work/bot-c-charts |

## Desktop audit (17471a6)

Main Kind mousePress:
- Zone::YAxis / XAxis → PanFrequency / PanTime (one-axis pan)
- Zone::Plot (default) → Tool::ZoomBox (never pan-both on plot body)
- Tips: axis「拖动平移」; plot「拖动矩形放大」
- zoneAt: plot interior; XAxis below plot within x-span; YAxis left of plot within y-span; corners = None

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G11 axis-only pan | `hitChartZone` + `resolvePointerDragMode` mirror desktop zones. Under `wheelModel=desktop-axis`, plot+gesture pan → no drag; axes still pan-x/pan-y; navigate plot-body remains zoom-box. `data-axis-only-pan=true`. Unit + e2e axis-drag coverage. | `uniform` + gesture pan still allows legacy plot pan-both (HeatmapDemo). Corner / outer-margin hits are none (desktop). No open-hand axis cursor CSS yet (desktop OpenHandCursor). |
| G11 box-zoom | Prior: both edges >=8 via `isBoxZoomLargeEnough` (already on main). | — |
| G02 caption | Prior physical caption units (already on main). | Bot-B strip chrome still out of scope. |

## Evidence
- packages/charts/src/interaction/chartHitZone.ts (+ unit tests)
- packages/charts/src/react/HeatmapCanvas.tsx
- apps/web/e2e/chart-gestures.spec.ts (axis drag pans only that axis)
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ docs dual-write)

## Tests
- charts unit: chartHitZone + prior viewTransform / physicalCaption
- typecheck charts + web
- e2e: axis-only pan case added (may not re-run full suite this tip)

**No self-PASS.**
