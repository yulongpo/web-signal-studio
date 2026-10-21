import {
  type SampleIndex,
  type TimeRangeJson,
  assertSampleIndex,
  clampSampleIndex,
  compareSampleIndex,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
} from '@wss/contracts';

/** Half-open sample range [begin, end). All indices are bigint. */
export interface SampleRange {
  begin: SampleIndex;
  end: SampleIndex;
}

export function makeSampleRange(begin: SampleIndex, end: SampleIndex): SampleRange {
  if (end < begin) {
    throw new RangeError(
      `SampleRange end < begin: [${sampleIndexToDecimal(begin)}, ${sampleIndexToDecimal(end)})`,
    );
  }
  return { begin, end };
}

export function sampleRangeLength(range: SampleRange): SampleIndex {
  return range.end - range.begin;
}

export function sampleRangesOverlap(a: SampleRange, b: SampleRange): boolean {
  return a.begin < b.end && b.begin < a.end;
}

export function intersectSampleRanges(a: SampleRange, b: SampleRange): SampleRange | null {
  const begin = a.begin > b.begin ? a.begin : b.begin;
  const end = a.end < b.end ? a.end : b.end;
  if (end <= begin) return null;
  return { begin, end };
}

export function clampSampleRange(range: SampleRange, bounds: SampleRange): SampleRange {
  const begin = clampSampleIndex(range.begin, bounds.begin, bounds.end);
  const end = clampSampleIndex(range.end, bounds.begin, bounds.end);
  if (end < begin) return { begin, end: begin };
  return { begin, end };
}

export function compareSampleRanges(a: SampleRange, b: SampleRange): number {
  const c = compareSampleIndex(a.begin, b.begin);
  if (c !== 0) return c;
  return compareSampleIndex(a.end, b.end);
}

/**
 * Physical time helpers. Seconds may use number for UI; sample math stays bigint.
 * sample = round(seconds * sampleRateHz) with careful BigInt conversion for large T.
 */
export function sampleIndexFromSeconds(seconds: number, sampleRateHz: number): SampleIndex {
  if (!Number.isFinite(seconds) || !Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new RangeError('seconds/sampleRateHz must be finite and sampleRateHz > 0');
  }
  // Use string path for large products to avoid Number mantissa loss when possible.
  const product = seconds * sampleRateHz;
  if (!Number.isFinite(product)) {
    throw new RangeError('seconds * sampleRateHz overflowed Number');
  }
  return BigInt(Math.round(product));
}

export function secondsFromSampleIndex(index: SampleIndex, sampleRateHz: number): number {
  if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new RangeError('sampleRateHz must be finite and > 0');
  }
  // For indices beyond Number.MAX_SAFE_INTEGER, return Infinity-ish via Number(index)/rate
  // callers needing exact time should use rational arithmetic later.
  return Number(index) / sampleRateHz;
}

export function frequencyToBin(frequencyHz: number, sampleRateHz: number, fftSize: number): number {
  if (!(fftSize > 0) || (fftSize & (fftSize - 1)) !== 0) {
    throw new RangeError('fftSize must be a positive power of two');
  }
  const bin = Math.round((frequencyHz / sampleRateHz) * fftSize);
  const wrapped = ((bin % fftSize) + fftSize) % fftSize;
  return wrapped;
}

/**
 * Wire form for SampleRange: TimeRangeJson (begin/end canonical decimal strings).
 * Aligns domain half-open ranges with project-v6 / project-io time ranges.
 */
export function sampleRangeToJson(range: SampleRange): TimeRangeJson {
  return {
    begin: sampleIndexToDecimal(range.begin),
    end: sampleIndexToDecimal(range.end),
  };
}

export function sampleRangeFromJson(json: TimeRangeJson): SampleRange {
  return makeSampleRange(sampleIndexFromDecimal(json.begin), sampleIndexFromDecimal(json.end));
}

/** Accept bigint or canonical decimal string endpoints (protocol boundary). */
export function makeSampleRangeFromUnknown(begin: unknown, end: unknown): SampleRange {
  return makeSampleRange(assertSampleIndex(begin, 'SampleRange.begin'), assertSampleIndex(end, 'SampleRange.end'));
}
