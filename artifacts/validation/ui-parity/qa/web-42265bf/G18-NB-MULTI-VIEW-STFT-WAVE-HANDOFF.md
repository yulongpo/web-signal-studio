# Bot-C — G18 NB multi-view STFT/wave linked polish (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:50 |
| Base | 1a7afff |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 updateLinkedCursors → waveform_/psd_/stft_->setLinkedCursor |
| matrix_pass_claimed | **false** |

## Behavior

1. **STFT** SpectrumChart now gets linkedCursor (time X, freq Y) when pinned, or dwell-only via dwell time + resolved PSD freq. Stamp data-g18-nb-stft-linked-cursor.
2. **Wave** linkedX prefers linkedCursor.timeSec when pinned; else dwell map. onPinX pins time (preserve/center freq) like AuxChartHost / desktop Curve pin.
3. PSD freq vline / dwell-only recovery / Esc / scrubber — retained (prior tips).
4. Helpers: 
bMultiViewLinked.ts (+ vitest). ChartMarkOverlay untouched.

## G11

None — rechecked matrix residual "PlotWidget paint nuances"; no new clear C-owned gap vs rebuild@17471a6 (sourceKind/hover/ClosedHand/axis-only already MET).

## Typecheck

	sc -p apps/web --noEmit clean. CAO FYI NB 
fOffset / Esc 
oi: **not reproduced**; skipped.

## Self-check

ChartMarkOverlay backticks=16, dollar-brace=9. HeatmapCanvas backticks=30.

**No PASS.**
