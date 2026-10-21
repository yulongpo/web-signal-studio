# Bot-C G11 overview OpenHand STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 23:30 |
| Base tip | 9248453 (CAO implement tip; includes prior axis OpenHand via 46fb64f) |
| Branch | work/bot-c-charts |
| Scope | G11 **overview OpenHand** (Navigation 窗光标残): grab inside overview window, grabbing while move-drag, pointer outside / create-drag |
| Out of scope | HeatmapCanvas axis cursors (already on main); G18 Bot-B chrome; mark-edge resize cursors |
| Desktop对照 | signal_studio_rebuild @ 17471a6 PlotWidget::updateHover Kind::Navigation |
| Push | tip on origin/work/bot-c-charts |

## Desktop audit (17471a6)

`ui/charts/plot_widget.cpp` Navigation branch:

```
setCursor(gesture_ && gesture_->navigationInside && gesture_->changed
              ? Qt::ClosedHandCursor
          : navigationWindow().contains(point) ? Qt::OpenHandCursor
                                               : Qt::PointingHandCursor);
```

CSS map: OpenHand→grab, ClosedHand→grabbing, PointingHand→pointer.

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G11 overview OpenHand | `resolveNavigationOverviewCursor` + NavigationChart `style.cursor` / `data-nav-overview-cursor` / `data-interaction-cursor`. Inside=grab, move-drag=grabbing, outside/create=pointer. Replaces prior hard-coded `ew-resize`. | Edge SizeHor on overview window not present on desktop Navigation either. HeatmapCanvas axis OpenHand unchanged. |
| G11 axis OpenHand | Prior (on main @ 46fb64f / 363744f). | — |
| G11 axis-only pan / box-zoom | Prior (on main). | — |

## Evidence
- packages/charts/src/interaction/chartHitZone.ts (`resolveNavigationOverviewCursor`)
- packages/charts/src/react/NavigationChart.tsx
- packages/charts/src/interaction/chartHitZone.test.ts
- apps/web/e2e/chart-gestures.spec.ts (nav overview cursor)
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ docs dual-write)

## Tests
- charts unit: resolveNavigationOverviewCursor OpenHand/ClosedHand/PointingHand
- e2e: navigation-chart data-nav-overview-cursor grab inside window

**No self-PASS.**
