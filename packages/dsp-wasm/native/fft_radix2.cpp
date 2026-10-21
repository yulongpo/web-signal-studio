/**
 * In-place radix-2 Cooley–Tukey FFT over interleaved complex float64
 * [re0, im0, re1, im1, ...]. Faithful port of packages/dsp-wasm/src/fft.ts.
 *
 * ABI: void fft_radix2(double* interleaved, int n_complex, int inverse)
 *   - interleaved: length 2 * n_complex doubles
 *   - n_complex: power of two
 *   - inverse: non-zero => inverse FFT with 1/n scale (same as TS)
 *
 * dtype: float64 (IEEE double) for bit-close parity with the JS reference.
 */

#include <cmath>
#include <cstdint>

#if defined(__EMSCRIPTEN__)
#include <emscripten.h>
#define DSP_KEEPALIVE EMSCRIPTEN_KEEPALIVE
#else
#define DSP_KEEPALIVE
#endif

static bool is_power_of_two(int n) {
  return n > 0 && (n & (n - 1)) == 0;
}

extern "C" {

DSP_KEEPALIVE
void fft_radix2(double* interleaved, int n_complex, int inverse) {
  if (!interleaved || !is_power_of_two(n_complex)) {
    return;
  }

  // Bit-reversal permutation (same loop as fft.ts)
  for (int i = 1, j = 0; i < n_complex; i++) {
    int bit = n_complex >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const int ir = i * 2;
      const int jr = j * 2;
      const double tr = interleaved[ir];
      const double ti = interleaved[ir + 1];
      interleaved[ir] = interleaved[jr];
      interleaved[ir + 1] = interleaved[jr + 1];
      interleaved[jr] = tr;
      interleaved[jr + 1] = ti;
    }
  }

  const double sign = inverse ? 1.0 : -1.0;
  for (int len = 2; len <= n_complex; len <<= 1) {
    const double ang = (sign * (2.0 * 3.14159265358979323846)) / static_cast<double>(len);
    const double wlen_re = std::cos(ang);
    const double wlen_im = std::sin(ang);
    for (int i = 0; i < n_complex; i += len) {
      double w_re = 1.0;
      double w_im = 0.0;
      const int half = len / 2;
      for (int j = 0; j < half; j++) {
        const int u_index = (i + j) * 2;
        const int v_index = (i + j + half) * 2;
        const double u_re = interleaved[u_index];
        const double u_im = interleaved[u_index + 1];
        const double v_re0 = interleaved[v_index];
        const double v_im0 = interleaved[v_index + 1];
        const double v_re = v_re0 * w_re - v_im0 * w_im;
        const double v_im = v_re0 * w_im + v_im0 * w_re;
        interleaved[u_index] = u_re + v_re;
        interleaved[u_index + 1] = u_im + v_im;
        interleaved[v_index] = u_re - v_re;
        interleaved[v_index + 1] = u_im - v_im;
        const double next_w_re = w_re * wlen_re - w_im * wlen_im;
        w_im = w_re * wlen_im + w_im * wlen_re;
        w_re = next_w_re;
      }
    }
  }

  if (inverse) {
    const double scale = 1.0 / static_cast<double>(n_complex);
    const int n = n_complex * 2;
    for (int i = 0; i < n; i++) interleaved[i] *= scale;
  }
}

}  // extern "C"
