import { describe, expect, it } from 'vitest';
import {
  freqHzFromFramePsdPeak,
  resolveNbPsdLinkedFreqHz,
} from './nbPsdFreqFromDwell';

describe('G18 NB PSD freq from dwell-only historic pin', () => {
  it('freqHzFromFramePsdPeak maps argmax bin to xDomain', () => {
    const y = [1, 2, 10, 3];
    expect(freqHzFromFramePsdPeak(y, 100, 400)).toBe(300);
  });

  it('resolve prefers linkedCursor when pinned', () => {
    const r = resolveNbPsdLinkedFreqHz({
      linkedPinned: true,
      linkedFrequencyHz: 12345,
      pinnedDwellIndex: 2,
      psdMode: 'frame',
      framePsdY: [1, 9, 2],
      xMin: 0,
      xMax: 100,
    });
    expect(r).toEqual({ freqHz: 12345, source: 'linked' });
  });

  it('dwell-only without linkedCursor uses frame PSD peak', () => {
    const r = resolveNbPsdLinkedFreqHz({
      linkedPinned: false,
      linkedFrequencyHz: 0,
      pinnedDwellIndex: 4,
      psdMode: 'frame',
      framePsdY: [0.1, 0.2, 5, 0.3],
      xMin: 0,
      xMax: 300,
    });
    expect(r.source).toBe('dwell-peak');
    expect(r.freqHz).toBe(200);
  });

  it('dwell-only with empty PSD falls back to band center', () => {
    const r = resolveNbPsdLinkedFreqHz({
      linkedPinned: false,
      linkedFrequencyHz: 0,
      pinnedDwellIndex: 1,
      psdMode: 'frame',
      framePsdY: null,
      xMin: 10,
      xMax: 90,
    });
    expect(r).toEqual({ freqHz: 50, source: 'dwell-center' });
  });

  it('no dwell and unpinned linked → none', () => {
    const r = resolveNbPsdLinkedFreqHz({
      linkedPinned: false,
      linkedFrequencyHz: 0,
      pinnedDwellIndex: null,
      psdMode: 'frame',
      framePsdY: [1, 2],
      xMin: 0,
      xMax: 1,
    });
    expect(r).toEqual({ freqHz: null, source: 'none' });
  });

  it('statistical mode ignores dwell-only recovery', () => {
    const r = resolveNbPsdLinkedFreqHz({
      linkedPinned: false,
      linkedFrequencyHz: 0,
      pinnedDwellIndex: 3,
      psdMode: 'statistical',
      framePsdY: [1, 9, 1],
      xMin: 0,
      xMax: 100,
    });
    expect(r).toEqual({ freqHz: null, source: 'none' });
  });
});
