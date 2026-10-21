# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: Package C — WASM STFT + optional Worker wasm-fft engine
- worktree: D:\\project\\wss-wt-d
- branch: work/bot-d-dsp
- base: a148aee (origin/main tip at Package C start; includes Package B + Bot-B FSA/chunked STFT)
- package_scope: @wss/*
- shared_tree (D:\\project\\web_signal_studio): **no writes**
- rebuild: **read-only reference**
- MainChartHost: **untouched** (Bot-B owns FSA/chunked wiring)

## Delivered (Package C)

### Injectable STFT FFT
- `computeStft(request, iq, fft?)` — same `FftRadix2Fn` as PSD; JS `fftRadix2` remains default
- `ReferenceStftEngine` unchanged for existing callers

### WASM STFT
- `src/wasm/WasmStftEngine.ts` — `WasmReferenceStftEngine` / `computeStftWithFft`
- Reuses Package B `loadWasmFftModule` / `wasmFftRadix2WithModule`
- Exports from `src/index.ts` + `src/wasm/index.ts`

### Optional Worker engine
- Protocol: `configure` request + `configured` response; `engine: 'js' | 'wasm-fft'`
- Handler state shared per Worker / InProcess backend
- `DspWorkerClientOptions.engine` (default `'js'`) posts one-time configure
- `configureEngine()` / `ready()` APIs
- WASM load failure → fall back to JS (`fellBackToJs: true`); no hang

### Golden tests
- `src/wasm-stft.golden.test.ts` — JS vs WASM STFT frame/peaks/powers; in-process Worker wasm-fft path

### Out of scope
- MainChartHost / synthetic fixture rewiring (Bot-B)

## Prior: Package B (Emscripten WASM FFT/PSD)

### packages/dsp-wasm native + wasm artifact
- `native/fft_radix2.cpp`, `scripts/build-wasm.mjs`, committed `wasm/dsp_fft.{js,wasm}`
- `WasmFftEngine` / `WasmReferencePsdEngine` / injectable `computePsd(..., fft?)`

## Prior: Package A (IQ WAV + FSA → STFT Worker)

### packages/file-io
- wav-meta / wav-reader / blob-chunked-reader / fsa / buildPcm16LeStereoIqWav
- STFT loop helper `apps/web/src/dsp/stftFromChunkedReader.ts`

## Verify commands

```
npx vitest run packages/dsp-wasm
npx vitest run packages/file-io
npm run typecheck -w @wss/web
```

Rebuild WASM (optional, needs emsdk):

```
cd .work/cache/emsdk && emsdk_env.bat
npm run build:wasm -w @wss/dsp-wasm
```
