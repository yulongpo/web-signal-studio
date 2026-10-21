import { describe, expect, it } from 'vitest';
import { constellationBounds, constellationFromIq } from './constellationFromIq';

function toneIq(n: number, iAmp = 1, qAmp = 0.5): Float32Array {
  const iq = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    iq[k * 2] = iAmp;
    iq[k * 2 + 1] = qAmp;
  }
  return iq;
}

describe('constellationFromIq', () => {
  it('returns empty for empty IQ', () => {
    expect(constellationFromIq(new Float32Array(0))).toEqual([]);
  });

  it('downsamples to maxPoints and keeps I/Q', () => {
    const pts = constellationFromIq(toneIq(10_000), { maxPoints: 100 });
    expect(pts).toHaveLength(100);
    expect(pts[0]!.i).toBeCloseTo(1, 5);
    expect(pts[0]!.q).toBeCloseTo(0.5, 5);
  });

  it('honors skipSamples', () => {
    const iq = toneIq(20, 1, 0);
    // first 5 samples different Q
    for (let k = 0; k < 5; k++) iq[k * 2 + 1] = 9;
    const pts = constellationFromIq(iq, { maxPoints: 10, skipSamples: 5 });
    expect(pts.every((p) => p.q === 0)).toBe(true);
  });

  it('bounds pad empty and non-empty', () => {
    expect(constellationBounds([])).toEqual({
      iMin: -1,
      iMax: 1,
      qMin: -1,
      qMax: 1,
    });
    const b = constellationBounds([
      { i: -2, q: 1 },
      { i: 2, q: -1 },
    ]);
    expect(b.iMin).toBeLessThan(-2);
    expect(b.iMax).toBeGreaterThan(2);
  });
});
