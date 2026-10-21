import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** Proves pinned-dwell store contract for G18 contextFramePsd (pin UI is B/C). */
describe('G18 narrowbandPinnedDwellIndex store', () => {
  beforeEach(() => {
    useUiStore.setState({ narrowbandPinnedDwellIndex: null });
  });

  it('defaults to null (unpinned → last STFT frame in DDC)', () => {
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBeNull();
  });

  it('setNarrowbandPinnedDwellIndex clamps to non-negative int or null', () => {
    useUiStore.getState().setNarrowbandPinnedDwellIndex(2.7);
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBe(2);
    useUiStore.getState().setNarrowbandPinnedDwellIndex(-3);
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBe(0);
    useUiStore.getState().setNarrowbandPinnedDwellIndex(null);
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBeNull();
  });
});
