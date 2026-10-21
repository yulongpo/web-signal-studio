# Bot-D G02 wave20 — FFT window / overlap publish path

| Field | Value |
|-------|-------|
| Base | `e8f0881` |
| Branch | `work/bot-d-dsp` |
| Desktop ref | `17471a6` SpectralSettingsWidget 窗函数 / 重叠 (%) |
| matrix_pass_claimed | **false** |

## Source of truth (real, not invented)

Main-chart STFT paths already pass a concrete window + hop into `@wss/dsp-wasm`:

| Path | Window | Hop default | Overlap = 1 − hop/fft |
|------|--------|-------------|------------------------|
| `apps/web/src/dsp/computeMainSpectrogram.ts` | `hann` (`MAIN_STFT_DEFAULTS`) | 64 @ fft 256 | **0.75** |
| `apps/web/src/dsp/computeFileSpectrogram.ts` | same | same | **0.75** |
| contracts `StftRequest` | `window: SpectralWindowName` | `hopSize` | (derived) |

Desktop (`17471a6`) exposes 窗函数 + 重叠 (%) on SpectralSettingsWidget / strip summary (`Welch · Hann · 50%` style). Web publish mirrors the **actual** STFT request used by the worker path (today: Hann + 75% from hop=fft/4), not a fabricated UI default.

Note: `uiStore.stftN` (1024) is still display chrome; MainChartHost does **not** yet pass `stftN` into compute. Published `dspFftSizeActive` is the FFT size the STFT actually ran with.

## Store fields (Bot-D publish; B/C subscribe for chrome)

| Field | Type | Meaning |
|-------|------|---------|
| `dspFftWindow` | `SpectralWindowName \| null` | Last main STFT window |
| `dspFftOverlap` | `number \| null` | Overlap ratio \[0, 1) |
| `dspFftHopSize` | `number \| null` | Hop samples |
| `dspFftSizeActive` | `number \| null` | FFT size used |
| `setDspFftAnalysisParams` | setter | Publish bundle or `null` to clear |

Publisher: `MainChartHost` — sets params on file/synthetic STFT success; clears on `loading` and `demo-fallback`.

## Out of scope (unchanged)

- SpecParamStrip chrome still shows `—` until Bot-B/C reads these fields (strip remains B/C).
- G06 eye / bitstream: still **BLOCKED**.
- No PASS.

## Tests

- `apps/web/src/dsp/computeMainSpectrogram.test.ts` — result.window/hop/overlap + helpers
- `apps/web/src/dsp/computeFileSpectrogram.test.ts` — file path returns same params
- `apps/web/src/store/uiStore.dspFftAnalysisParams.test.ts` — store contract

