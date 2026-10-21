/**
 * Simple AM envelope / FM discriminator previews from interleaved IQ (Bot-D G06).
 * Honest numerical helpers for the demodulation page — NOT product demod,
 * NOT bitstream / symbol decisions / protocol decode.
 */
export type SimpleDemodMode = 'am_envelope' | 'fm_discriminator' | 'rms';

export type SimpleDemodFromIqOptions = {
  /** Output overview length. Default 2048. */
  maxPoints?: number;
  /** Sample rate of the IQ (Hz); used to scale FM discriminator to Hz. */
  sampleRateHz?: number;
};

/** AM envelope = |z| = sqrt(I^2+Q^2), downsampled to maxPoints. */
export function amEnvelopeOverview(
  iqInterleaved: Float32Array,
  maxPoints = 2048,
): Float32Array {
  const sampleCount = Math.floor(iqInterleaved.length / 2);
  const n = Math.max(1, maxPoints);
  const out = new Float32Array(n);
  if (sampleCount <= 0) return out;
  for (let x = 0; x < n; x++) {
    const idx = Math.min(sampleCount - 1, Math.floor((x * sampleCount) / n));
    const i = iqInterleaved[idx * 2] ?? 0;
    const q = iqInterleaved[idx * 2 + 1] ?? 0;
    out[x] = Math.hypot(i, q);
  }
  return out;
}

/** RMS magnitude per overview bin. */
export function rmsOverview(
  iqInterleaved: Float32Array,
  maxPoints = 2048,
): Float32Array {
  const sampleCount = Math.floor(iqInterleaved.length / 2);
  const n = Math.max(1, maxPoints);
  const out = new Float32Array(n);
  if (sampleCount <= 0) return out;
  for (let x = 0; x < n; x++) {
    const a = Math.floor((x * sampleCount) / n);
    const b = Math.floor(((x + 1) * sampleCount) / n);
    const end = Math.max(a + 1, b);
    let acc = 0;
    let count = 0;
    for (let idx = a; idx < end && idx < sampleCount; idx++) {
      const i = iqInterleaved[idx * 2] ?? 0;
      const q = iqInterleaved[idx * 2 + 1] ?? 0;
      acc += i * i + q * q;
      count++;
    }
    out[x] = count > 0 ? Math.sqrt(acc / count) : 0;
  }
  return out;
}

/**
 * FM discriminator preview: unwrap(Δphase) * fs / (2π) → Hz deviation overview.
 * Not a PLL / not stereo / not RDS — raw phase-diff metric only.
 */
export function fmDiscriminatorOverview(
  iqInterleaved: Float32Array,
  options: SimpleDemodFromIqOptions = {},
): Float32Array {
  const sampleCount = Math.floor(iqInterleaved.length / 2);
  const n = Math.max(1, options.maxPoints ?? 2048);
  const out = new Float32Array(n);
  if (sampleCount < 2) return out;

  const fs = options.sampleRateHz ?? 1;
  const scale = fs / (2 * Math.PI);

  const diffs = new Float32Array(sampleCount - 1);
  let prev = Math.atan2(iqInterleaved[1] ?? 0, iqInterleaved[0] ?? 0);
  for (let idx = 1; idx < sampleCount; idx++) {
    const i = iqInterleaved[idx * 2] ?? 0;
    const q = iqInterleaved[idx * 2 + 1] ?? 0;
    const ph = Math.atan2(q, i);
    let d = ph - prev;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    diffs[idx - 1] = d * scale;
    prev = ph;
  }

  const diffCount = diffs.length;
  for (let x = 0; x < n; x++) {
    const idx = Math.min(diffCount - 1, Math.floor((x * diffCount) / n));
    out[x] = diffs[idx] ?? 0;
  }
  return out;
}

export function simpleDemodOverview(
  iqInterleaved: Float32Array,
  mode: SimpleDemodMode,
  options: SimpleDemodFromIqOptions = {},
): Float32Array {
  const maxPoints = options.maxPoints ?? 2048;
  switch (mode) {
    case 'am_envelope':
      return amEnvelopeOverview(iqInterleaved, maxPoints);
    case 'fm_discriminator':
      return fmDiscriminatorOverview(iqInterleaved, options);
    case 'rms':
      return rmsOverview(iqInterleaved, maxPoints);
    default: {
      const _exhaustive: never = mode;
      void _exhaustive;
      return amEnvelopeOverview(iqInterleaved, maxPoints);
    }
  }
}
