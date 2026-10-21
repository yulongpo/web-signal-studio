# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: CAO unfreeze — file-io RAW/SigMF + dsp-wasm PSD/STFT + **real DDC**
- worktree: `D:\project\wss-wt-d`
- branch: `work/bot-d-dsp`
- package_scope: `@wss/*`
- shared_tree (`D:\project\web_signal_studio`): **no writes**
- rebuild (`D:\project\signal_studio_rebuild`): **never touch**

## Delivered

### `packages/file-io`
- `raw-reader.ts` — describe/open RAW with `SampleFormatDescriptor` header/trailer decimal strings; CI16 LE IQ default
- `sigmf-meta.ts` — parse SigMF JSON (`core:datatype`, `sample_rate`, `frequency`, `offset`, `trailing_bytes`); tolerates `ci16_le`, `cf32_le`, …
- `sigmf-reader.ts` — pair meta + ArrayBuffer dataset (path stub for later FS)
- Tests: **synthetic-labeled** fixtures only (`raw-sigmf.test.ts`)

### `packages/dsp-wasm`
- `windows.ts` — rectangular, hann (+ hamming/blackman/… for SpectralWindowName)
- `psd.ts` — `ReferencePsdEngine` Welch/periodogram via `fftRadix2`
- `stft.ts` — `ReferenceStftEngine` hop STFT → `StftResult`
- **`fir.ts`** — windowed-sinc lowpass; default cutoffNyquist = `0.45 / max(L,M)` of input Nyquist
- **`rational-resample.ts`** — upsample by L (zero-insert + anti-image FIR) / downsample by M; `outputSampleRateHz = fs * L / M`
- **`ddc.ts`** — `ReferenceDdcEngine`: mix → FIR → rational resample; output indices engine-local `begin=0n..end=N_out`
- `NotImplementedDdcEngine` deprecated stub (throws → use `ReferenceDdcEngine`)
- Golden tests:
  - PSD: synthetic two-tone peaks within **±1 bin**
  - STFT: tone energy fraction **> 0.5**
  - **DDC**: single tone @ `0.1*fs`, LO=`f0`, decimate×4 → **≥85%** energy within ±2 bins of DC; peak within ±1 bin
  - **DDC**: two-tone, LO on one → DC band energy **≥20×** mid-band (rejected tone attenuated)

### contracts
- **Consume only** (`@wss/contracts`). No ownership change. `DdcRequest` / `DdcResult` from `spectral.ts`.

## DDC processing order

1. Complex LO mix-down: `x[n] *= exp(-j·2π·loHz·n/fs)` with `n = Number(begin)+i`
2. Real FIR on I/Q (`firTaps` or default windowed-sinc, see formula above)
3. Rational resample (`skipFilter` when `L===1` after input-rate FIR)

## Test commands

```bat
cd /d D:\project\wss-wt-d
npx vitest run packages/file-io packages/dsp-wasm
```

Or full root include set:

```bat
npx vitest run
```

## Result (DDC drop)

`
npx vitest run
 Test Files  7 passed (7)
      Tests  25 passed (25)
   Duration  ~1.46s

npx vitest run packages/file-io packages/dsp-wasm
 Test Files  5 passed (5)
      Tests  17 passed (17)
   — dsp-wasm: fft(2) + psd-stft(3) + ddc.golden(4) = 9
   — file-io: chunked(2) + raw-sigmf(6) = 8
`

DDC golden excerpt:
- single tone @ 0.1*fs, LO=f0, decimate x4 → dcFraction > 0.85; peak within ±1 bin of DC
- two-tone LO on keep → dcEnergy > farEnergy * 20; peak within ±2 bins of DC
- AbortSignal → AbortError

## Pause note

Previous WRITE_PAUSE.md superseded by this unfreeze status.
