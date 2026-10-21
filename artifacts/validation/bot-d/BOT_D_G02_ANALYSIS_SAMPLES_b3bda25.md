# Bot-D G02 — publish `dspAnalysisSamples` (wave33 A3)

| Field | Value |
|-------|-------|
| Base | `b3bda25` (`b3bda2505226baa744b8b469068e7b7fa14696b6`) |
| Branch | `work/bot-d-dsp` |
| matrix_pass_claimed | **false** |

## Already covered before this tip?

**No.** Main already published post-resolve FFT stamps:

- `dspFftSizeActive` — post-PoT fftSize that ran STFT
- `dspFftWindow` / `dspFftOverlap` / `dspFftHopSize`
- `dspSegmentMs` / `dspAutoNb` / `dspRemoveMean` / `dspSpectralMethod` / `dspKaiserBeta`

Missing: the **pre-PoT** desktop-equivalent `analysisSamples` from `resolveAnalysisSamples` (distinct from chrome `stftN` / `stftAutoNbPref`).

## Landed

| Item | Notes |
|------|-------|
| `MainSpectrogramResult.analysisSamples` | Auto N/B: `plan.analysisSamples` before `webFftSizeFromAnalysisSamples`. Explicit: equals `fftSize` (PoT-only). |
| `FileSpectrogramResult.analysisSamples` | Same semantics. |
| `uiStore.dspAnalysisSamples` | Via `setDspFftAnalysisParams({ analysisSamples })`; cleared on `null` (loading / demo-fallback). |
| `MainChartHost` | Publishes `result.analysisSamples` on file + synthetic settle paths. |

## Semantics (honest)

- **`dspAnalysisSamples`**: desktop-equivalent window length that drove sizing (`resolveAnalysisSamples`). May be non-PoT under auto N/B.
- **`dspFftSizeActive`**: post-PoT web engine fftSize that actually ran STFT.
- Explicit PoT path: both equal (no separate resolve).
- No Bluestein / cascaded FirDecimator / Multitaper / Burg invented.

## Tests

- `apps/web/src/store/uiStore.dspFftAnalysisParams.test.ts` — publish + clear + distinct pre/post-PoT
- `apps/web/src/dsp/computeMainSpectrogram.test.ts` — explicit path `analysisSamples === fftSize`

## Out of scope

- SpecParamStrip chrome stamp (Bot-B).
- Multitaper / Burg / non-PoT FFT / STFT-DDC (still BLOCKED).
- **No PASS.**
