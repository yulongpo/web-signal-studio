# Bot-C wave9 — G11 file-fullRange clamp + G18 margin-map/scrubber (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 00:36 |
| Base tip | 787623d |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 MarkEdit fullRange clamp; HeatmapCanvas HEATMAP_PLOT_MARGIN; LinkedCursor framePsd |
| Self-check | ChartMarkOverlay backticks=10 |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G11 file-fullRange clamp | body + edge via `fullTime`/`fullFreq` from MainChartHost (`timeSec`/`freqHz`) | `clampMarkRangeToFull`; `data-g11-file-fullrange-clamp` |
| G18 margin-map | `frameIndexFromPlotX` uses `PLOT_MARGIN` | clicks in axis margin ignored |
| G18 dwell scrubber | `nb-stft-dwell-scrubber` drag marker | charts-owned; sets pin + frame mode |

## Honest gaps

| Gap | Owner |
|-----|-------|
| Non-current-vs-unselected polish beyond PointingHand | C light follow-up |
| Right-rail scrubber twin (if any) | B |
| Desktop linked-cursor multi-chart sync polish | B/C |
| DSP series / eye bitstream | D (BLOCKED untouched) |

## Evidence
- apps/web/src/components/chartGesture.ts (+ tests)
- apps/web/src/components/ChartMarkOverlay.tsx
- apps/web/src/components/MainChartHost.tsx
- apps/web/src/components/NarrowbandObserveCharts.tsx

**matrix_pass_claimed: false. No PASS.**
