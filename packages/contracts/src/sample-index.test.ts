import { describe, expect, it } from 'vitest';
import {
  SAMPLE_INDEX_MAX,
  assertSampleIndex,
  clampSampleIndex,
  compareSampleIndex,
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


describe('M-10 sample-index compare / clamp / assert boundary', () => {
  const past = (1n << 53n) + 17n;
  const past2 = (1n << 53n) + 99n;

  it('compareSampleIndex orders past-safe values', () => {
    expect(compareSampleIndex(0n, 1n)).toBe(-1);
    expect(compareSampleIndex(past2, past)).toBe(1);
    expect(compareSampleIndex(past, past)).toBe(0);
    expect(compareSampleIndex(SAMPLE_INDEX_MAX - 1n, SAMPLE_INDEX_MAX)).toBe(-1);
  });

  it('clampSampleIndex clamps inclusive to [min, max]', () => {
    expect(clampSampleIndex(past, past + 1n, past2)).toBe(past + 1n);
    expect(clampSampleIndex(past2 + 10n, past, past2)).toBe(past2);
    expect(clampSampleIndex(past + 5n, past, past2)).toBe(past + 5n);
  });

  it('assertSampleIndex accepts bigint and trimmed decimal; rejects null/undefined/number/array', () => {
    expect(assertSampleIndex(past)).toBe(past);
    expect(assertSampleIndex(' 0 ')).toBe(0n);
    expect(assertSampleIndex(sampleIndexToDecimal(SAMPLE_INDEX_MAX))).toBe(SAMPLE_INDEX_MAX);
    for (const bad of [null, undefined, 1.5, {}, [], true, -1n] as unknown[]) {
      expect(() => assertSampleIndex(bad)).toThrow();
    }
  });

  it('protocol doc: Workers/WASM/JSON must carry decimal strings for sample indexes', () => {
    const payload = {
      begin: sampleIndexToDecimal(past),
      end: sampleIndexToDecimal(SAMPLE_INDEX_MAX),
      sampleCount: sampleIndexToDecimal(SAMPLE_INDEX_MAX),
    };
    const wire = JSON.stringify(payload);
    expect(wire.includes('"9007199254741009"')).toBe(true);
    expect(wire.includes('"18446744073709551615"')).toBe(true);
    // Must not appear as bare JSON numbers in the serialized form
    expect(wire).not.toMatch(/:\s*9007199254741009([,}])/);
    const round = JSON.parse(wire) as typeof payload;
    expect(sampleIndexFromDecimal(round.begin)).toBe(past);
    expect(sampleIndexFromDecimal(round.end)).toBe(SAMPLE_INDEX_MAX);
  });
});
