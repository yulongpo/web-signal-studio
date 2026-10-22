import { describe, expect, it } from 'vitest';
import { physicalSpansFromView, spanAbs } from './physicalViewSpans';

describe('physicalViewSpans (G09 D4 axis bind)', () => {
  it('STFT: X=time Y=freq', () => {
    const s = physicalSpansFromView('stft', {
      xDomain: { min: 0.1, max: 0.5 },
      yDomain: { min: -1e6, max: 1e6 },
    });
    expect(s.timeSec).toEqual({ min: 0.1, max: 0.5 });
    expect(s.freqHz).toEqual({ min: -1e6, max: 1e6 });
    expect(spanAbs(s.timeSec)).toBeCloseTo(0.4, 12);
    expect(spanAbs(s.freqHz)).toBeCloseTo(2e6, 6);
  });

  it('Waterfall: X=freq Y=time (axis-swap readout)', () => {
    const s = physicalSpansFromView('waterfall', {
      xDomain: { min: -500e3, max: 500e3 },
      yDomain: { min: 1, max: 3 },
    });
    expect(s.freqHz).toEqual({ min: -500e3, max: 500e3 });
    expect(s.timeSec).toEqual({ min: 1, max: 3 });
    expect(spanAbs(s.freqHz)).toBeCloseTo(1e6, 6);
    expect(spanAbs(s.timeSec)).toBe(2);
  });
});
