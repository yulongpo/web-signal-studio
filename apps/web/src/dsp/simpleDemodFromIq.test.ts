import { describe, expect, it } from 'vitest';
import {
  amEnvelopeOverview,
  fmDiscriminatorOverview,
  rmsOverview,
  simpleDemodOverview,
} from './simpleDemodFromIq';

/** SYNTHETIC FIXTURE ONLY — not SigMF / not runtime UI path. */
function complexTone(n: number, fs: number, fHz: number, amp = 1): Float32Array {
  const iq = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const ph = (2 * Math.PI * fHz * k) / fs;
    iq[k * 2] = amp * Math.cos(ph);
    iq[k * 2 + 1] = amp * Math.sin(ph);
  }
  return iq;
}

/**
 * Classical AM: (1 + m cos(2π fm t)) * exp(j 2π fc t).
 * Envelope = |1 + m cos(...)| when m ≤ 1.
 */
function amTone(
  n: number,
  fs: number,
  fcHz: number,
  fmHz: number,
  m: number,
): Float32Array {
  const iq = new Float32Array(n * 2);
  for (let k = 0; k < n; k++) {
    const t = k / fs;
    const env = 1 + m * Math.cos(2 * Math.PI * fmHz * t);
    const ph = 2 * Math.PI * fcHz * t;
    iq[k * 2] = env * Math.cos(ph);
    iq[k * 2 + 1] = env * Math.sin(ph);
  }
  return iq;
}

describe('simpleDemodFromIq', () => {
  it('AM envelope matches hypot for constant IQ', () => {
    const iq = new Float32Array(8);
    for (let k = 0; k < 4; k++) {
      iq[k * 2] = 3;
      iq[k * 2 + 1] = 4;
    }
    const y = amEnvelopeOverview(iq, 4);
    expect(y).toHaveLength(4);
    for (let i = 0; i < 4; i++) expect(y[i]).toBeCloseTo(5, 5);
  });

  it('golden: empty IQ yields zero-filled overview of maxPoints', () => {
    const y = amEnvelopeOverview(new Float32Array(0), 8);
    expect(y).toHaveLength(8);
    expect([...y].every((v) => v === 0)).toBe(true);
  });

  it('golden: AM envelope tracks known modulation depth', () => {
    const fs = 48_000;
    const n = 4800;
    const m = 0.5;
    const iq = amTone(n, fs, 5_000, 100, m);
    const y = amEnvelopeOverview(iq, n);
    expect(y).toHaveLength(n);
    // Spot-check several samples against analytic |1 + m cos|
    for (const k of [0, 120, 600, 2400]) {
      const t = k / fs;
      const expected = Math.abs(1 + m * Math.cos(2 * Math.PI * 100 * t));
      expect(y[k]!).toBeCloseTo(expected, 4);
    }
    const ymin = Math.min(...y);
    const ymax = Math.max(...y);
    expect(ymin).toBeGreaterThan(1 - m - 0.05);
    expect(ymax).toBeLessThan(1 + m + 0.05);
  });

  it('RMS averages power over bins', () => {
    const iq = new Float32Array(8);
    iq[0] = 1;
    iq[1] = 0;
    iq[2] = 0;
    iq[3] = 0;
    iq[4] = 1;
    iq[5] = 0;
    iq[6] = 0;
    iq[7] = 0;
    const y = rmsOverview(iq, 2);
    expect(y).toHaveLength(2);
    expect(y[0]!).toBeCloseTo(Math.sqrt(0.5), 5);
  });

  it('golden: RMS of constant |z|=A equals A in every bin', () => {
    const A = 2.5;
    const iq = complexTone(256, 8_000, 0, A); // DC: I=A, Q=0
    const y = rmsOverview(iq, 16);
    expect(y).toHaveLength(16);
    for (let i = 0; i < y.length; i++) {
      expect(y[i]!).toBeCloseTo(A, 5);
    }
  });

  it('golden: RMS bounds for unit-amp tone stay near 1', () => {
    const iq = complexTone(1024, 16_000, 1_000, 1);
    const y = rmsOverview(iq, 32);
    for (const v of y) {
      expect(v).toBeGreaterThan(0.95);
      expect(v).toBeLessThan(1.05);
    }
  });

  it('FM discriminator is ~0 for constant phase', () => {
    const n = 64;
    const iq = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) {
      iq[k * 2] = 1;
      iq[k * 2 + 1] = 0;
    }
    const y = fmDiscriminatorOverview(iq, { maxPoints: 16, sampleRateHz: 1000 });
    expect(y).toHaveLength(16);
    for (let i = 0; i < y.length; i++) expect(Math.abs(y[i]!)).toBeLessThan(1e-6);
  });

  it('FM discriminator tracks known tone offset', () => {
    const fs = 8000;
    const f = 200;
    const n = 512;
    const iq = complexTone(n, fs, f, 1);
    const y = fmDiscriminatorOverview(iq, { maxPoints: 32, sampleRateHz: fs });
    const mid = y[16]!;
    expect(mid).toBeGreaterThan(150);
    expect(mid).toBeLessThan(250);
  });

  it('golden: FM mean deviation within 2% of tone frequency', () => {
    const fs = 48_000;
    const f = 1_500;
    const n = 4096;
    const iq = complexTone(n, fs, f, 1);
    const y = fmDiscriminatorOverview(iq, { maxPoints: 256, sampleRateHz: fs });
    let sum = 0;
    for (let i = 0; i < y.length; i++) sum += y[i]!;
    const mean = sum / y.length;
    expect(Math.abs(mean - f) / f).toBeLessThan(0.02);
  });

  it('golden: FM unwrap stays stable across ±π boundary', () => {
    // Start near +π and step by ~0.4 rad each sample so wrapped Δ wraps negative
    // without unwrap; with unwrap the discriminator must stay positive.
    const fs = 10_000;
    const n = 64;
    const iq = new Float32Array(n * 2);
    let ph = Math.PI - 0.05;
    const dPh = 0.4; // rad/sample → f = dPh * fs / 2π
    for (let k = 0; k < n; k++) {
      iq[k * 2] = Math.cos(ph);
      iq[k * 2 + 1] = Math.sin(ph);
      ph += dPh;
    }
    const expectedHz = (dPh * fs) / (2 * Math.PI);
    const y = fmDiscriminatorOverview(iq, { maxPoints: n - 1, sampleRateHz: fs });
    for (let i = 0; i < y.length; i++) {
      expect(y[i]!).toBeGreaterThan(expectedHz * 0.9);
      expect(y[i]!).toBeLessThan(expectedHz * 1.1);
    }
  });

  it('simpleDemodOverview dispatches modes', () => {
    const iq = new Float32Array([1, 0, 0, 1]);
    expect(simpleDemodOverview(iq, 'am_envelope', { maxPoints: 2 })).toHaveLength(2);
    expect(simpleDemodOverview(iq, 'rms', { maxPoints: 2 })).toHaveLength(2);
    expect(
      simpleDemodOverview(iq, 'fm_discriminator', {
        maxPoints: 2,
        sampleRateHz: 100,
      }),
    ).toHaveLength(2);
  });
});
