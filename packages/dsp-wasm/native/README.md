# Native DSP kernels for @wss/dsp-wasm (Emscripten)

## fft_radix2.cpp

In-place radix-2 Cooley–Tukey FFT over **interleaved complex float64**
`[re0, im0, re1, im1, ...]`. Faithful port of `src/fft.ts` (bit-reversal +
butterflies + inverse `1/n` scale).

ABI:

```c
void fft_radix2(double* interleaved, int n_complex, int inverse);
```

## Rebuild (requires emsdk)

```powershell
# From repo root / packages/dsp-wasm
# Prefer worktree cache:
#   D:\project\wss-wt-d\.work\cache\emsdk
cd D:\project\wss-wt-d\.work\cache\emsdk
.\emsdk_env.bat
cd D:\project\wss-wt-d\packages\dsp-wasm
node scripts/build-wasm.mjs
```

Outputs land in `wasm/dsp_fft.js` + `wasm/dsp_fft.wasm` (committed so CI/vitest
need no emcc).

Pinned build used for Package B: emsdk **6.0.13**
(`eb132757325583b787fe9414b09afea9442b72ad`).
