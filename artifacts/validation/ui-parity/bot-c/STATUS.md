# Bot-C short tip — G18 NB multi-view STFT/wave linked polish (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:50 |
| Base tip | 1a7afff |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 NarrowbandWorkspace::updateLinkedCursors (waveform_/psd_/stft_ setLinkedCursor) |
| Self-check | ChartMarkOverlay untouched (backticks=16, dollar-brace=9); HeatmapCanvas backticks=30 |
| matrix_pass_claimed | false |

## Landed

| ID | Landed | Note |
|----|--------|------|
| G18 STFT linked crosshair | resolveNbStftLinkedCursor + SpectrumChart linkedCursor | desktop stft_->setLinkedCursor; stamp data-g18-nb-stft-linked-cursor |
| G18 wave linkedX from store | resolveNbWaveLinkedTimeSec | prefer pinned timeSec else dwell map; wave onPinX |
| G11 PlotWidget | none | rechecked vs 17471a6; no clear C-owned paint gap beyond prior MET |
| typecheck | clean | NB rfOffset / Esc roi not reproduced on 1a7afff |

## Deferred / gaps

| Item | Status |
|------|--------|
| Full desktop multi-view (modulation/recognition STFT panes) | still PARTIAL; NB observe path only |
| rail-dwell-scrubber twin | Bot-B — untouched |
| G11 residual paint nuances (matrix) | still PARTIAL; nothing concrete for C |

## Owner split

| Item | Owner |
|------|-------|
| NB observe linked chrome (wave/PSD/STFT) | **Bot-C** (this tip) |
| Right-rail scrubber twin | **Bot-B** (untouched) |
| DSP series / pin store fields | **Bot-D** (untouched) |

## Evidence

- apps/web/src/components/nbMultiViewLinked.ts
- apps/web/src/components/nbMultiViewLinked.test.ts
- apps/web/src/components/NarrowbandObserveCharts.tsx

**matrix_pass_claimed: false. No PASS.**
