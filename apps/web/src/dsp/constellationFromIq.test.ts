import { describe, expect, it } from 'vitest';
import { constellationBounds, constellationFromIq } from './constellationFromIq';

/** SYNTHETIC FIXTURE ONLY — not SigMF / not runtime UI path. */
function toneIq(n: number, iAmp = 1, qAmp = 0.5): Float32Array {
  const iq = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    iq[k * 2] = iAmp;
    iq[k * 2 + 1] = qAmp;
  }
  return iq;
}

/** Unit-circle complex tone at digital frequency f cycles/sample. */
function complexToneIq(n: number, cyclesPerSample: number, amp = 1): Float32Array {
  const iq = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const ph = 2 * Math.PI * cyclesPerSample * k;
    iq[k * 2] = amp * Math.cos(ph);
    iq[k * 2 + 1] = amp * Math.sin(ph);
  }
  return iq;
}

describe('constellationFromIq', () => {
  it('returns empty for empty IQ', () => {
    expect(constellationFromIq(new Float32Array(0))).toEqual([]);
  });

  it('returns empty when skipSamples covers all samples', () => {
    expect(constellationFromIq(toneIq(8), { skipSamples: 8 })).toEqual([]);
    expect(constellationFromIq(toneIq(8), { skipSamples: 100 })).toEqual([]);
  });

  it('downsamples to maxPoints and keeps I/Q', () => {
    const pts = constellationFromIq(toneIq(10_000), { maxPoints: 100 });
    expect(pts).toHaveLength(100);
    expect(pts[0]!.i).toBeCloseTo(1, 5);
    expect(pts[0]!.q).toBeCloseTo(0.5, 5);
  });

  it('golden: point count equals usable when usable < maxPoints', () => {
    const pts = constellationFromIq(toneIq(40), { maxPoints: 2048 });
    expect(pts).toHaveLength(40);
  });

  it('golden: odd interleaved length ignores trailing float', () => {
    const iq = new Float32Array(5); // 2 full samples + 1 orphan
    iq[0] = 1;
    iq[1] = 2;
    iq[2] = 3;
    iq[3] = 4;
    iq[4] = 99;
    const pts = constellationFromIq(iq, { maxPoints: 10 });
    expect(pts).toHaveLength(2);
    expect(pts[0]).toEqual({ i: 1, q: 2 });
    expect(pts[1]).toEqual({ i: 3, q: 4 });
  });

  it('honors skipSamples', () => {
    const iq = toneIq(20, 1, 0);
    for (let k = 0; k < 5; k++) iq[k * 2 + 1] = 9;
    const pts = constellationFromIq(iq, { maxPoints: 10, skipSamples: 5 });
    expect(pts.every((p) => p.q === 0)).toBe(true);
  });

  it('golden: unit-circle tone points stay on radius amp', () => {
    const amp = 0.75;
    const pts = constellationFromIq(complexToneIq(4096, 1 / 64, amp), {
      maxPoints: 256,
    });
    expect(pts).toHaveLength(256);
    for (const p of pts) {
      const r = Math.hypot(p.i, p.q);
      expect(r).toBeCloseTo(amp, 4);
    }
  });

  it('golden: DC IQ cluster is a single point in I/Q', () => {
    const pts = constellationFromIq(toneIq(512, -0.3, 0.8), { maxPoints: 64 });
    expect(pts).toHaveLength(64);
    for (const p of pts) {
      expect(p.i).toBeCloseTo(-0.3, 6);
      expect(p.q).toBeCloseTo(0.8, 6);
    }
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
    // 5% pad of span 4 → 0.2
    expect(b.iMin).toBeCloseTo(-2.2, 5);
    expect(b.iMax).toBeCloseTo(2.2, 5);
    expect(b.qMin).toBeCloseTo(-1.1, 5);
    expect(b.qMax).toBeCloseTo(1.1, 5);
  });

  it('golden: degenerate single-point bounds still expand by epsilon pad', () => {
    const b = constellationBounds([{ i: 0.5, q: -0.25 }]);
    expect(b.iMin).toBeLessThan(0.5);
    expect(b.iMax).toBeGreaterThan(0.5);
    expect(b.qMin).toBeLessThan(-0.25);
    expect(b.qMax).toBeGreaterThan(-0.25);
  });
});
