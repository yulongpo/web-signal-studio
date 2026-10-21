# Bot-C short tip — G18 Esc clear pin + NB multi-view wave sync (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:18 |
| Base tip | 0515ed8 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 MainWindow Esc → clearActiveLinkedCursor / Session::clearCursor |
| Self-check | ChartMarkOverlay untouched; HeatmapCanvas backticks unchanged (30) |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G18 Esc clear pin | clearActivePinnedCursor + useEscClearPinnedCursor | WB clears linkedCursor; NB clears dwell + restores statistical PSD |
| G18 NB multi-view | wave linkedX from pinned dwell time | data-g18-nb-multi-view; desktop updateLinkedCursors subset |
| G18 clear menu | uses clearActivePinnedCursor | Main + NB chrome clears |

## Deferred / gaps

| Item | Status |
|------|--------|
| NB PSD linked freq overlay | deferred (no pin-frequency store yet; STFT click is frame-X only) |
| G11 PlotWidget leftover paint nuances | deferred (capacity; sourceKind/hover already MET) |
| rail-dwell-scrubber twin | Bot-B — untouched |

## Owner split

| Item | Owner |
|------|-------|
| Esc clear / charts linked sync | **Bot-C** (this tip) |
| Right-rail rail-dwell-scrubber | **Bot-B** (untouched) |

## Evidence

- apps/web/src/store/uiStore.ts (+ escClearPin.test.ts)
- apps/web/src/hooks/useEscClearPinnedCursor.ts
- apps/web/src/App.tsx (data-g18-esc-clear)
- apps/web/src/components/MainChartHost.tsx
- apps/web/src/components/NarrowbandObserveCharts.tsx
- apps/web/src/components/NarrowbandWorkspace.tsx
- artifacts/validation/ui-parity/bot-c/G18-ESC-CLEAR-HANDOFF.md

**matrix_pass_claimed: false. No PASS.**
