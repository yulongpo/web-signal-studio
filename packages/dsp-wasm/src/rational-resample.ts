/**
 * Rational resampler: outputRate = inputRate * L / M.
 *
 * Path (straightforward, polyphase-friendly structure):
 *   1. If L > 1: insert L-1 zeros between samples (upsample),
 *      then apply a lowpass (anti-image) with gain L.
 *   2. If M > 1: keep every M-th sample (downsample).
 *
 * When the caller already applied an anti-alias FIR at the input rate
 * (DDC order: mix → FIR → resample), pass `skipFilter: true` for the
 * L === 1 case so we only decimate. For L > 1 the interpolating filter
 * is still required after zero-insertion unless `skipFilter` is set
 * (then zeros alone + decimate — only safe if spectrum is already
 * band-limited well below the new Nyquist).
 */

import { applyFirComplex, designLowpassFir } from './fir.js';

export function rationalResampleIq(options: {
  iqInterleaved: Float32Array | Float64Array;
  interpolation: number;
  decimation: number;
  /** Optional interpolating / anti-image FIR (real taps). */
  firTaps?: Float64Array;
  /**
   * When true, skip the post-upsample filter (caller already filtered).
   * Default false when L > 1; ignored meaningfully when L === 1 (no filter needed for pure decimation).
   */
  skipFilter?: boolean;
}): Float32Array {
  const L = options.interpolation;
  const M = options.decimation;
  if (!Number.isInteger(L) || L < 1) {
    throw new RangeError(`interpolation must be integer >= 1, got ${L}`);
  }
  if (!Number.isInteger(M) || M < 1) {
    throw new RangeError(`decimation must be integer >= 1, got ${M}`);
  }

  const nIn = options.iqInterleaved.length / 2;
  if (!Number.isInteger(nIn)) {
    throw new RangeError('iqInterleaved length must be even');
  }

  let stage: Float32Array;

  if (L === 1) {
    stage =
      options.iqInterleaved instanceof Float32Array
        ? options.iqInterleaved
        : Float32Array.from(options.iqInterleaved);
  } else {
    // Zero-insert upsample
    const up = new Float32Array(nIn * L * 2);
    for (let i = 0; i < nIn; i++) {
      up[i * L * 2] = options.iqInterleaved[i * 2]!;
      up[i * L * 2 + 1] = options.iqInterleaved[i * 2 + 1]!;
    }

    if (options.skipFilter) {
      stage = up;
    } else {
      const taps =
        options.firTaps ??
        (() => {
          // Anti-image: cutoff at ~0.45/L of upsampled Nyquist, gain L
          const base = designLowpassFir({
            numTaps: 63,
            cutoffNyquist: 0.45 / L,
          });
          const scaled = new Float64Array(base.length);
          for (let i = 0; i < base.length; i++) scaled[i] = base[i]! * L;
          return scaled;
        })();
      // If caller supplied taps without gain L, still apply as-is (documented).
      stage = applyFirComplex(up, taps);
    }
  }

  if (M === 1) return stage;

  const nUp = stage.length / 2;
  const nOut = Math.floor(nUp / M);
  const out = new Float32Array(nOut * 2);
  for (let i = 0; i < nOut; i++) {
    const src = i * M;
    out[i * 2] = stage[src * 2]!;
    out[i * 2 + 1] = stage[src * 2 + 1]!;
  }
  return out;
}

export function outputSampleRateHz(
  sampleRateHz: number,
  interpolation: number,
  decimation: number,
): number {
  return (sampleRateHz * interpolation) / decimation;
}
