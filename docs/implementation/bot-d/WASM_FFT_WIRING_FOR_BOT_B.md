# WASM FFT wiring for Bot-B (optional Worker engine)

Bot-D Package C added an **optional** DSP Worker FFT engine. Bot-B owns FSA / chunked STFT UI (`MainChartHost`, `stftFromChunkedReader`, etc.). This note is only how to **opt into** `engine: 'wasm-fft'` without changing defaults.

## Default (unchanged)

- Worker / client default engine is **`'js'`** (portable JS `fftRadix2` / `ReferenceStftEngine` / `ReferencePsdEngine`).
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

## Runtime switch

```ts
await client.configureEngine('wasm-fft');
await client.configureEngine('js'); // restore default
```

## Fallback

- If WASM module load fails inside the Worker, the handler **falls back to JS** and reports `fellBackToJs: true` on the `configured` response.
- Callers should treat that as success with JS math (no hang / no throw required for STFT/PSD).

## What Bot-B should / should not touch

| Bot-B owns | Bot-D owns |
|------------|------------|
| File System Access, chunked IQ read, MainChartHost wiring | `dsp_fft.wasm` artifacts, `Wasm*` engines, Worker engine protocol |
| Choosing `engine: 'wasm-fft'` when ready | M-07 FIR/resample/DDC WASM kernels (callable; DDC Worker switch not required) |

**Do not** re-implement chunked STFT UI in Bot-D; only pass `engine` if product wants WASM FFT for Worker STFT/PSD.

## Related paths

- Protocol: `packages/dsp-wasm/src/worker/protocol.ts` (`DspFftEngineKind`)
- Client: `packages/dsp-wasm/src/worker/dsp-client.ts`
- Handler: `packages/dsp-wasm/src/worker/dsp-worker-handler.ts`
- Golden: `packages/dsp-wasm/src/wasm-stft.golden.test.ts`
