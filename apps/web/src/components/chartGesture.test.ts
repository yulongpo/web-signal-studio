import { describe, expect, it } from 'vitest';
import {
  VIEW_HISTORY_LIMIT,
  cssToTimeFreq,
  applyMarkBodyDelta,
  halfOpenEnd,
  markContains,
  pushCapped,
  secondsToSampleIndex,
  valueToCss,
} from './chartGesture';

describe('chart gesture helpers', () => {
  it('keeps sample indexes as safe decimal strings', () => {
    expect(secondsToSampleIndex(0.001, 1_000_000)).toBe('1000');
    expect(secondsToSampleIndex(-1, 1_000_000)).toBeNull();
    expect(secondsToSampleIndex(1, 0)).toBeNull();
    expect(halfOpenEnd('10', '10')).toBe('11');
    expect(halfOpenEnd('4', '9')).toBe('9');
    expect(halfOpenEnd('nope', '2')).toBeNull();
  });

  it('drops the oldest view once history exceeds 40', () => {
    let stack: number[] = [];
    for (let i = 0; i < VIEW_HISTORY_LIMIT + 3; i++) stack = pushCapped(stack, i);
    expect(stack).toHaveLength(40);
    expect(stack[0]).toBe(3);
    expect(stack[39]).toBe(42);
  });

  it('maps STFT pixels with an upward frequency axis', () => {
    const xDomain = { min: 0, max: 1 };
    const yDomain = { min: -10, max: 10 };
    const top = cssToTimeFreq(52, 10, 400, 300, 'stft', xDomain, yDomain);
    expect(top.timeSec).toBeCloseTo(0, 6);
    expect(top.freqHz).toBeCloseTo(10, 6);
    const px = valueToCss(10, 10, 264, -10, 10, true);
    expect(px).toBeCloseTo(10, 6);
  });

  it('hits a mark only inside its time and frequency span', () => {
    const mark = { start: '0', end: '1000', lowerHz: 0, upperHz: 1e6 };
    expect(markContains(mark, 0.0005, 100, 1_000_000)).toBe(true);
    expect(markContains(mark, 0.002, 100, 1_000_000)).toBe(false);
    expect(markContains(mark, 0.0005, -1, 1_000_000)).toBe(false);
  });

  it('translates mark body keeping time/freq span (G11 ClosedHand Move)', () => {
    const next = applyMarkBodyDelta({
      t0: 1,
      t1: 3,
      f0: 100,
      f1: 400,
      dtSec: 0.5,
      dfHz: -20,
    });
    expect(next).toEqual({ t0: 1.5, t1: 3.5, f0: 80, f1: 380 });
  });

});