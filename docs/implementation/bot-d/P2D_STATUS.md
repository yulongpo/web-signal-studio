# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: Browser Worker backend + apps/web STFT wiring
- worktree: `D:\\project\\wss-wt-d`
- branch: `work/bot-d-dsp`
- base: `27f71e8` (origin/main tip at sync)
- package_scope: `@wss/*`
- shared_tree (`D:\\project\\web_signal_studio`): **no writes**
- rebuild: **never touch**

## Delivered (this drop)

### Browser Worker (`packages/dsp-wasm/src/worker/`)
- `browser-backend.ts` — `BrowserWorkerBackend` via `globalThis.Worker` + Vite-friendly `new URL('./dsp-worker.ts', import.meta.url)`; clear throw when Worker missing
- `createBrowserWorkerBackend` / `createBrowserDspWorkerClient` (AbortSignal cancel via existing protocol)
- `dsp-worker.ts` remains browser `self.onmessage` entry (shared handler)
- Exports from `packages/dsp-wasm/src/index.ts`

### apps/web wiring
- deps: `@wss/dsp-wasm`, `@wss/file-io`
- vite aliases + `worker.format: 'es'` + optimizeDeps exclude
- `src/dsp/useDspWorkerClient.ts` — create once, dispose on unmount (browser Worker with in-process fallback)
- `src/dsp/computeMainSpectrogram.ts` — labeled synthetic two-tone IQ → STFT → chart power (`sourceLabel: 'synthetic fixture'`)
- `MainChartHost.tsx` — real STFT path when client ready; `data-dsp-source="synthetic-stft-worker"`; demo synthPower only as loading/fallback

### Tests
- `worker/browser-backend.test.ts` — constructor guard + FakeWorker; live Worker gated with `describe.skipIf`
- `apps/web/src/dsp/computeMainSpectrogram.test.ts` — InProcessAsyncBackend inject (no browser Worker in CI)

### contracts
- Consume only. No ownership change.

## Test results

```
npx vitest run packages/file-io packages/dsp-wasm
 Test Files  8 passed (8)
      Tests  27 passed | 1 skipped (28)

apps/web: npx vitest run
 Test Files  2 passed (2)
      Tests  6 passed (6)

npx vitest run (root packages)
 (see commit shortstat / local run)
```