# Bot-C short tip — NB PSD freq vline + Esc clears linked (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:25 |
| Base tip | 088f322 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 NarrowbandWorkspace::updateLinkedCursors / Session::clearCursor |
| Self-check | ChartMarkOverlay untouched; HeatmapCanvas backticks unchanged |

## Landed

| ID | Landed | Note |
|----|--------|------|
| NB PSD freq vline | linkedX from linkedCursor.frequencyHz | WaveformChart already draws vertical pin line; probes data-g18-nb-psd-freq-vline |
| STFT pin → freq | cssToTimeFreq on STFT click | Also pinLinkedCursor(time+freq+frame); feeds PSD vline without new D field |
| PSD click pin | onPinX → pinLinkedCursor source=psd | Same as AuxChartHost PSD path |
| Esc clear linked in NB | clearActivePinnedCursor | Drops dwell + linkedCursor so PSD vline clears |
| G11 PlotWidget leftover | none this tip | sourceKind/hover already MET; no clear evidence-backed chrome leftover owned by C |

## Deferred / gaps

| Item | Status |
|------|--------|
| Dedicated NB pin-frequency store field | **not needed** — reuse linkedCursor.frequencyHz (C). If D later wants STFT-only field for DSP series, document separately |
| Dwell-only historic pins (no linkedCursor) | no freq vline until STFT/PSD re-pin provides frequency |
| rail-dwell-scrubber twin | Bot-B — untouched |
| G11 residual paint nuances | still PARTIAL at matrix level; nothing concrete left for this tip |

## Owner split

| Item | Owner |
|------|-------|
| NB PSD freq chrome / Esc clear | **Bot-C** (this tip) |
| DSP series / pin store fields beyond linkedCursor | **Bot-D** (no new field this tip) |
| Right-rail scrubber | **Bot-B** (untouched) |

## Evidence

- apps/web/src/components/NarrowbandObserveCharts.tsx
- apps/web/src/store/uiStore.ts (+ escClearPin.test.ts)
- packages/charts WaveformChart linkedX (unchanged consumer)

**matrix_pass_claimed: false. No PASS.**
