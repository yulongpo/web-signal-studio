import { describe, expect, it } from 'vitest';
import {
  VIEW_HISTORY_LIMIT,
  cssToTimeFreq,
  applyMarkBodyDelta,
  frameIndexFromPlotX,
  plotXFromFrameIndex,
  clampMarkRangeToFull,
  PLOT_MARGIN,
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

  it('clamps Move to view bounds keeping span (G11 desktop fullRange)', () => {
    const next = applyMarkBodyDelta({
      t0: 1,
      t1: 3,
      f0: 100,
      f1: 400,
      dtSec: 10,
      dfHz: -500,
      tMin: 0,
      tMax: 5,
      fMin: 0,
      fMax: 1000,
    });
    // spanT=2 -> t0 max 3; spanF=300 -> f0 min 0
    expect(next).toEqual({ t0: 3, t1: 5, f0: 0, f1: 300 });
  });

  it('does not clamp when bounds omitted', () => {
    const next = applyMarkBodyDelta({
      t0: 1,
      t1: 2,
      f0: 10,
      f1: 20,
      dtSec: 100,
      dfHz: 100,
    });
    expect(next).toEqual({ t0: 101, t1: 102, f0: 110, f1: 120 });
  });

  it('maps STFT pin X through plot margins (G18 margin-map)', () => {
    const cssW = 400;
    const frames = 100;
    // Left of plot -> null
    expect(frameIndexFromPlotX(PLOT_MARGIN.left - 1, cssW, frames)).toBeNull();
    // Left edge of plot -> 0
    expect(frameIndexFromPlotX(PLOT_MARGIN.left, cssW, frames)).toBe(0);
    // Mid plot
    const mid = PLOT_MARGIN.left + (cssW - PLOT_MARGIN.left - PLOT_MARGIN.right) * 0.5;
    expect(frameIndexFromPlotX(mid, cssW, frames)).toBe(50);
    // Round-trip scrubber x
    const x = plotXFromFrameIndex(50, cssW, frames);
    expect(x).not.toBeNull();
    expect(frameIndexFromPlotX(x!, cssW, frames)).toBe(50);
  });

  it('clamps edge range to file fullRange (G11)', () => {
    const next = clampMarkRangeToFull({
      t0: -1,
      t1: 9,
      f0: -50,
      f1: 2000,
      tMin: 0,
      tMax: 5,
      fMin: 0,
      fMax: 1000,
    });
    expect(next).toEqual({ t0: 0, t1: 5, f0: 0, f1: 1000 });
  });

});
