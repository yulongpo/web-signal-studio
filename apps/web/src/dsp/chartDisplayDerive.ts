/**
 * Derive nav envelope / aux Wave / aux PSD from main spectrogram power.
 * Display-only — not detection / demod. Wave is STFT time-envelope (not raw IQ).
 */

export type SpectrogramDisplaySource = {
  power: Float32Array;
  binCount: number;
  frameCount: number;
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
};

/** Max-across-frequency envelope per time frame → [0,1] for navigation strip. */
export function deriveNavEnvelope(src: SpectrogramDisplaySource): Float32Array {
  const { power, binCount, frameCount } = src;
  const out = new Float32Array(frameCount);
  let peak = 1e-12;
  for (let t = 0; t < frameCount; t++) {
    let m = 0;
    const base = t * binCount;
    for (let f = 0; f < binCount; f++) {
      const v = power[base + f] ?? 0;
      if (v > m) m = v;
    }
    out[t] = m;
    if (m > peak) peak = m;
  }
  for (let i = 0; i < out.length; i++) out[i] = out[i]! / peak;
  return out;
}

/**
 * Waveform-like series for the linked time window: max-across-freq per frame
 * in [win.min, win.max], amplitude in linear power (display).
 */
export function deriveWaveInWindow(
  src: SpectrogramDisplaySource,
  win: { min: number; max: number },
): { y: Float32Array; xDomain: { min: number; max: number; unit: string; label: string } } {
  const { power, binCount, frameCount, timeSec } = src;
  const span = Math.max(1e-15, timeSec.max - timeSec.min);
  const i0 = Math.max(
    0,
    Math.min(frameCount - 1, Math.floor(((win.min - timeSec.min) / span) * frameCount)),
  );
  const i1 = Math.max(
    i0 + 1,
    Math.min(frameCount, Math.ceil(((win.max - timeSec.min) / span) * frameCount)),
  );
  const n = Math.max(2, i1 - i0);
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i0 + i;
    let m = 0;
    const base = t * binCount;
    for (let f = 0; f < binCount; f++) {
      const v = power[base + f] ?? 0;
      if (v > m) m = v;
    }
    y[i] = m;
  }
  return {
    y,
    xDomain: {
      min: win.min,
      max: win.max,
      unit: "s",
      label: "Time",
    },
  };
}

/** PSD-like: max-across-time (optionally windowed) → dB-ish curve vs frequency. */
export function derivePsdInWindow(
  src: SpectrogramDisplaySource,
  win: { min: number; max: number } | null,
): { y: Float32Array; xDomain: { min: number; max: number; unit: string; label: string } } {
  const { power, binCount, frameCount, freqHz, timeSec } = src;
  let t0 = 0;
  let t1 = frameCount;
  if (win) {
    const span = Math.max(1e-15, timeSec.max - timeSec.min);
    t0 = Math.max(
      0,
      Math.min(frameCount - 1, Math.floor(((win.min - timeSec.min) / span) * frameCount)),
    );
    t1 = Math.max(
      t0 + 1,
      Math.min(frameCount, Math.ceil(((win.max - timeSec.min) / span) * frameCount)),
    );
  }
  const y = new Float32Array(binCount);
  for (let f = 0; f < binCount; f++) {
    let m = 0;
    for (let t = t0; t < t1; t++) {
      const v = power[t * binCount + f] ?? 0;
      if (v > m) m = v;
    }
    y[f] = 10 * Math.log10(Math.max(m, 1e-12));
  }
  return {
    y,
    xDomain: {
      min: freqHz.min,
      max: freqHz.max,
      unit: "Hz",
      label: "Frequency",
    },
  };
}
