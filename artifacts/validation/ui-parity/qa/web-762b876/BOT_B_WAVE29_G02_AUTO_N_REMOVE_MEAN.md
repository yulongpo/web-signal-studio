# BOT_B_WAVE29 — G02 auto N/B + removeMean strip (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `ab480646fbeefeb8fc523f6399199fb0d2bd4dfd` (`origin/main`; D `fac1e48` + A) |
| D evidence | `artifacts/validation/bot-d/BOT_D_G02_RESIDUAL_ab32f6e.md` |
| Desktop | `17471a6` SpectralSettingsWidget auto N/B + RemoveMean |
| matrix_pass_claimed | **false** |

## Driven (real DSP/store)

- Chrome prefs `stftAutoNbPref` / `stftRemoveMeanPref` → MainChartHost → compute wrappers:
  - auto on: `segmentMilliseconds: 0` + `bandwidthHz=fs` + `analysisPoints=stftN` → `resolveAnalysisSamples` / `webFftSizeFromAnalysisSamples`
  - `removeMean` → `StftRequest.removeMean`
- Settle publish via D `setDspFftAnalysisParams` → `dspAutoNb` / `dspRemoveMean` (plus existing window/overlap/fft/method/segment/kaiser)

## Strip chrome

- Replaces wave26 NA-only auto-N copy with **toggleable** auto N/B + honest resolve stamps
- removeMean checkbox + D publish readout
- Toolbar values: AutoN / Mean0 from D store

## Still BLOCKED (greyed)

- Multitaper / Burg / Periodogram / Bartlett (`STFT_BLOCKED_METHODS`) — unchanged, not clickable
- SpectrumStatistic NA_PSD_ONLY

## Non-goals

- No G06/G17; qfiledialog false; no Bot-C chart edits; no PASS

## Deferred

- Full non-PoT window length / STFT decimation pipeline; matrix PASS
