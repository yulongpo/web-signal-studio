import { describe, expect, it } from 'vitest';
import {
  freqDomainFromView,
  visibleBandwidthHz,
} from './visibleBandwidthHz';

describe('visibleBandwidthHz (A2 / desktop 17471a6)', () => {
  const full = {
    xDomain: { min: 0, max: 1 },
    yDomain: { min: -5e6, max: 5e6 },
  };

  it('STFT reads frequency from Y domain', () => {
    expect(freqDomainFromView('stft', full)).toEqual(full.yDomain);
    expect(visibleBandwidthHz('stft', full, 10e6)).toBe(10e6);
  });

  it('Waterfall reads frequency from X domain', () => {
    const wf = {
      xDomain: { min: -1e6, max: 1e6 },
      yDomain: { min: 0, max: 2 },
    };
    expect(freqDomainFromView('waterfall', wf)).toEqual(wf.xDomain);
    expect(visibleBandwidthHz('waterfall', wf, 10e6)).toBe(2e6);
  });

  it('zoomed span is used (not full fs)', () => {
    const zoomed = {
      xDomain: { min: 0, max: 1 },
      yDomain: { min: -100e3, max: 100e3 },
    };
    expect(visibleBandwidthHz('stft', zoomed, 10e6)).toBe(200e3);
  });

  it('invalid span falls back to sampleRateHz', () => {
    const bad = {
      xDomain: { min: 0, max: 1 },
      yDomain: { min: 5, max: 5 },
    };
    expect(visibleBandwidthHz('stft', bad, 2e6)).toBe(2e6);
  });

  it('clamps span above fs down to fs', () => {
    const wide = {
      xDomain: { min: 0, max: 1 },
      yDomain: { min: -20e6, max: 20e6 },
    };
    expect(visibleBandwidthHz('stft', wide, 10e6)).toBe(10e6);
  });
});
