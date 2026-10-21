/**
 * Sample indices for multi-hour IQ must never go through Number.
 * Use bigint in-process; use canonical decimal strings across JSON / Workers / WASM.
 *
 * Canonical form (matches native project_store sampleIndex):
 * - unsigned decimal only (uint64 range 0 .. 2^64-1)
 * - no leading zeros except the single digit "0"
 * - NEVER JSON Number for indexes that may exceed 2^53-1
 */

export type SampleIndex = bigint;

/** Inclusive upper bound for a uint64 sample index. */
export const SAMPLE_INDEX_MAX = (1n << 64n) - 1n;

const CANONICAL_DECIMAL_RE = /^(?:0|[1-9]\d*)$/;

export function isCanonicalSampleIndexDecimal(text: string): boolean {
  if (!CANONICAL_DECIMAL_RE.test(text)) return false;
  try {
    const value = BigInt(text);
    return value >= 0n && value <= SAMPLE_INDEX_MAX;
  } catch {
    return false;
  }
}

export function sampleIndexFromDecimal(text: string): SampleIndex {
  const trimmed = text.trim();
  if (!isCanonicalSampleIndexDecimal(trimmed)) {
    throw new RangeError(
      `SampleIndex decimal string rejected (need canonical uint64 decimal): ${JSON.stringify(text)}`,
    );
  }
  return BigInt(trimmed);
}

export function sampleIndexToDecimal(index: SampleIndex): string {
  if (typeof index !== 'bigint') {
    throw new TypeError(`sampleIndexToDecimal expects bigint, got ${typeof index}`);
  }
  if (index < 0n || index > SAMPLE_INDEX_MAX) {
    throw new RangeError(`SampleIndex out of uint64 range: ${index.toString(10)}`);
  }
  return index.toString(10);
}

export function assertSampleIndex(value: unknown, label = 'SampleIndex'): SampleIndex {
  if (typeof value === 'bigint') {
    if (value < 0n || value > SAMPLE_INDEX_MAX) {
      throw new RangeError(`${label} out of uint64 range: ${value.toString(10)}`);
    }
    return value;
  }
  if (typeof value === 'string') return sampleIndexFromDecimal(value);
  throw new TypeError(`${label} must be bigint or canonical decimal string, got ${typeof value}`);
}

export function validateSampleIndexDecimal(
  text: string,
): { ok: true; value: SampleIndex } | { ok: false; error: string } {
  try {
    return { ok: true, value: sampleIndexFromDecimal(text) };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
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
