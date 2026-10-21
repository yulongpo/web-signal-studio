# Bot-C G11 mark body-drag ClosedHand STATUS (WIP — do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 00:02 |
| Base tip | 91ae551 (91ae5511d1e3668fd0b1a90c55de0b4ef10634e9) |
| Branch | work/bot-c-charts |
| Scope | **G11** selected-mark **body-drag ClosedHand** (residual after 8-handle MET) |
| Out of scope | Edge resize cursors (already MET); G18 PSD series (Bot-D); Bot-B chrome |
| Desktop ref | signal_studio_rebuild @ 17471a6 PlotWidget::updateHover + MarkEdit Move |
| Push | tip on origin/work/bot-c-charts |

## Desktop audit (17471a6)

`ui/charts/plot_widget.cpp`:

| State | Qt cursor | CSS |
|-------|-----------|-----|
| Hover selected mark body (`hit.edges == Move`) | `SizeAllCursor` via `edgeCursor(Move)` | `move` |
| Drag MarkEdit + `edges == Move` | `ClosedHandCursor` | `grabbing` |
| Edge/corner handles | SizeFDiag/BDiag/Hor/Ver | resize cursors (unchanged) |

CAO wording "OpenHand hover" maps here to desktop **SizeAll** on Move hit (not axis OpenHand). Honest: hover stays `move`, drag is ClosedHand `grabbing`.

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G11 body-drag ClosedHand | `applyMarkBodyDelta` + overlay body pointer capture; `draggingMove` → `grabbing`; `data-g11-body-drag` / `data-body-dragging` | Bounds clamp vs full file range not fully parity'd; unselected mark still PointingHand-only until selected |
| G11 8-handle | Prior tip MET; preserved (`stopPropagation` on handles) | — |

## Evidence
- packages/charts/src/interaction/chartHitZone.ts (`resolveMarkEdgeCursor` draggingMove)
- packages/charts/src/interaction/chartHitZone.test.ts
- apps/web/src/components/chartGesture.ts (`applyMarkBodyDelta`)
- apps/web/src/components/chartGesture.test.ts
- apps/web/src/components/ChartMarkOverlay.tsx
- apps/web/src/App.css (`data-body-dragging`)
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ docs dual-write)

## Tests
- charts unit: resolveMarkEdgeCursor move / draggingMove (19 passed)
- web unit: applyMarkBodyDelta keeps span (5 passed)

**No self-PASS.**