# Bot-C G11 mark-edge + G18 PSD mode STATUS (WIP ? do not self-claim PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 23:55 |
| Base tip | 98d858d (CAO wave5; origin/main after INCREMENTAL_647978c) |
| Branch | work/bot-c-charts |
| Scope | **G11 mark-edge** cursors (8 handles); **G18** PSD mode UI slot eval/驻留帧谱/统计谱 |
| Out of scope | Bot-D frame vs statistical PSD **series** computation; Bot-B STFT/palette chrome |
| Desktop?? | signal_studio_rebuild @ 17471a6 PlotWidget::edgeCursor / handles; narrowband_workspace 驻留帧谱/统计谱 |
| Push | tip on origin/work/bot-c-charts |

## Desktop audit (17471a6)

`ui/charts/plot_widget.cpp` `edgeCursor` + `handles` (8 points):

| edges | Qt cursor | CSS |
|-------|-----------|-----|
| Left\|Top or Right\|Bottom | SizeFDiagCursor | nwse-resize |
| Right\|Top or Left\|Bottom | SizeBDiagCursor | nesw-resize |
| Left\|Right | SizeHorCursor | ew-resize |
| Top\|Bottom | SizeVerCursor | ns-resize |
| Move | SizeAllCursor / ClosedHand while drag | move / grabbing |

Prior tip only had 4 corners all hard-coded `nwse-resize` (honest gap called out in overview OpenHand STATUS).

## G18 eval (charts vs DSP)

| Piece | Owner | This tip |
|-------|-------|----------|
| display-summary PSD mode label (驻留帧谱/统计谱) | **Bot-C** UI slot | Wired via `narrowbandPsdMode` + `data-psd-mode` |
| Narrowband toolbar mode select | **Bot-C** UI slot | `nb-select-psd-mode` |
| STFT N / palette / ?? / ?? | Bot-B (already) | unchanged |
| Frame PSD vs statistical PSD **series** / pinned-frame dwell | **Bot-D** DSP | **Handoff** ? UI does not invent spectrum data |
| DetectionCard spectrumMode (???/???/?) | Bot-E detect card | Not G18 display PSD |

## Landed (honest)

| ID | Landed | Known gap / note |
|----|--------|------------------|
| G11 mark-edge | `resolveMarkEdgeCursor` + 8 handles on current mark; CSS per-edge; `data-g11-mark-edge`; `data-mark-edge-cursor` | Mark **body** drag-to-move / ClosedHand while resize not fully parity'd; hover hit without selecting current still PointingHand-only path |
| G18 PSD mode slot | uiStore `narrowbandPsdMode`; RightRail label; NB select | Switching mode does **not** change observe PSD series yet (Bot-D) |

## Evidence
- packages/charts/src/interaction/chartHitZone.ts (`resolveMarkEdgeCursor`)
- packages/charts/src/interaction/chartHitZone.test.ts
- apps/web/src/components/ChartMarkOverlay.tsx
- apps/web/src/App.css (per-edge handle cursors)
- apps/web/src/store/uiStore.ts / types/provisional.ts
- apps/web/src/components/RightRail.tsx / NarrowbandWorkspace.tsx
- artifacts/validation/ui-parity/bot-c/G18-PSD-MODE-HANDOFF.md
- artifacts/validation/ui-parity/bot-c/STATUS.md (+ docs dual-write)

## Tests
- charts unit: resolveMarkEdgeCursor corners/edges/move

**No self-PASS.**
