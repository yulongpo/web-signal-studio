# Bot-C wave33 — A2 visible bandwidthHz (+ D3/D4/D5 evidence)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 07:55 |
| Base | `2ce34a9` (rebase onto origin/main after CAO conflict abort) |
| Branch | `work/bot-c-charts` |
| Tip | `63a5f79` (full `63a5f79c17c229790cda3a1759874e272d2dc1ad`) |
| Desktop ref | `17471a6` / `infrastructure/spectral_analysis.cpp` `bandwidth=frequency.upperHz-frequency.lowerHz`; `plot_widget.cpp` passes `view.frequency` |
| matrix_pass_claimed | false |

## Tip contents

### A2 — LANDED (C-owned chart view → bandwidthHz)

- Helper `apps/web/src/dsp/visibleBandwidthHz.ts`: STFT→Y / Waterfall→X freq span; fallback `sampleRateHz`; clamp to fs.
- `MainChartHost`: seed from fitted view; update on `onViewCommit`; auto-N path uses `analysisBandwidthHz` with fs fallback (no longer hardcode-only).
- **Still no STFT-DDC** / band-limited STFT — sizing input only (per ACTIONABLE).

### B coordination (A2)

- No new B chrome field. Single source = chart host live/committed view span → DSP `bandwidthHz`.
- B may later surface a readout from published STFT params; do **not** duplicate a second editable bandwidth control in rail without syncing this path.
- B-owned SegmentMs / SpectralSettings prefs unchanged.

### D3 G11 hover / ClosedHand / hoveredMarkId — no tip

Evidence already MET; no clear residual vs rebuild@17471a6:

- `ChartMarkOverlay.tsx` `data-g11-hover-sync`, `setHoveredMark` ↔ `m06-mark-session.hoveredMarkId`
- `packages/charts/src/interaction/chartHitZone.ts` OpenHand/ClosedHand + tests
- Prior bot-c notes (`G18-NB-MULTI-VIEW-STFT-WAVE-HANDOFF.md`) same conclusion

### D4 G09 main-chart bottom scale — no tip

- No `main-plot-footer` stub in tree; ACTIONABLE requires design from desktop screenshot.
- Existing `chart-physical-caption` (HeatmapCanvas) is G02 charts-side caption, not G09 footer chrome.
- Prefer written OPEN over inventing QLabel strip without design.

### D5 G16 mode-wheel enable rules — no tip

- STFT/Waterfall + Wave/PSD toggles exist (`ChartParamStrip` / `SpectrumToolbar`) but always enabled.
- ACTIONABLE blocker: **desktop mode matrix note** missing — will not invent enable/disable rules.

### G18 recog

- Remains BLOCKED (wave32 handoff); not touched.

### tsc pre-existing (landed in same tip)

- `NarrowbandObserveCharts.tsx`: removed unused `rfOffset` (LO shift already inline).
- `useEscClearPinnedCursor.ts`: `activeTool === 'roi'` → `'detection-roi'` (ActiveTool union).


## Rebase note (CAO merge conflict abort)

- Prior tip 24de524 conflicted on MainChartHost.tsx vs main@2ce34a9 (D A3 dspAnalysisSamples + B wave33 SegmentMs).
- Rebased onto origin/main @ 2ce34a9; kept:
  - D: nalysisSamples: result.analysisSamples in both file-IQ and synthetic setDspFftAnalysisParams
  - B: stftSegmentMsPref + non-autoNb segmentMilliseconds: stftSegmentMsPref branches
- Re-applied A2 only on auto-N andwidthHz (visible span + fs fallback); deps include both stftSegmentMsPref and nalysisBandwidthHz.
- matrix_pass_claimed: false

## Checks

- vitest: `visibleBandwidthHz.test.ts`
- tsc / backtick guard on touched TSX (ChartMarkOverlay not edited)
