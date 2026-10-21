import { describe, expect, it } from 'vitest';
import {
  amEnvelopeOverview,
  fmDiscriminatorOverview,
  rmsOverview,
  simpleDemodOverview,
} from './simpleDemodFromIq';

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

  it('RMS averages power over bins', () => {
    const iq = new Float32Array(8);
    iq[0] = 1; iq[1] = 0;
    iq[2] = 0; iq[3] = 0;
    iq[4] = 1; iq[5] = 0;
    iq[6] = 0; iq[7] = 0;
    const y = rmsOverview(iq, 2);
    expect(y).toHaveLength(2);
    expect(y[0]!).toBeCloseTo(Math.sqrt(0.5), 5);
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
    const iq = new Float32Array(n * 2);
    for (let k = 0; k < n; k++) {
      const ph = (2 * Math.PI * f * k) / fs;
      iq[k * 2] = Math.cos(ph);
      iq[k * 2 + 1] = Math.sin(ph);
    }
    const y = fmDiscriminatorOverview(iq, { maxPoints: 32, sampleRateHz: fs });
    const mid = y[16]!;
    expect(mid).toBeGreaterThan(150);
    expect(mid).toBeLessThan(250);
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
