import type { SpectralWindowName } from '@wss/contracts';

/** Build a real-valued window of length n. */
export function makeWindow(
  name: SpectralWindowName,
  n: number,
  kaiserBeta: number = 8.6,
): Float64Array {
  if (!Number.isInteger(n) || n <= 0) {
    throw new RangeError(`window length must be positive integer, got ${n}`);
  }
  const w = new Float64Array(n);
  switch (name) {
    case 'rectangular':
      w.fill(1);
      break;
    case 'hann':
      if (n === 1) {
        w[0] = 1;
      } else {
        for (let i = 0; i < n; i++) {
          w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
        }
      }
      break;
    case 'hamming':
      for (let i = 0; i < n; i++) {
        w[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (n - 1 || 1));
      }
      break;
    case 'blackman':
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / (n - 1 || 1);
        w[i] = 0.42 - 0.5 * Math.cos(a) + 0.08 * Math.cos(2 * a);
      }
      break;
    case 'blackman_harris':
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / (n - 1 || 1);
        w[i] =
          0.35875 -
          0.48829 * Math.cos(a) +
          0.14128 * Math.cos(2 * a) -
          0.01168 * Math.cos(3 * a);
      }
      break;
    case 'flat_top':
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * i) / (n - 1 || 1);
        w[i] =
          0.21557895 -
          0.41663158 * Math.cos(a) +
          0.277263158 * Math.cos(2 * a) -
          0.083578947 * Math.cos(3 * a) +
          0.006947368 * Math.cos(4 * a);
      }
      break;
    case 'kaiser': {
      // Default β=8.6 (desktop / DEFAULT_KAISER_BETA); overridable via StftRequest.kaiserBeta.
      const beta = Number.isFinite(kaiserBeta) && kaiserBeta >= 0 ? kaiserBeta : 8.6;
      const denom = besselI0(beta);
      const alpha = (n - 1) / 2;
      for (let i = 0; i < n; i++) {
        const r = (i - alpha) / alpha;
        const arg = beta * Math.sqrt(Math.max(0, 1 - r * r));
        w[i] = besselI0(arg) / denom;
      }
      break;
    }
    default: {
      const _exhaustive: never = name;
      throw new Error(`unsupported window: ${String(_exhaustive)}`);
    }
  }
  return w;
}

function besselI0(x: number): number {
  // Series expansion sufficient for window generation.
  let sum = 1;
  let term = 1;
  const x2 = (x * x) / 4;
  for (let k = 1; k < 40; k++) {
    term *= x2 / (k * k);
    sum += term;
    if (term < 1e-12 * sum) break;
  }
  return sum;
}

/** Coherent gain: mean of window (for amplitude scaling). */
export function windowCoherentGain(w: Float64Array): number {
  let s = 0;
  for (let i = 0; i < w.length; i++) s += w[i]!;
  return s / w.length;
}

/** Noise-equivalent bandwidth factor: sum(w^2) / (sum(w)^2 / N) helper → sum(w²). */
export function windowPowerSum(w: Float64Array): number {
  let s = 0;
  for (let i = 0; i < w.length; i++) {
    const v = w[i]!;
    s += v * v;
  }
  return s;
}
