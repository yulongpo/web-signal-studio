# WASM FFT wiring for Bot-B (optional Worker engine)

Bot-D Package C added an **optional** DSP Worker FFT engine. Bot-B owns FSA / chunked STFT UI (`MainChartHost`, `stftFromChunkedReader`, etc.). This note is only how to **opt into** `engine: 'wasm-fft'` without changing defaults.

Package E adds a thin prefer-WASM factory and a **narrowband DDC** chunked helper Bot-B can call later — UI stub stays honest until a real path is wired.

## Default (unchanged)

- Worker / client default engine is **`'js'`** (portable JS `fftRadix2` / `ReferenceStftEngine` / `ReferencePsdEngine`).
- DDC Worker path remains **JS** `computeDdc` (WASM DDC is optional via `WasmReferenceDdcEngine` in tests / direct calls).
- No configure message is required for the JS path.

## Opt-in at client construction

```ts
import { createBrowserDspWorkerClient } from '@wss/dsp-wasm';

const client = createBrowserDspWorkerClient({
  engine: 'wasm-fft', // optional; omit or 'js' for default
});

// Wait for one-shot configure handshake (null when engine was already 'js' / no configure)
const configured = await client.ready();
// configured?: { engine: 'js' | 'wasm-fft'; fellBackToJs?: boolean }
```

### Prefer-WASM one-liner (Package E)

```ts
import { createBrowserDspWorkerClientPreferWasmFft } from '@wss/dsp-wasm';

const client = createBrowserDspWorkerClientPreferWasmFft();
await client.ready(); // may report fellBackToJs if WASM load failed
```

## Runtime switch

```ts
await client.configureEngine('wasm-fft');
await client.configureEngine('js'); // restore default
```

## Narrowband DDC helper (Package E — copy-paste)

Bot-D owns numerical DDC. When Bot-B is ready to replace the narrowband stub with a **real** path (not fake demod), call:

```ts
import { ddcFromChunkedReader } from '../dsp/ddcFromChunkedReader';
import { createBrowserDspWorkerClient } from '@wss/dsp-wasm';

const client = createBrowserDspWorkerClient(); // JS default; or PreferWasmFft for STFT/PSD only
const result = await ddcFromChunkedReader({
  reader, // real ChunkedReader from FSA / WAV / RAW / SigMF
  client,
  sampleRateHz: descriptor.sampleRateHz,
  loOffsetHz: selectedLoHz,
  interpolation: 1,
  decimation: 4,
  sourceLabel: userFacingLabel, // required; must not silently claim live if fixture
  signal: abort.signal,
  basebandStft: { fftSize: 512, hopSize: 128 }, // optional
});
// result.ddc.samples = interleaved Float32 IQ at result.outputSampleRateHz
```

**Do not** ship UI that pretends demod/DDC succeeded without calling this (or equivalent Worker `processDdc`).

## Fallback

- If WASM module load fails inside the Worker, the handler **falls back to JS** and reports `fellBackToJs: true` on the `configured` response.
- Callers should treat that as success with JS math (no hang / no throw required for STFT/PSD).

## What Bot-B should / should not touch

| Bot-B owns | Bot-D owns |
|------------|------------|
| File System Access, chunked IQ read, MainChartHost wiring | `dsp_fft.wasm` artifacts, `Wasm*` engines, Worker engine protocol |
| Choosing `engine: 'wasm-fft'` when ready | M-07 FIR/resample/DDC WASM kernels; Package E DDC E2E helper |
| Narrowband UI / when to leave stub | Numerical acceptance evidence (no matrix PASS claim) |

**Do not** re-implement chunked STFT UI in Bot-D; only pass `engine` if product wants WASM FFT for Worker STFT/PSD.

## Related paths

- Protocol: `packages/dsp-wasm/src/worker/protocol.ts` (`DspFftEngineKind`)
- Client: `packages/dsp-wasm/src/worker/dsp-client.ts`
- Handler: `packages/dsp-wasm/src/worker/dsp-worker-handler.ts`
- DDC E2E helper: `apps/web/src/dsp/ddcFromChunkedReader.ts`
- Golden: `packages/dsp-wasm/src/wasm-stft.golden.test.ts`, `m07-narrowband-ddc-e2e.golden.test.ts`
