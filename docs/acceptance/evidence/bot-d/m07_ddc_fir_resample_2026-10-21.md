# M-07 evidence — DDC / FIR / rational resample (Bot-D numerical path)

- date: 2026-10-21 (Asia/Shanghai)
- worktree: `D:\\project\\wss-wt-d`
- branch: `work/bot-d-dsp`
- baseline: `389b135`
- owner: Bot-D (numerical kernels + golden). **QA / Bot-G owns ACCEPTANCE_MATRIX PASS** — this doc does **not** flip M-07 to PASS.

## What was delivered

1. Native Emscripten kernels (`native/fir_resample_ddc.cpp`) linked into committed `wasm/dsp_fft.{js,wasm}`:
   - `apply_fir_complex` — complex FIR (real taps on I/Q independently)
   - `rational_resample_iq` — upsample → FIR → downsample
   - `mix_down_lo` — complex LO mix-down
2. TS boundary: `WasmFirEngine` / `wasmApplyFirComplex` / `wasmRationalResampleIq` / `WasmReferenceDdcEngine`
3. **JS defaults unchanged**: `ReferenceDdcEngine` / `computeDdc` / Worker default `engine: 'js'`

## dtype

- WASM kernels: **float64** (IEEE double) for IQ + taps (matches JS `Number` accumulation).
- Public API: Float32 IQ in/out (same as JS `applyFirComplex` / `rationalResampleIq` / `mixDownLo`).

## Commands run

```
npx vitest run packages/dsp-wasm
npx vitest run packages/file-io
npm run typecheck -w @wss/web
```

Rebuild (optional; artifacts committed):

```
cd D:\\project\\wss-wt-d\\.work\\cache\\emsdk
.\\emsdk_env.bat
cd D:\\project\\wss-wt-d\\packages\\dsp-wasm
node scripts/build-wasm.mjs
```

## Golden coverage (`src/wasm-m07.golden.test.ts`)

| Case | Expectation |
|------|-------------|
| JS vs WASM FIR | max abs err < 1e-5 on known taps+IQ |
| JS vs WASM rational resample (L=1,M=4) | length/rate match; peak bin after decimate |
| JS vs WASM rational resample (L=2,M=3) | sample parity |
| JS vs WASM mixDownLo | max abs err < 1e-5 |
| JS vs WasmReferenceDdcEngine | sample parity; tone→DC peak |
| Wasm DDC two-tone | DC ≫ far band (≥20×); peak near DC |

## Matrix note

Do **not** mark `ACCEPTANCE_MATRIX` M-07 as PASS from this evidence alone. Hand off to QA/Bot-G.
