# Bot-C — A2 residual: fixed-SegmentMs visibleBandwidthHz

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 08:15 |
| Base | `6fdd5fe` (origin/main) |
| Branch | `work/bot-c-charts` |
| Desktop ref | `17471a6` / spectral_analysis.cpp bandwidth = view.frequency span |
| matrix_pass_claimed | false |

## Residual

Prior A2 (wave33) wired `visibleBandwidthHz` → `bandwidthHz` on **auto-N** only.
Fixed-SegmentMs branches in `MainChartHost` still hard-coded `session.sampleRateHz` / `1_000_000`.

Compute already accepted `bandwidthHz` on fixed SegmentMs (B wave33 A1 → `resolveAnalysisSamples` PoT sizing). Host was the gap.

## Tip

- `MainChartHost.tsx`: file IQ + synthetic fixed-SegmentMs paths use `analysisBandwidthHz` with fs fallback (parallel to auto-N). B `stftSegmentMsPref` / D `dspAnalysisSamples` untouched.
- `visibleBandwidthHz.ts`: comment covers auto + fixed.
- `computeMainSpectrogram.test.ts`: fixed SegmentMs narrower BW → smaller resolved fftSize vs full fs.

## Fence

- No STFT-DDC / non-PoT invent — sizing input only (same as auto-N A2).
- No ChartMarkOverlay edit.
- G18 recog still BLOCKED; not touched.

## Checks

- vitest: `visibleBandwidthHz.test.ts`, `computeMainSpectrogram.test.ts`
- tsc on touched paths
