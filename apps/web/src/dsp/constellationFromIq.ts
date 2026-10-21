/**
 * Pure constellation downsample from interleaved float32 IQ (Bot-D G06).
 * Honest I/Q scatter points for modulation page — not a classifier, not eye diagram.
 */
export type ConstellationPoint = { i: number; q: number };

export type ConstellationFromIqOptions = {
  /** Max points to keep (uniform stride). Default 2048. */
  maxPoints?: number;
  /** Skip leading samples (e.g. FIR settle). Default 0. */
  skipSamples?: number;
};

/**
 * Downsample interleaved IQ → constellation points (I,Q).
 * Empty input → empty array (callers show waiting / blocked UI).
 */
export function constellationFromIq(
  iqInterleaved: Float32Array,
  options: ConstellationFromIqOptions = {},
): ConstellationPoint[] {
  const maxPoints = Math.max(1, options.maxPoints ?? 2048);
  const skip = Math.max(0, options.skipSamples ?? 0);
  const sampleCount = Math.floor(iqInterleaved.length / 2);
  if (sampleCount <= skip) return [];

  const usable = sampleCount - skip;
  const n = Math.min(maxPoints, usable);
  const stride = usable / n;
  const out: ConstellationPoint[] = new Array(n);
  for (let k = 0; k < n; k++) {
    const idx = skip + Math.min(usable - 1, Math.floor(k * stride));
    out[k] = {
      i: iqInterleaved[idx * 2] ?? 0,
      q: iqInterleaved[idx * 2 + 1] ?? 0,
    };
  }
  return out;
}

/** Axis-aligned bounding box of constellation points (for canvas scale). */
export function constellationBounds(points: ConstellationPoint[]): {
  iMin: number;
  iMax: number;
  qMin: number;
  qMax: number;
} {
  if (points.length === 0) {
    return { iMin: -1, iMax: 1, qMin: -1, qMax: 1 };
  }
  let iMin = Infinity;
  let iMax = -Infinity;
  let qMin = Infinity;
  let qMax = -Infinity;
  for (const p of points) {
    if (p.i < iMin) iMin = p.i;
    if (p.i > iMax) iMax = p.i;
    if (p.q < qMin) qMin = p.q;
    if (p.q > qMax) qMax = p.q;
  }
  const padI = Math.max(1e-6, (iMax - iMin) * 0.05) || 0.1;
  const padQ = Math.max(1e-6, (qMax - qMin) * 0.05) || 0.1;
  return {
    iMin: iMin - padI,
    iMax: iMax + padI,
    qMin: qMin - padQ,
    qMax: qMax + padQ,
  };
}
