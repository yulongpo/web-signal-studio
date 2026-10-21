# G18 Esc clear pin — Bot-C charts tip (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 01:18 |
| Base tip | 0515ed8 |
| Branch | work/bot-c-charts |
| Desktop ref | 17471a6 MainWindow eventFilter Key_Escape → clearActiveLinkedCursor; Session::clearCursor erases LinkedCursorState (pinned + framePsd) |

## Landed (charts-owned)

- `clearActivePinnedCursor()`: active workspace only
  - wideband / linked: clears `linkedCursor`
  - narrowband: clears `narrowbandPinnedDwellIndex` + sets `narrowbandPsdMode` to `statistical` (desktop averaged PSD restore)
- `useEscClearPinnedCursor` mounted in App: Esc when no temp-layer / ROI tool / dialog / editing field / context menu
- Main context menu **清除驻留游标** + NB clear buttons / Alt-click use the same helper
- NB multi-view: observe waveform gets `linkedX={dwellTimeSec}` from pinned dwell; stamps `data-g18-nb-multi-view` / `data-g18-esc-clear`

## Bot-B handoff (do NOT land)

- Right-rail `rail-dwell-scrubber` twin remains **Bot-B**
- No parallel pin API; continue reading `narrowbandPinnedDwellIndex` + `nb-stft-pin-host` `data-frame-count`

## Honest gaps

- NB PSD vertical freq pin overlay still thin (STFT pin stores frame index only; no pin-frequencyHz yet)
- G11 PlotWidget leftover paint nuances deferred (sourceKind + hover already MET @ prior tips)
- Nav strip still skips linked cursor (matches desktop Kind::Navigation)

**matrix_pass_claimed: false. No PASS.**
