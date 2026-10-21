/**
 * Complex FIR helpers for DDC.
 *
 * Default lowpass design (when caller omits firTaps):
 *   cutoff as a fraction of input Nyquist (1.0 = fs/2):
 *     cutoffNyquist = 0.45 / max(interpolation, decimation)
 *   absolute cutoff Hz = cutoffNyquist * (fs / 2)
 *   normalized f_c / fs = cutoffNyquist / 2
 *
 * Windowed-sinc (Hann window) of odd length (default 63 taps).
 */

/** Design a real-valued windowed-sinc lowpass (odd tap count). */
export function designLowpassFir(options: {
  numTaps: number;
  /** Cutoff as fraction of Nyquist (0..1), where 1 = fs/2. */
  cutoffNyquist: number;
}): Float64Array {
  let { numTaps, cutoffNyquist } = options;
  if (!Number.isInteger(numTaps) || numTaps < 3) {
    throw new RangeError(`FIR numTaps must be integer >= 3, got ${numTaps}`);
  }
  if (numTaps % 2 === 0) numTaps += 1; // force odd
  if (!(cutoffNyquist > 0 && cutoffNyquist < 1)) {
    throw new RangeError(`cutoffNyquist must be in (0,1), got ${cutoffNyquist}`);
  }

  const fc = cutoffNyquist / 2; // fraction of fs
  const M = (numTaps - 1) / 2;
  const taps = new Float64Array(numTaps);
  let sum = 0;
  for (let n = 0; n < numTaps; n++) {
    const k = n - M;
    let h: number;
    if (k === 0) {
      h = 2 * fc;
    } else {
      h = Math.sin(2 * Math.PI * fc * k) / (Math.PI * k);
    }
    // Hann window
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / (numTaps - 1));
    taps[n] = h * w;
    sum += taps[n]!;
  }
  // Unity DC gain
  for (let n = 0; n < numTaps; n++) taps[n]! /= sum;
  return taps;
}

/**
 * Default DDC anti-alias / anti-image cutoff from rational rate change.
 * Formula: cutoffNyquist = 0.45 / max(interpolation, decimation)
 */
export function defaultDdcCutoffNyquist(interpolation: number, decimation: number): number {
  const m = Math.max(interpolation, decimation);
  if (!(m >= 1)) throw new RangeError('interpolation/decimation must be >= 1');
  return 0.45 / m;
}

export function defaultDdcFirTaps(
  interpolation: number,
  decimation: number,
  numTaps = 63,
): Float64Array {
  return designLowpassFir({
    numTaps,
    cutoffNyquist: defaultDdcCutoffNyquist(interpolation, decimation),
  });
}

/**
 * Apply a real FIR to complex IQ (interleaved Float32 or Float64).
 * Same length output: causal filter with zero prehistory (leading transient).
 * I and Q are filtered independently with the same real taps.
 */
export function applyFirComplex(
  iqInterleaved: Float32Array | Float64Array,
  taps: Float64Array,
): Float32Array {
  const nSamples = iqInterleaved.length / 2;
  if (!Number.isInteger(nSamples)) {
    throw new RangeError('iqInterleaved length must be even');
  }
  const nTaps = taps.length;
  if (nTaps < 1) throw new RangeError('FIR taps empty');

  const out = new Float32Array(nSamples * 2);
  for (let n = 0; n < nSamples; n++) {
    let accI = 0;
    let accQ = 0;
    for (let k = 0; k < nTaps; k++) {
      const src = n - k;
      if (src < 0) continue;
      const t = taps[k]!;
      accI += iqInterleaved[src * 2]! * t;
      accQ += iqInterleaved[src * 2 + 1]! * t;
    }
    out[n * 2] = accI;
    out[n * 2 + 1] = accQ;
  }
  return out;
}
