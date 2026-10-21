# G18 linked-cursor — Bot-C charts tip (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:08 |
| Base tip | 69c4efe |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 Session::LinkedCursorState / PlotWidget::pinAt / NarrowbandWorkspace::updateLinkedCursors |

## Landed (charts-owned)

- `uiStore.linkedCursor` + `pinLinkedCursor` / `clearLinkedCursor` (desktop merge rules: missing dim keeps prior or uses view center)
- `HeatmapCanvas` / `SpectrumChart`: `linkedCursor` solid pin crosshair + `onPinCursor` on click (too-small zoom-box / tiny pan)
- `WaveformChart`: `linkedX` + `onPinX`
- `MainChartHost` ↔ `AuxChartHost` sync via store; context menu **清除驻留游标**
- Probes: `data-g18-linked-cursor`, `data-linked-cursor-pinned`, `data-linked-x`

## Bot-B handoff (do NOT land in this tip)

- Right-rail `rail-dwell-scrubber` / pin·clear chrome remains **Bot-B**
- Charts embed `nb-stft-dwell-scrubber` already on prior tips; rail twin reads `nb-stft-pin-host` `data-frame-count` + store `narrowbandPinnedDwellIndex`
- B should **not** invent a parallel linked-cursor API — reuse `linkedCursor` / pin store fields above for any chrome readout

## Honest gaps

- Nav strip does not draw linked cursor (matches desktop Kind::Navigation skip)
- Narrowband observe wave/PSD linked overlay still thin vs desktop `setLinkedCursor` on all NB charts (STFT pin path exists; full NB multi-view polish residual)
- Esc→clear pin not wired this tip (menu clear only)
- G11 PlotWidget leftover polish not in this tip (capacity)

**matrix_pass_claimed: false. No PASS.**
