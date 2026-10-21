import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** G18 Esc clear pin — desktop MainWindow::clearActiveLinkedCursor / Session::clearCursor. */
describe('G18 clearActivePinnedCursor (Esc clear)', () => {
  beforeEach(() => {
    useUiStore.setState({
      workspaceMode: 'wideband',
      narrowbandPinnedDwellIndex: null,
      narrowbandPsdMode: 'statistical',
    });
    useUiStore.getState().clearLinkedCursor();
  });

  it('wideband: clears linkedCursor pin', () => {
    useUiStore.getState().pinLinkedCursor({
      source: 'main',
      timeSec: 0.2,
      frequencyHz: 1e6,
      selectedFrame: 1,
    });
    expect(useUiStore.getState().clearActivePinnedCursor()).toBe(true);
    expect(useUiStore.getState().linkedCursor.pinned).toBe(false);
    expect(useUiStore.getState().linkedCursor.selectedFrame).toBeNull();
  });

  it('wideband: no-op when unpinned', () => {
    expect(useUiStore.getState().clearActivePinnedCursor()).toBe(false);
  });

  it('narrowband: clears dwell and restores statistical PSD', () => {
    useUiStore.setState({
      workspaceMode: 'narrowband',
      narrowbandPinnedDwellIndex: 5,
      narrowbandPsdMode: 'frame',
    });
    expect(useUiStore.getState().clearActivePinnedCursor()).toBe(true);
    expect(useUiStore.getState().narrowbandPinnedDwellIndex).toBeNull();
    expect(useUiStore.getState().narrowbandPsdMode).toBe('statistical');
  });

  it('narrowband: restores statistical even if only frame mode set', () => {
    useUiStore.setState({
      workspaceMode: 'narrowband',
      narrowbandPinnedDwellIndex: null,
      narrowbandPsdMode: 'frame',
    });
    expect(useUiStore.getState().clearActivePinnedCursor()).toBe(true);
    expect(useUiStore.getState().narrowbandPsdMode).toBe('statistical');
  });
});
