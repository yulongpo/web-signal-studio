import { describe, expect, it } from 'vitest';
import {
  SAMPLE_INDEX_MAX,
  assertSampleIndex,
  isCanonicalSampleIndexDecimal,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
  validateSampleIndexDecimal,
} from './sample-index.js';

describe('sample-index protocol', () => {
  it('round-trips canonical decimals including values past 2^53', () => {
    const pastSafe = (1n << 53n) + 17n;
    const text = sampleIndexToDecimal(pastSafe);
    expect(text).toBe('9007199254741009');
    expect(sampleIndexFromDecimal(text)).toBe(pastSafe);
    // Number cannot represent this integer exactly; bigint decimal must be used.
    expect(BigInt(Math.trunc(Number(text))) === pastSafe).toBe(false);
  });

  it('accepts 0 and rejects leading zeros / negatives / non-decimal', () => {
    expect(isCanonicalSampleIndexDecimal('0')).toBe(true);
    expect(sampleIndexFromDecimal('0')).toBe(0n);
    expect(isCanonicalSampleIndexDecimal('01')).toBe(false);
    expect(isCanonicalSampleIndexDecimal('-1')).toBe(false);
    expect(isCanonicalSampleIndexDecimal('1.5')).toBe(false);
    expect(isCanonicalSampleIndexDecimal('1e3')).toBe(false);
    expect(validateSampleIndexDecimal('01').ok).toBe(false);
  });

  it('enforces uint64 max', () => {
    expect(sampleIndexToDecimal(SAMPLE_INDEX_MAX)).toBe('18446744073709551615');
    expect(() => sampleIndexToDecimal(SAMPLE_INDEX_MAX + 1n)).toThrow(RangeError);
    expect(() => assertSampleIndex(SAMPLE_INDEX_MAX + 1n)).toThrow(RangeError);
  });

  it('rejects JSON Number path via assertSampleIndex', () => {
    expect(() => assertSampleIndex(123)).toThrow(TypeError);
  });
});
