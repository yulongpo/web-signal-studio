# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: Package B — Emscripten WASM FFT/PSD skeleton (golden vs JS)
- worktree: D:\\project\\wss-wt-d
- branch: work/bot-d-dsp
- base: e9c53e4 (origin/main tip at Package B start; includes Package A)
- package_scope: @wss/*
- shared_tree (D:\\project\\web_signal_studio): **no writes**
- rebuild: **read-only reference**

## Delivered (Package B)

### packages/dsp-wasm native + wasm artifact
- `native/fft_radix2.cpp` — faithful float64 port of `src/fft.ts` (bit-reversal + Cooley–Tukey + inverse 1/n)
- `native/README.md` — rebuild instructions
- `scripts/build-wasm.mjs` — invokes emcc (MODULARIZE + EXPORT_ES6)
- `wasm/dsp_fft.js` + `wasm/dsp_fft.wasm` — **committed** artifacts (vitest/CI need no emcc)
- Built with emsdk **6.0.13** (`eb132757325583b787fe9414b09afea9442b72ad`)

### TS boundary (`src/wasm/`)
- `loadDspFft.ts` — lazy `loadWasmFftModule()` / `isWasmFftAvailable()`
- `WasmFftEngine.ts` — `wasmFftRadix2` / in-place HEAPF64 path
- `WasmPsdEngine.ts` — `WasmReferencePsdEngine` (Welch/window path identical to JS; FFT via WASM)
- `computePsd(..., fft?)` — injectable FFT; JS `fftRadix2` remains default
- Exports from `src/index.ts` (JS reference path unchanged / still default)

### Golden tests
- `src/wasm-fft.golden.test.ts` — JS vs WASM FFT max-abs + peak bins; PSD peaks + bin powers within eps
- No fake numeric DSP results — WASM runs real FFT math

### Out of scope (later package per CAO)
- MainChartHost rewiring to real chunked read (separate package)

## Prior: Package A (IQ WAV + FSA → STFT Worker)

### packages/file-io
- wav-meta / wav-reader / blob-chunked-reader / fsa / buildPcm16LeStereoIqWav
- STFT loop helper `apps/web/src/dsp/stftFromChunkedReader.ts` (does not replace MainChartHost fixture)

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
