import { describe, expect, it } from 'vitest';
import {
  SAMPLE_INDEX_MAX,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
} from '@wss/contracts';
import {
  clampSampleRange,
  compareSampleRanges,
  intersectSampleRanges,
  makeSampleRange,
  makeSampleRangeFromUnknown,
  sampleIndexFromSeconds,
  sampleRangeFromJson,
  sampleRangeLength,
  sampleRangeToJson,
  sampleRangesOverlap,
  secondsFromSampleIndex,
} from './sample-range.js';

const PAST = (1n << 53n) + 99n; // 9007199254741091
const PAST2 = (1n << 53n) + 1000n;

describe('M-10 domain SampleRange protocol alignment', () => {
  it('makeSampleRange rejects end < begin and keeps bigint endpoints', () => {
    const range = makeSampleRange(PAST, PAST2);
    expect(range.begin).toBe(PAST);
    expect(range.end).toBe(PAST2);
    expect(sampleRangeLength(range)).toBe(PAST2 - PAST);
    expect(() => makeSampleRange(PAST2, PAST)).toThrow(RangeError);
  });

  it('JSON wire roundtrip uses canonical decimal strings (not Number)', () => {
    const range = makeSampleRange(PAST, SAMPLE_INDEX_MAX);
    const json = sampleRangeToJson(range);
    expect(typeof json.begin).toBe('string');
    expect(typeof json.end).toBe('string');
    expect(json.begin).toBe(sampleIndexToDecimal(PAST));
    expect(json.end).toBe(sampleIndexToDecimal(SAMPLE_INDEX_MAX));

    const wrapped = JSON.stringify({ time: json });
    const parsed = JSON.parse(wrapped) as { time: { begin: unknown; end: unknown } };
    expect(typeof parsed.time.begin).toBe('string');
    expect(parsed.time.begin).toBe(json.begin);
    expect(parsed.time.end).toBe(json.end);

    // Bare numeric JSON would lose past-safe precision
    const lost = JSON.parse(json.begin) as number;
    expect(BigInt(Math.trunc(lost))).not.toBe(PAST);

    const back = sampleRangeFromJson(parsed.time as { begin: string; end: string });
    expect(back.begin).toBe(PAST);
    expect(back.end).toBe(SAMPLE_INDEX_MAX);
  });

  it('makeSampleRangeFromUnknown accepts bigint and decimal strings; rejects Number', () => {
    const a = makeSampleRangeFromUnknown(PAST, sampleIndexToDecimal(PAST2));
    expect(a.begin).toBe(PAST);
    expect(a.end).toBe(PAST2);
    expect(() => makeSampleRangeFromUnknown(123, 456)).toThrow(TypeError);
    expect(() => makeSampleRangeFromUnknown('01', '2')).toThrow(RangeError);
  });

  it('overlap / intersect / clamp / compare stay correct past 2^53', () => {
    const a = makeSampleRange(PAST, PAST2);
    const b = makeSampleRange(PAST + 10n, PAST2 + 10n);
    const c = makeSampleRange(0n, PAST);
    expect(sampleRangesOverlap(a, b)).toBe(true);
    expect(sampleRangesOverlap(a, c)).toBe(false);

    const hit = intersectSampleRanges(a, b)!;
    expect(hit.begin).toBe(PAST + 10n);
    expect(hit.end).toBe(PAST2);
    expect(intersectSampleRanges(a, c)).toBeNull();

    const bounds = makeSampleRange(PAST + 5n, PAST2 - 5n);
    const clamped = clampSampleRange(a, bounds);
    expect(clamped.begin).toBe(PAST + 5n);
    expect(clamped.end).toBe(PAST2 - 5n);

    expect(compareSampleRanges(a, b)).toBeLessThan(0);
    expect(compareSampleRanges(a, a)).toBe(0);
  });

  it('seconds helpers: small indexes exact; huge indexes stay bigint on sample side', () => {
    expect(sampleIndexFromSeconds(1.5, 1_000_000)).toBe(1_500_000n);
    expect(secondsFromSampleIndex(2_000_000n, 1_000_000)).toBe(2);
    expect(() => sampleIndexFromSeconds(NaN, 1)).toThrow(RangeError);
    // Domain keeps sample math on bigint even when UI seconds use Number
    const huge = sampleIndexFromDecimal(sampleIndexToDecimal(PAST));
    expect(typeof huge).toBe('bigint');
    expect(huge).toBe(PAST);
  });
});
