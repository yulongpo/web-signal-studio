/**
 * Sample indices for multi-hour IQ must never go through Number.
 * Use bigint in-process; use decimal strings across JSON / Workers / WASM boundaries.
 */

export type SampleIndex = bigint;

const DECIMAL_RE = /^-?(?:0|[1-9]\d*)$/;

export function sampleIndexFromDecimal(text: string): SampleIndex {
  const trimmed = text.trim();
  if (!DECIMAL_RE.test(trimmed)) {
    throw new RangeError(`SampleIndex decimal string rejected: ${JSON.stringify(text)}`);
  }
  return BigInt(trimmed);
}

export function sampleIndexToDecimal(index: SampleIndex): string {
  return index.toString(10);
}

export function assertSampleIndex(value: unknown, label = 'SampleIndex'): SampleIndex {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') return sampleIndexFromDecimal(value);
  throw new TypeError(`${label} must be bigint or decimal string, got ${typeof value}`);
}

export function compareSampleIndex(a: SampleIndex, b: SampleIndex): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function clampSampleIndex(value: SampleIndex, min: SampleIndex, max: SampleIndex): SampleIndex {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
