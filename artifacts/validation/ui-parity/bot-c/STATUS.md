# Bot-C short tip — G18 multi-chart linked-cursor (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:08 |
| Base tip | 69c4efe |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 LinkedCursorState / pinAt / updateLinkedCursors |
| Self-check | ChartMarkOverlay backticks preserved; HeatmapCanvas backticks not reduced |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G18 linkedCursor store | pin/clear + dim-merge | desktop Session contract |
| G18 Main↔Aux sync | HeatmapCanvas pin + WaveformChart linkedX | data-g18-linked-cursor |
| G18 clear menu | chart-menu-clear-linked-cursor | Main context menu |

## Owner split

| Item | Owner |
|------|-------|
| Charts linked-cursor / domain pin | **Bot-C** (this tip) |
| Right-rail rail-dwell-scrubber twin | **Bot-B** (untouched) |
| nb-stft-dwell-scrubber embed | Bot-C prior tips |

## Evidence

- apps/web/src/store/uiStore.ts (+ linkedCursor.test.ts)
- packages/charts/src/react/HeatmapCanvas.tsx
- packages/charts/src/react/WaveformChart.tsx
- packages/charts/src/overlay/cursorOverlay.ts
- apps/web/src/components/MainChartHost.tsx
- apps/web/src/components/AuxChartHost.tsx
- artifacts/validation/ui-parity/bot-c/G18-LINKED-CURSOR-HANDOFF.md

**matrix_pass_claimed: false. No PASS.**
