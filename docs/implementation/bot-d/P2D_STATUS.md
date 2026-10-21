# Bot-D P2-D status

- updated_at: 2026-10-21 (Asia/Shanghai)
- stage: M-07 — WASM FIR / rational resample / LO mix + DDC golden (+ Bot-B wasm-fft wiring doc)
- worktree: D:\\project\\wss-wt-d
- branch: work/bot-d-dsp
- base: 389b135 (origin/main tip at package start; includes Package C WASM STFT)
- package_scope: @wss/*
- shared_tree (D:\\project\\web_signal_studio): **no writes**
- rebuild: **read-only reference**
- MainChartHost: **untouched** (Bot-B)
- ACCEPTANCE_MATRIX M-07: **not** marked PASS (QA/Bot-G)

## Delivered (M-07 numerical path)

### Native + artifact
- `native/fir_resample_ddc.cpp` — `apply_fir_complex`, `rational_resample_iq`, `mix_down_lo`
- Same module as FFT: rebuild via `scripts/build-wasm.mjs` → committed `wasm/dsp_fft.{js,wasm}`
- dtype: float64 kernels; Float32 IQ API

### TS boundary
- `WasmFirEngine` / `wasmApplyFirComplex` / `wasmRationalResampleIq` / `wasmMixDownLo`
- `WasmReferenceDdcEngine` / `computeDdcWithWasmModule` (optional)
- JS `ReferenceDdcEngine` / `computeDdc` remain **default**
- Worker DDC still JS (engine flag still FFT-only)

### Golden + evidence
- `src/wasm-m07.golden.test.ts`
- `docs/acceptance/evidence/bot-d/m07_ddc_fir_resample_2026-10-21.md` (+ JSON meta)

### Bot-B wiring doc
- `docs/implementation/bot-d/WASM_FFT_WIRING_FOR_BOT_B.md`

## Prior packages
- C: WASM STFT + optional Worker `wasm-fft`
- B: Emscripten FFT/PSD
- A: IQ WAV + FSA → STFT Worker helpers

## Verify

```
npx vitest run packages/dsp-wasm
npx vitest run packages/file-io
npm run typecheck -w @wss/web
```
