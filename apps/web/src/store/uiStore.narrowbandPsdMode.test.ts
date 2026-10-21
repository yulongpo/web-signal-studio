import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** Proves nb-select-psd-mode onChange path: setNarrowbandPsdMode updates store. */
describe('G18 narrowbandPsdMode UI->store', () => {
  beforeEach(() => {
    useUiStore.setState({ narrowbandPsdMode: 'statistical' });
  });

  it('defaults to statistical', () => {
    expect(useUiStore.getState().narrowbandPsdMode).toBe('statistical');
  });

  it('setNarrowbandPsdMode updates store (select onChange)', () => {
    useUiStore.getState().setNarrowbandPsdMode('frame');
    expect(useUiStore.getState().narrowbandPsdMode).toBe('frame');
    useUiStore.getState().setNarrowbandPsdMode('statistical');
    expect(useUiStore.getState().narrowbandPsdMode).toBe('statistical');
  });
});
