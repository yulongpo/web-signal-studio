import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** Proves G18 pin chrome path: pin index + switch to frame mode. */
describe('G18 contextFramePsd pin chrome → store', () => {
  beforeEach(() => {
    useUiStore.setState({
      narrowbandPinnedDwellIndex: null,
      narrowbandPsdMode: 'statistical',
    });
  });

  it('STFT pin path sets index and frame mode', () => {
    useUiStore.getState().setNarrowbandPinnedDwellIndex(3);
    useUiStore.getState().setNarrowbandPsdMode('frame');
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBe(3);
    expect(useUiStore.getState().narrowbandPsdMode).toBe('frame');
  });

  it('clear pin sets null; contextFramePsd requires pin', () => {
    useUiStore.getState().setNarrowbandPinnedDwellIndex(1);
    useUiStore.getState().setNarrowbandPinnedDwellIndex(null);
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBeNull();
  });
});
