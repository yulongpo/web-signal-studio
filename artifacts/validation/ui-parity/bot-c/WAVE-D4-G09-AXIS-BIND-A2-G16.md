# Bot-C tip — D4 axis bind + A2 fixed-SegmentMs + G16 written PARTIAL

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 08:17 |
| Base | `8a5b548` (full `8a5b548b47908fc92c3e1855af630e77a0597590`) |
| Tip | `e6bdd01` (full `e6bdd01dca0d3e16a251b21a0f2b0a8cde7a54dd`) |
| A2 commit | `a57930c` |
| Branch | `work/bot-c-charts` |
| matrix_pass_claimed | false |

## 1) D4 / G09 axis ticks — LANDED (PARTIAL chrome bind)

**Already MET (unchanged):** `AxisOverlay` tick paint on `HeatmapCanvas` via `PhysicalAxis` (STFT/Waterfall).

**This tip (C bind):**
- `physicalViewSpans.ts` — view domains → semantic time/freq (Waterfall axis-swap)
- `MainChartHost` publishes `mainChartPhysicalSpans` on fitted / onViewChange / onViewCommit
- `BottomScaleChrome` ΔT/ΔF reads physical spans; `data-axis-bind=physical-view` when bound
- B shell ownership kept; C owns tick↔axis wiring only
- Fallback: prior navWindowTime + spectrogramDisplay when spans null

Not claiming screenshot MET vs rebuild.

## 2) G16 / D5 chart consumers — written PARTIAL / BLOCKED (no invent)

- B `SpectrumToolbar` `data-testid=mode-wheel` / `data-g16` **exists in source but is not mounted** (G02 demotion: ChartParamStrip is live header; no `<SpectrumToolbar` import in app tree).
- Live DOM therefore has **no data-g16 wrapper** (matches G evidence).
- Mode toggles that *do* live: ChartParamStrip STFT/Waterfall + Wave/PSD → already drive `chartMode` / `auxChartKind`; MainChartHost + AuxChartHost already consume those stores.
- **Enable/disable matrix** still `data-matrix=insufficient` on demoted shell — **no invent**.
- Status: **PARTIAL** (consumers via strip/store) / **BLOCKED** for g16-wrapper enable matrix.

## 3) A2 residual fixed-SegmentMs bandwidthHz — LANDED

- File IQ + synthetic fixed-SegmentMs paths use `analysisBandwidthHz` with fs fallback (parallel auto-N).
- No STFT-DDC / non-PoT invent. B `stftSegmentMsPref` + D `analysisSamples` kept.
- vitest: narrower BW → smaller resolved fftSize on fixed SegmentMs.

## Fence

- No ChartMarkOverlay edit
- No G06/G17 invent
- matrix_pass_claimed=false

## Checks

- vitest: physicalViewSpans, visibleBandwidthHz, computeMainSpectrogram
- tsc apps/web
