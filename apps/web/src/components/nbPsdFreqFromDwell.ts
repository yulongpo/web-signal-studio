/**
 * G18 NB PSD freq overlay recovery for dwell-only historic pins.
 * Desktop pinCursor always carries frequencyHz; web can have
 * narrowbandPinnedDwellIndex without linkedCursor.frequencyHz.
 * Prefer existing linkedCursor; else derive from frame PSD peak → xDomain;
 * else band center (desktop default when previous not pinned).
 * No new Bot-D store field.
 */
export type NbPsdFreqSource = 'linked' | 'dwell-peak' | 'dwell-center' | 'none';

export function freqHzFromFramePsdPeak(
  y: ArrayLike<number>,
  xMin: number,
  xMax: number,
): number | null {
  const n = y.length;
  if (!(n > 0) || !Number.isFinite(xMin) || !Number.isFinite(xMax)) return null;
  let peakI = 0;
  let peakV = -Infinity;
  for (let i = 0; i < n; i++) {
    const v = y[i];
    if (Number.isFinite(v) && v > peakV) {
      peakV = v;
      peakI = i;
    }
  }
  if (!(peakV > -Infinity)) return null;
  if (n === 1) return xMin;
  const t = peakI / (n - 1);
  return xMin + t * (xMax - xMin);
}

export function resolveNbPsdLinkedFreqHz(opts: {
  linkedPinned: boolean;
  linkedFrequencyHz: number;
  pinnedDwellIndex: number | null;
  psdMode: 'frame' | 'statistical' | string;
  framePsdY: ArrayLike<number> | null | undefined;
  xMin: number | null | undefined;
  xMax: number | null | undefined;
}): { freqHz: number | null; source: NbPsdFreqSource } {
  if (opts.linkedPinned && Number.isFinite(opts.linkedFrequencyHz)) {
    return { freqHz: opts.linkedFrequencyHz, source: 'linked' };
  }
  if (opts.pinnedDwellIndex == null) {
    return { freqHz: null, source: 'none' };
  }
  if (opts.psdMode !== 'frame') {
    return { freqHz: null, source: 'none' };
  }
  const xMin = opts.xMin;
  const xMax = opts.xMax;
  if (xMin == null || xMax == null || !Number.isFinite(xMin) || !Number.isFinite(xMax)) {
    return { freqHz: null, source: 'none' };
  }
  if (opts.framePsdY && opts.framePsdY.length > 0) {
    const peak = freqHzFromFramePsdPeak(opts.framePsdY, xMin, xMax);
    if (peak != null && Number.isFinite(peak)) {
      return { freqHz: peak, source: 'dwell-peak' };
    }
  }
  return { freqHz: (xMin + xMax) / 2, source: 'dwell-center' };
}
