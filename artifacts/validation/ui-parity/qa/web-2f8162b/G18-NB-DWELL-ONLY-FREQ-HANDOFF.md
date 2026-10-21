# Bot-C — NB PSD dwell-only historic freq overlay (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:37 |
| Base | 1f52465 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 NarrowbandWorkspace::updateLinkedCursors / pinCursor always sets frequencyHz |
| matrix_pass_claimed | **false** |

## Behavior

1. **linkedCursor.pinned** → PSD `linkedX` from `linkedCursor.frequencyHz` (unchanged).
2. **Dwell-only historic** (`narrowbandPinnedDwellIndex` set, linkedCursor not pinned): recover freq from frame PSD peak → xDomain; else band center (desktop default when previous not pinned). Stamp `data-g18-nb-psd-freq-source=dwell-peak|dwell-center`.
3. **STFT scrubber** now also `pinLinkedCursor` (preserve freq if pinned, else band center) so scrubbing cannot leave dwell-only without freq.
4. Helper: `apps/web/src/components/nbPsdFreqFromDwell.ts` (+ vitest). No new Bot-D store field.

## G11

None — no clear evidence-backed PlotWidget leftover owned by C vs rebuild@17471a6 this tip.

## Typecheck

`tsc -p apps/web --noEmit` clean on base 1f52465. CAO FYI about 2 NB/Esc errors from B merge: **not reproduced**; skipped.

## Self-check

ChartMarkOverlay untouched (backticks=15, `${`=9). HeatmapCanvas backticks=30.

**No PASS.**
