import { describe, expect, it } from 'vitest';
import {
  resolveNbStftLinkedCursor,
  resolveNbWaveLinkedTimeSec,
} from './nbMultiViewLinked';

describe('resolveNbWaveLinkedTimeSec', () => {
  it('prefers pinned linkedCursor.timeSec', () => {
    expect(
      resolveNbWaveLinkedTimeSec({
        linkedPinned: true,
        linkedTimeSec: 0.42,
        dwellTimeSec: 0.1,
      }),
    ).toBe(0.42);
  });

  it('falls back to dwellTimeSec when unpinned', () => {
    expect(
      resolveNbWaveLinkedTimeSec({
        linkedPinned: false,
        linkedTimeSec: 0,
        dwellTimeSec: 0.25,
      }),
    ).toBe(0.25);
  });

  it('returns null when neither available', () => {
    expect(
      resolveNbWaveLinkedTimeSec({
        linkedPinned: false,
        linkedTimeSec: 0,
        dwellTimeSec: null,
      }),
    ).toBeNull();
  });
});

describe('resolveNbStftLinkedCursor', () => {
  it('uses pinned linkedCursor time+freq', () => {
    expect(
      resolveNbStftLinkedCursor({
        linkedPinned: true,
        linkedTimeSec: 0.42,
        linkedFrequencyHz: 12.5e6,
        dwellTimeSec: 0.1,
        resolvedFreqHz: 1e6,
      }),
    ).toEqual({ xValue: 0.42, yValue: 12.5e6, pinned: true });
  });

  it('dwell-only uses dwell time + resolved freq', () => {
    expect(
      resolveNbStftLinkedCursor({
        linkedPinned: false,
        linkedTimeSec: 0,
        linkedFrequencyHz: 0,
        dwellTimeSec: 0.3,
        resolvedFreqHz: 5e6,
      }),
    ).toEqual({ xValue: 0.3, yValue: 5e6, pinned: true });
  });

  it('returns null without dwell or pin', () => {
    expect(
      resolveNbStftLinkedCursor({
        linkedPinned: false,
        linkedTimeSec: 0,
        linkedFrequencyHz: 0,
        dwellTimeSec: null,
        resolvedFreqHz: null,
      }),
    ).toBeNull();
  });
});
