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

describe('BigInt JSON boundary (wire must be decimal strings)', () => {
  const pastSafe = (1n << 53n) + 17n; // 9007199254741009
  const adjacentBelow = (1n << 53n) - 1n; // MAX_SAFE_INTEGER
  const adjacentAbove = (1n << 53n) + 1n;
  const uint64Max = SAMPLE_INDEX_MAX;

  it('JSON.parse of numeric literals past MAX_SAFE_INTEGER loses precision', () => {
    // Bare number in JSON → IEEE double; digits past 2^53 are irreversible.
    const lost = JSON.parse(String(pastSafe)) as number;
    expect(typeof lost).toBe('number');
    expect(BigInt(Math.trunc(lost)) === pastSafe).toBe(false);
    expect(Number.isSafeInteger(lost)).toBe(false);

    const lostAdjacent = JSON.parse(String(adjacentAbove)) as number;
    expect(BigInt(Math.trunc(lostAdjacent)) === adjacentAbove).toBe(false);
  });

  it('canonical decimal strings round-trip through JSON.parse/stringify', () => {
    const cases = [
      0n,
      adjacentBelow,
      1n << 53n,
      adjacentAbove,
      pastSafe,
      uint64Max,
    ] as const;
    for (const value of cases) {
      const decimal = sampleIndexToDecimal(value);
      const wrapped = JSON.stringify({ begin: decimal, end: decimal });
      const parsed = JSON.parse(wrapped) as { begin: string; end: string };
      expect(typeof parsed.begin).toBe('string');
      expect(sampleIndexFromDecimal(parsed.begin)).toBe(value);
      expect(sampleIndexFromDecimal(parsed.end)).toBe(value);
    }
  });

  it('rejects non-canonical decimals (leading zeros, scientific notation)', () => {
    for (const bad of ['01', '001', '1e3', '1E6', '+1', '0x10', '']) {
      expect(isCanonicalSampleIndexDecimal(bad)).toBe(false);
      expect(validateSampleIndexDecimal(bad).ok).toBe(false);
    }
    // fromDecimal trims whitespace then validates
    expect(sampleIndexFromDecimal(' 0 ')).toBe(0n);
    expect(() => sampleIndexFromDecimal('01')).toThrow(RangeError);
    expect(() => sampleIndexFromDecimal('1e3')).toThrow(RangeError);
  });

  it('uint64 max decimal survives JSON and rejects overflow string', () => {
    const text = sampleIndexToDecimal(uint64Max);
    expect(JSON.parse(JSON.stringify(text))).toBe('18446744073709551615');
    expect(sampleIndexFromDecimal(text)).toBe(uint64Max);
    expect(validateSampleIndexDecimal('18446744073709551616').ok).toBe(false);
  });
});