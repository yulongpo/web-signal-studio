/**
 * Complex FIR, rational resample, and LO mix-down for M-07.
 * Faithful ports of src/fir.ts, src/rational-resample.ts, src/ddc.ts (mixDownLo).
 *
 * dtype: float64 (IEEE double) for IQ + taps.
 */

#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <cstring>

#if defined(__EMSCRIPTEN__)
#include <emscripten.h>
#define DSP_KEEPALIVE EMSCRIPTEN_KEEPALIVE
#else
#define DSP_KEEPALIVE
#endif

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

extern "C" {

DSP_KEEPALIVE
void apply_fir_complex(
    const double* iq_in,
    int n_samples,
    const double* taps,
    int n_taps,
    double* iq_out) {
  if (!iq_in || !taps || !iq_out || n_samples < 0 || n_taps < 1) {
    return;
  }
  for (int n = 0; n < n_samples; n++) {
    double acc_i = 0.0;
    double acc_q = 0.0;
    for (int k = 0; k < n_taps; k++) {
      const int src = n - k;
      if (src < 0) continue;
      const double t = taps[k];
      acc_i += iq_in[src * 2] * t;
      acc_q += iq_in[src * 2 + 1] * t;
    }
    iq_out[n * 2] = acc_i;
    iq_out[n * 2 + 1] = acc_q;
  }
}

DSP_KEEPALIVE
void mix_down_lo(
    const double* iq_in,
    int n_samples,
    double begin_index,
    double lo_hz,
    double sample_rate_hz,
    double* iq_out) {
  if (!iq_in || !iq_out || n_samples < 0 || !(sample_rate_hz > 0.0)) {
    return;
  }
  if (lo_hz == 0.0) {
    std::memcpy(iq_out, iq_in, static_cast<size_t>(n_samples) * 2 * sizeof(double));
    return;
  }
  const double two_pi = 2.0 * M_PI;
  for (int i = 0; i < n_samples; i++) {
    const double n = begin_index + static_cast<double>(i);
    const double phase = (-two_pi * lo_hz * n) / sample_rate_hz;
    const double c = std::cos(phase);
    const double s = std::sin(phase);
    const double re = iq_in[i * 2];
    const double im = iq_in[i * 2 + 1];
    iq_out[i * 2] = re * c - im * s;
    iq_out[i * 2 + 1] = re * s + im * c;
  }
}

DSP_KEEPALIVE
int rational_resample_iq(
    const double* iq_in,
    int n_in,
    int L,
    int M,
    const double* fir_taps,
    int n_taps,
    int skip_filter,
    double* iq_out,
    int out_cap_samples) {
  if (!iq_in || !iq_out || n_in < 0 || L < 1 || M < 1 || out_cap_samples < 0) {
    return -1;
  }

  double* up = nullptr;
  double* filtered = nullptr;
  const double* stage = nullptr;
  int n_up = 0;
  int rc = -1;

  if (L == 1) {
    stage = iq_in;
    n_up = n_in;
  } else {
    n_up = n_in * L;
    up = static_cast<double*>(std::malloc(static_cast<size_t>(n_up) * 2 * sizeof(double)));
    if (!up) return -1;
    std::memset(up, 0, static_cast<size_t>(n_up) * 2 * sizeof(double));
    for (int i = 0; i < n_in; i++) {
      up[i * L * 2] = iq_in[i * 2];
      up[i * L * 2 + 1] = iq_in[i * 2 + 1];
    }
    if (skip_filter) {
      stage = up;
    } else {
      if (!fir_taps || n_taps < 1) {
        std::free(up);
        return -1;
      }
      filtered = static_cast<double*>(std::malloc(static_cast<size_t>(n_up) * 2 * sizeof(double)));
      if (!filtered) {
        std::free(up);
        return -1;
      }
      apply_fir_complex(up, n_up, fir_taps, n_taps, filtered);
      stage = filtered;
    }
  }

  if (M == 1) {
    if (out_cap_samples < n_up) goto done;
    if (stage != iq_out) {
      std::memcpy(iq_out, stage, static_cast<size_t>(n_up) * 2 * sizeof(double));
    }
    rc = n_up;
    goto done;
  }

  {
    const int n_out = n_up / M;
    if (out_cap_samples < n_out) goto done;
    for (int i = 0; i < n_out; i++) {
      const int src = i * M;
      iq_out[i * 2] = stage[src * 2];
      iq_out[i * 2 + 1] = stage[src * 2 + 1];
    }
    rc = n_out;
  }

done:
  if (filtered) std::free(filtered);
  if (up) std::free(up);
  return rc;
}

}  // extern "C"
