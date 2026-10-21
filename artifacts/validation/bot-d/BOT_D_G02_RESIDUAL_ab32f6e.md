# Bot-D G02 residual — auto N/B + removeMean

| Field | Value |
|-------|-------|
| Base | `ab32f6e` (`ab32f6e901182113cb66c0da2b9a028057d7aec1`) |
| Branch | `work/bot-d-dsp` |
| Desktop ref | `17471a6` SpectralSettingsWidget + `infrastructure/spectral_analysis.cpp` |
| Prior contract | tip `3aaac7d` (welch+kaiserBeta; Multitaper/Burg BLOCKED; SpectrumStatistic NA) |
| matrix_pass_claimed | **false** |

## Desktop findings (17471a6)

| Control | Desktop | Notes |
|---------|---------|-------|
| **auto FFT N / auto bandwidth** | **Yes** — `SpectralParameters.segmentMilliseconds = 0` selects N/B automatically | `makeSpectralAnalysisPlan`: `binHz = bandwidth/points`; auto → `analysisSamples = ceil(analysisRateHz/binHz)`; fixed ms → `ceil(analysisRate*ms/1000)`. Optional ×2 decimation while `analysisRate/2 >= 2*bandwidth`. |
| **removeMean** | **Yes** — checkbox `RemoveMean` | Per-frame: subtract complex mean of valid samples **before** window / FFT (`spectral_analysis.cpp`). Default `false`. |
| Multitaper / DPSS / Burg | Present on desktop (STFT: Welch+Multitaper; PSD: +Periodogram/Bartlett/Burg) | Still **BLOCKED** on web — no pretend path. |
| SpectrumStatistic | PSD widget only | Still **NA_PSD_ONLY** on STFT. |

## Landed this tip

| Item | Status |
|------|--------|
| `resolveAnalysisSamples` + `webFftSizeFromAnalysisSamples` | **Real** desktop sizing formula + honest PoT adaptation for web FFT |
| `StftRequest.segmentMilliseconds === 0` | **Real** auto path when `bandwidthHz` + `analysisPoints` provided; **throws** if missing (no silent fake) |
| `StftRequest.removeMean` | **Real** compute path in `computeStft` (complex mean subtract pre-window) |
| Store publish | `dspRemoveMean`, `dspAutoNb` via `setDspFftAnalysisParams` |
| Wrappers / worker wire | Main/file spectrogram + chunked reader + protocol/client/handler |
| Multitaper / Burg / DPSS | **Still BLOCKED** (throw on method) |
| SpectrumStatistic | **Still NA** |

## Still BLOCKED / not MET

- Full desktop non-PoT window length (web rounds up to PoT via `webFftSizeFromAnalysisSamples` — documented adaptation).
- Multitaper / DPSS NW / tapers / Burg order compute.
- Chrome prefs for duration=0 / removeMean toggle remain Bot-B (DSP contract + compute ready).
- Decimation path is in `resolveAnalysisSamples` but web STFT still runs at input `sampleRateHz` (no DDC/decimate stage in STFT engine) — auto sample count uses post-decimation rate for **length**, matching desktop analysisSamples formula; full band-limited transform pipeline is not claimed.

## Tests

- `packages/dsp-wasm/src/stft.method.test.ts` — auto N/B throw, resolve formula, removeMean DC kill
- `apps/web/src/store/uiStore.dspFftAnalysisParams.test.ts` — publish fields
- `apps/web/src/dsp/computeMainSpectrogram.test.ts` — default removeMean/autoNb false

## Out of scope

- SpecParamStrip chrome stamps (Bot-B/C).
- G06 / G17 invention.
- **No PASS.** matrix_pass_claimed: false.
