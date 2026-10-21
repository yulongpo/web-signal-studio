# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: CAO unfreeze — file-io RAW/SigMF + dsp-wasm PSD/STFT reference kernels
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
- `DdcEngine` remains `NotImplementedDdcEngine` (explicit throw; CAO asked PSD/STFT now)
- Golden tests: synthetic two-tone peaks within **±1 bin**; STFT tone energy fraction **> 0.5**

### contracts
- **Consume only** (`@wss/contracts`). No ownership change. `interfaces.ts` imports package alias `@wss/contracts` (not relative Bot-F paths).

## Test commands

```bat
cd /d D:\project\wss-wt-d
npm test
```

Filter (if unrelated packages fail):

```bat
npx vitest run packages/file-io packages/dsp-wasm
```

## Result

```
npm test
 Test Files  6 passed (6)
      Tests  21 passed (21)
   Duration  ~1.45s
```

Root `npm test` green. No contracts source changes.

## Pause note

Previous `WRITE_PAUSE.md` superseded by this unfreeze status.
