/**
 * Adaptive value parse/format parity with Qt AdaptiveValueEdit
 * (signal_studio_rebuild ui/controls/adaptive_value_edit.* @ 17471a6).
 * Used by DetectionCard param controls — never invents Fs or recognition.
 */

export type UnitKind = 'Frequency' | 'SampleRate' | 'Time' | 'Scalar';

const NUM_RE =
  /^\s*([+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)\s*([^\s]*)\s*$/;

export function parseAdaptiveValue(
  text: string,
  kind: UnitKind,
  allowNegative = false,
): number | null {
  const match = NUM_RE.exec(text);
  if (!match) return null;
  const raw = Number(match[1]);
  if (!Number.isFinite(raw)) return null;
  let unit = (match[2] ?? '').toLowerCase();
  let scale = 1;
  if (kind === 'Scalar') {
    if (unit !== '') return null;
  } else if (kind === 'Time') {
    if (unit === '' || unit === 'ms') scale = 0.001;
    else if (unit === 's') scale = 1;
    else if (unit === 'us' || unit === '\u00b5s') scale = 1e-6;
    else if (unit === 'ns') scale = 1e-9;
    else if (unit === 'min') scale = 60;
    else if (unit === 'h') scale = 3600;
    else return null;
  } else {
    const suffix = kind === 'Frequency' ? 'hz' : 's/s';
    if (kind === 'SampleRate' && unit.endsWith('sps')) {
      unit = unit.slice(0, -3) + 's/s';
    }
    if (unit === suffix || unit === '') scale = 1;
    else if (unit === 'k' || unit === 'k' + suffix) scale = 1e3;
    else if (unit === 'm' || unit === 'm' + suffix) scale = 1e6;
    else if (unit === 'g' || unit === 'g' + suffix) scale = 1e9;
    else return null;
  }
  const v = raw * scale;
  if (!Number.isFinite(v)) return null;
  if (
    v < 0 &&
    !(allowNegative && (kind === 'Frequency' || kind === 'Scalar'))
  ) {
    return null;
  }
  if (kind === 'SampleRate' && v === 0) return null;
  return v;
}

function trimTrailingZeros(numeric: string): string {
  if (!numeric.includes('.') || numeric.includes('e') || numeric.includes('E')) {
    return numeric;
  }
  let s = numeric;
  while (s.endsWith('0')) s = s.slice(0, -1);
  if (s.endsWith('.')) s = s.slice(0, -1);
  return s;
}

export function formatAdaptiveValue(value: number, kind: UnitKind): string {
  if (kind === 'Scalar') {
    // Shortest round-trip; avoid binary artifacts like 0.69999999999999996.
    return trimTrailingZeros(String(value));
  }
  let scale = 1;
  let unit = kind === 'SampleRate' ? 'S/s' : 'Hz';
  if (kind === 'Time') {
    scale = 0.001;
    unit = 'ms';
    if (value >= 1) {
      scale = 1;
      unit = 's';
    } else if (value > 0 && value < 0.001) {
      scale = 1e-6;
      unit = 'us';
    }
  } else if (Math.abs(value) >= 1e9) {
    scale = 1e9;
    unit = kind === 'SampleRate' ? 'GS/s' : 'GHz';
  } else if (Math.abs(value) >= 1e6) {
    scale = 1e6;
    unit = kind === 'SampleRate' ? 'MS/s' : 'MHz';
  } else if (Math.abs(value) >= 1e3) {
    scale = 1e3;
    unit = kind === 'SampleRate' ? 'kS/s' : 'kHz';
  }
  const precision =
    kind === 'Time' ? 9 : scale === 1 ? 0 : scale === 1e3 ? 3 : scale === 1e6 ? 6 : 9;
  const scaled = value / scale;
  const numeric =
    Math.floor(value) === value
      ? scaled.toFixed(precision)
      : String(scaled);
  return ${trimTrailingZeros(numeric)} ;
}

/** Physical-times / Fs notes for DetectionCard (Qt detectionPhysicalTimes). */
export function formatDetectionPhysicalTimes(args: {
  sampleRateHz: number | null | undefined;
  fftSize: number;
  hopMilliseconds: number;
  modelFrames: number;
  modelHopFrames: number;
}): { summary: string; details: string; hasFs: boolean } {
  const fs = args.sampleRateHz;
  if (fs == null || !(fs > 0) || !Number.isFinite(fs)) {
    return {
      summary: '\u89c2\u6d4b\u65f6\u957f\uff1a\u5f85\u8f7d\u5165\u771f\u5b9e IQ',
      details:
        'FFT \u7a97 / \u8c31\u6b65\u957f / \u6a21\u578b\u4e0a\u4e0b\u6587 / \u7a97\u53e3\u6ed1\u52a8\uff1a\u2014',
      hasFs: false,
    };
  }
  const fftPow2 = 1 << Math.ceil(Math.log2(Math.max(1, args.fftSize)));
  const fftMs = (fftPow2 / fs) * 1000;
  const hopSeconds = args.hopMilliseconds / 1000;
  const hopMs = (Math.floor(fs * hopSeconds) / fs) * 1000;
  const contextMs = fftMs + (args.modelFrames - 1) * hopMs;
  const slideMs = args.modelHopFrames * hopMs;
  const summary = \u8bf7\u6c42\u89c2\u6d4b  ms \u00b7 \u6ed1\u52a8  ms;
  const details = [
    FFT \u7a97  ms \u00b7 \u8c31\u6b65\u957f  ms,
    \u6a21\u578b\u4e0a\u4e0b\u6587\uff08\u8bf7\u6c42\uff09 \u5e27 /  ms,
    \u7a97\u53e3\u6ed1\u52a8  \u5e27 /  ms,
    \u4e0a\u4e0b\u6587\u6807\u79f0  ms\uff0c\u89c2\u6d4b\u652f\u6301\u542b FFT \u7a97\u3002,
    hop \u662f\u76f8\u90bb\u8c31\u5e27\u95f4\u9694\uff0c\u4e0d\u662f\u72ec\u7acb\u65f6\u95f4\u5206\u8fa8\u7387\u3002Fs= Hz\u3002,
  ].join('\n');
  return { summary, details, hasFs: true };
}

function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return '—';
  const s = v.toPrecision(6);
  return trimTrailingZeros(s);
}
