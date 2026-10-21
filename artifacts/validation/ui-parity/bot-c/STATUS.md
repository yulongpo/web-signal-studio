# Bot-C wave7 — G11 bounds/unselected hover + G18 pin chrome (WIP - no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 00:25 |
| Base tip | 701872b |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 PlotWidget updateHover + MarkEdit Move clamp; LinkedCursor framePsd |
| Self-check | ChartMarkOverlay backticks=10 |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G11 view-bounds clamp | `applyMarkBodyDelta` tMin/tMax/fMin/fMax | Overlay passes axes domains |
| G11 unselected hover | `resolveMarkBodyHoverCursor` → pointer / move / grabbing | Move only if already selected |
| G18 STFT click pin | `nb-stft-pin-host` → `setNarrowbandPinnedDwellIndex` + `setNarrowbandPsdMode('frame')` | Alt-click clears |
| G18 contextFramePsd chrome | `nb-btn-context-frame-psd` (disabled until pinned) | Clears via `nb-btn-clear-pinned-dwell` |
| G18 store/DDC pin wire | On main via Bot-D `33bd755` / `701872b` | C does not re-own store |

## Honest gaps

| Gap | Owner |
|-----|-------|
| Pin uses full chart width (no plot-margin exact sample map) | C follow-up |
| Full-file sample bounds vs view-domain clamp | C (view clamp landed; file fullRange optional) |
| Desktop linked-cursor pin scrubber polish | B/C |
| DSP series / eye bitstream | D (BLOCKED untouched) |

## Evidence
- apps/web/src/components/chartGesture.ts (+ tests)
- packages/charts/src/interaction/chartHitZone.ts (+ tests)
- apps/web/src/components/ChartMarkOverlay.tsx
- apps/web/src/components/NarrowbandObserveCharts.tsx
- apps/web/src/components/NarrowbandWorkspace.tsx
- apps/web/src/components/RightRail.tsx

**matrix_pass_claimed: false. No PASS.**
