# BOT_B_WAVE22 — G02 stftN + SpectralSettings prefs → STFT compute (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `2f8162bedc05097ebb0fecd63521c82a66e54b1d` (`origin/main`; past 1a7afff / Bot-C G18) |
| Desktop | `17471a6` SpectralSettingsWidget window/overlap |
| matrix_pass_claimed | **false** |

## Delivered

- **stftN → compute:** MainChartHost passes `stftN` as `fftSize` and hop from `stftOverlapPref` into file/synthetic STFT; effect deps re-run on pref change. Actuals published via D `setDspFftAnalysisParams` after settle.
- **SpectralSettings chrome:** overflow window + overlap % editors (rebuild parity). Prefs `stftWindowPref` / `stftOverlapPref` are Bot-B request state (distinct from D `dspFft*` publish).
- Compute wrappers accept optional `window` (existing worker path).

## Non-goals

- No G06/G17; qfiledialog false; no rail twin / linkedCursor invent.

## Checks

- typecheck: no new errors vs base `2f8162b` (pre-existing: NarrowbandObserveCharts rfOffset unused; useEscClearPinnedCursor ActiveTool vs "roi")

## Deferred

- Full Qt method/duration/statistic; matrix PASS
