/**
 * G18 NB multi-view linked overlays beyond PSD vline / dwell-only freq.
 * Mirrors desktop NarrowbandWorkspace::updateLinkedCursors —
 * waveform_/psd_/stft_/modulationStft_/recognitionStft_ all receive
 * the same LinkedCursorState (recognition web pane still BLOCKED chrome).
 */
export type NbStftLinkedCursor = {
  xValue: number;
  yValue: number;
  pinned: true;
};

/** Wave linkedX: prefer store time when pinned; else dwell-mapped time. */
export function resolveNbWaveLinkedTimeSec(opts: {
  linkedPinned: boolean;
  linkedTimeSec: number;
  dwellTimeSec: number | null;
}): number | null {
  if (opts.linkedPinned && Number.isFinite(opts.linkedTimeSec)) {
    return opts.linkedTimeSec;
  }
  if (opts.dwellTimeSec != null && Number.isFinite(opts.dwellTimeSec)) {
    return opts.dwellTimeSec;
  }
  return null;
}

/**
 * STFT crosshair (time X, freq Y in stft mode).
 * Prefer pinned linkedCursor; dwell-only falls back to dwell time + resolved freq
 * (desktop pinCursor always carries frequencyHz).
 */
export function resolveNbStftLinkedCursor(opts: {
  linkedPinned: boolean;
  linkedTimeSec: number;
  linkedFrequencyHz: number;
  dwellTimeSec: number | null;
  resolvedFreqHz: number | null;
}): NbStftLinkedCursor | null {
  if (
    opts.linkedPinned &&
    Number.isFinite(opts.linkedTimeSec) &&
    Number.isFinite(opts.linkedFrequencyHz)
  ) {
    return {
      xValue: opts.linkedTimeSec,
      yValue: opts.linkedFrequencyHz,
      pinned: true,
    };
  }
  if (
    opts.dwellTimeSec != null &&
    Number.isFinite(opts.dwellTimeSec) &&
    opts.resolvedFreqHz != null &&
    Number.isFinite(opts.resolvedFreqHz)
  ) {
    return {
      xValue: opts.dwellTimeSec,
      yValue: opts.resolvedFreqHz,
      pinned: true,
    };
  }
  return null;
}
