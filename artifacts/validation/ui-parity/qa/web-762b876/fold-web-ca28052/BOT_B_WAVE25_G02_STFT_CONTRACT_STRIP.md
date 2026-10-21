# BOT_B_WAVE25 — G02 SpecParamStrip on D StftRequest contract (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `5fc5788b65c8b070cf29cf23e7492e845fe455ad` (`origin/main`; D contract `ba3bb76` + A) |
| D evidence | `artifacts/validation/bot-d/BOT_D_G02_STFT_CONTRACT_bb9b1ef.md` |
| Desktop | `17471a6` SpectralSettingsWidget |
| matrix_pass_claimed | **false** |

## Driven (real DSP/store)

- Prefs → compute → D `setDspFftAnalysisParams` publish:
  - `stftN` / `stftWindowPref` / `stftOverlapPref` (wave22) + **`stftKaiserBetaPref`** when window=kaiser
  - MainChartHost passes `method: 'welch'` + `kaiserBeta` into file/synthetic STFT
- Strip reads D publish: `dspSpectralMethod`, `dspSegmentMs`, `dspSpectrumStatistic`, `dspKaiserBeta` (+ existing window/overlap/hop/fft)

## Blocked / NA (honest chrome)

- Methods in `STFT_BLOCKED_METHODS` (periodogram/bartlett/multitaper/burg): listed disabled/`data-blocked`, not clickable
- Method select fixed to `welch` (`STFT_SUPPORTED_METHODS`)
- Statistic: `NA (NA_PSD_ONLY)` — never fake Mean on STFT (`dspSpectrumStatistic` stays null)
- Segment ms: display of D-derived `dspSegmentMs` (fftSize/fs); desktop auto N/B not implemented

## Non-goals

- No G06/G17 invent; `data-native-qfiledialog=false`
- No Bot-C chart host / scrubber edits
- No invented Multitaper/Burg compute

## Checks

- typecheck: no new errors vs base (pre-existing NarrowbandObserveCharts / useEscClearPinnedCursor only)

## Deferred

- Full Qt SpectralSettings (DPSS/Burg/removeMean); matrix PASS
