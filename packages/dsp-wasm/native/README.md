# Native DSP kernels for @wss/dsp-wasm (Emscripten)

## fft_radix2.cpp (Package B)

In-place radix-2 Cooley–Tukey FFT over **interleaved complex float64**.

```c
void fft_radix2(double* interleaved, int n_complex, int inverse);
```

## fir_resample_ddc.cpp (M-07)

Faithful ports of `fir.ts` / `rational-resample.ts` / `ddc.ts` (`mixDownLo`).

```c
void apply_fir_complex(const double* iq_in, int n_samples,
                       const double* taps, int n_taps, double* iq_out);
int  rational_resample_iq(const double* iq_in, int n_in, int L, int M,
                          const double* fir_taps, int n_taps, int skip_filter,
                          double* iq_out, int out_cap_samples);
void mix_down_lo(const double* iq_in, int n_samples,
                 double begin_index, double lo_hz, double sample_rate_hz,
                 double* iq_out);
```

dtype: **float64** for IQ + taps.

## Rebuild (requires emsdk)

```powershell
cd D:\\project\\wss-wt-d\\.work\\cache\\emsdk
.\\emsdk_env.bat
cd D:\\project\\wss-wt-d\\packages\\dsp-wasm
node scripts/build-wasm.mjs
```

Outputs: `wasm/dsp_fft.js` + `wasm/dsp_fft.wasm` (committed).
