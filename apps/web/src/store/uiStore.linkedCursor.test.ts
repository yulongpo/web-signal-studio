import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** G18 multi-chart linked cursor — desktop Session::LinkedCursorState contract. */
describe('G18 linkedCursor store (Main/Aux sync)', () => {
  beforeEach(() => {
    useUiStore.getState().clearLinkedCursor();
  });

  it('starts unpinned', () => {
    expect(useUiStore.getState().linkedCursor.pinned).toBe(false);
  });

  it('main pin sets time+freq+frame', () => {
    useUiStore.getState().pinLinkedCursor({
      source: 'main',
      timeSec: 0.25,
      frequencyHz: 1.5e6,
      selectedFrame: 4,
    });
    const c = useUiStore.getState().linkedCursor;
    expect(c.pinned).toBe(true);
    expect(c.timeSec).toBe(0.25);
    expect(c.frequencyHz).toBe(1.5e6);
    expect(c.selectedFrame).toBe(4);
  });

  it('psd pin updates freq only; keeps prior time when pinned', () => {
    useUiStore.getState().pinLinkedCursor({
      source: 'main',
      timeSec: 0.1,
      frequencyHz: 1e6,
      selectedFrame: 2,
    });
    useUiStore.getState().pinLinkedCursor({
      source: 'psd',
      frequencyHz: 2e6,
    });
    const c = useUiStore.getState().linkedCursor;
    expect(c.timeSec).toBe(0.1);
    expect(c.frequencyHz).toBe(2e6);
  });

  it('wave pin uses centerFrequencyHz when first pin', () => {
    useUiStore.getState().pinLinkedCursor({
      source: 'wave',
      timeSec: 0.4,
      centerFrequencyHz: 915e6,
    });
    const c = useUiStore.getState().linkedCursor;
    expect(c.pinned).toBe(true);
    expect(c.timeSec).toBe(0.4);
    expect(c.frequencyHz).toBe(915e6);
  });

  it('clearLinkedCursor resets', () => {
    useUiStore.getState().pinLinkedCursor({
      source: 'main',
      timeSec: 1,
      frequencyHz: 2,
      selectedFrame: 3,
    });
    useUiStore.getState().clearLinkedCursor();
    expect(useUiStore.getState().linkedCursor.pinned).toBe(false);
    expect(useUiStore.getState().linkedCursor.selectedFrame).toBeNull();
  });
});
