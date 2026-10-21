# Bot-D G02 — STFT spectral contract (method / segment / statistic)

| Field | Value |
|-------|-------|
| Base | `bb9b1ef` |
| Branch | `work/bot-d-dsp` |
| Desktop ref | `17471a6` SpectralSettingsWidget + domain/project.h |
| matrix_pass_claimed | **false** |

## Desktop mapping (17471a6)

| Desktop control | Desktop STFT (psd=false) | Desktop PSD (psd=true) | Web STFT today |
|-----------------|--------------------------|-------------------------|----------------|
| SpectralMethod | Welch + Multitaper only (Periodogram/Bartlett/Burg forced off) | Periodogram, Bartlett, Welch, Multitaper, Burg | **Implemented: `welch` only** |
| Window | Rect/Hann/Hamming/…/Kaiser | same | Implemented (`SpectralWindowName`) — already published as `dspFftWindow` |
| Overlap % | yes (Bartlett forced 0) | yes | Implemented via hop — `dspFftOverlap` |
| segmentMilliseconds | yes (0 = auto N/B) | yes | **Derived publish** `dspSegmentMs = fftSize/fs*1000`. Auto N/B **BLOCKED/NA** (web sizes by `fftSize`) |
| Kaiser β | yes when window=Kaiser | yes | **Real path**: `StftRequest.kaiserBeta` → `makeWindow`; publish `dspKaiserBeta` (else null) |
| DPSS NW / tapers | Multitaper only | Multitaper only | **BLOCKED** — no DPSS implementation |
| Burg order | hidden on STFT | Burg only | **BLOCKED** |
| SpectrumStatistic | **not present** (widget omits) | Mean / Max / Min | **NA_PSD_ONLY** — publish `dspSpectrumStatistic: null` forever on main STFT |
| removeMean | yes | yes | **BLOCKED** (not in StftRequest) |

Honest note: desktop STFT statistic is absent; do not stamp "Mean" on SpecParamStrip for STFT.

## Web contract (`packages/contracts` StftRequest)

| Field | Status |
|-------|--------|
| fftSize / hopSize / window / sampleRateHz | driveable (existing) |
| `method?: 'welch'` | driveable; other methods **throw BLOCKED** (no silent fallback) |
| `segmentMilliseconds?: number` | metadata / publish; framing still uses `fftSize` samples |
| `kaiserBeta?: number` | driveable when window=kaiser (default 8.6) |
| Multitaper / Burg / Periodogram / Bartlett | **BLOCKED** (`STFT_BLOCKED_METHODS`) |
| SpectrumStatistic | **NA** on STFT (`STFT_SPECTRUM_STATISTIC_STATUS = NA_PSD_ONLY`) |

## Store publish (Bot-D → Bot-B strip)

| Field | Type | Meaning |
|-------|------|---------|
| `dspFftWindow` | `SpectralWindowName \| null` | (wave20) |
| `dspFftOverlap` | `number \| null` | (wave20) |
| `dspFftHopSize` | `number \| null` | (wave20) |
| `dspFftSizeActive` | `number \| null` | (wave20) |
| `dspSpectralMethod` | `'welch' \| null` | last STFT method |
| `dspSegmentMs` | `number \| null` | derived segment ms |
| `dspSpectrumStatistic` | `SpectrumStatisticName \| null` | always null on STFT (NA) |
| `dspKaiserBeta` | `number \| null` | set only for kaiser window |

Publisher: `MainChartHost` via `setDspFftAnalysisParams` on file/synthetic STFT success; clears on loading / demo-fallback.

## Out of scope

- SpecParamStrip chrome stamps remain Bot-B/C.
- G06 eye / bitstream: still **BLOCKED** unchanged.
- No PASS. matrix_pass_claimed: false.

## Tests

- `apps/web/src/store/uiStore.dspFftAnalysisParams.test.ts`
- `apps/web/src/dsp/computeMainSpectrogram.test.ts` (method / segmentMs)
- `packages/dsp-wasm/src/stft.method.test.ts` (BLOCKED reject + kaiser path)
