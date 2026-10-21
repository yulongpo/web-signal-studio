/**
 * G18 Esc → clear active pin (desktop MainWindow eventFilter Key_Escape).
 * Priority after modal drafts / ROI / context menu / editing fields.
 * Wideband: clearLinkedCursor. Narrowband: clear dwell + restore statistical PSD
 * (Session::clearCursor drops framePsd).
 */
import { useEffect } from 'react';
import { useUiStore } from '../store/uiStore';

function isEditingField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  if (target.closest('[data-parameter-draft="true"]')) return true;
  if (target.closest('#annotationTableEditor, [data-testid="annotation-table-editor"]'))
    return true;
  if (target.closest('[role="menuitem"], [data-testid="chart-context-menu"]')) return true;
  return false;
}

function hasBlockingModal(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.querySelector('[role="dialog"][aria-modal="true"]')) return true;
  if (document.querySelector('[data-testid="chart-context-menu"]')) return true;
  return false;
}

/** Mount once under App shell. Returns nothing; side-effect only. */
export function useEscClearPinnedCursor(): void {
  const openTempLayer = useUiStore((s) => s.openTempLayer);
  const activeTool = useUiStore((s) => s.activeTool);
  const clearActivePinnedCursor = useUiStore((s) => s.clearActivePinnedCursor);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (e.defaultPrevented) return;
      if (openTempLayer) return; // TempLayers owns Esc (revert+close)
      if (activeTool === 'roi') return; // MainChartHost ROI Esc owns cancel
      if (hasBlockingModal()) return;
      if (isEditingField(e.target)) return;
      const cleared = clearActivePinnedCursor();
      if (cleared) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openTempLayer, activeTool, clearActivePinnedCursor]);
}
