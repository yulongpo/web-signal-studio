/**
 * G08 wave23/wave33: rebuild MainWindow::buildMenus QKeySequence parity.
 * New/Open/Save/Undo/Redo/Delete/SelectAll + Alt+Left/Right view history.
 * Skips when focus is a typing target (Qt QLineEdit preference).
 */
import { useEffect, useRef } from 'react';

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('[contenteditable="true"]'));
}

export type MenuBarShortcutHandlers = {
  onNewProject: () => void;
  onOpenProjectJson: () => void;
  onSaveProject: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteMark: () => void;
  /** Desktop QKeySequence::SelectAll (~main_window.cpp L4234). */
  onSelectAllMarks: () => void;
  viewHistoryBack: () => void;
  viewHistoryForward: () => void;
  canUndo: boolean;
  canRedo: boolean;
  canDeleteMark: boolean;
  canSelectAllMarks: boolean;
  canViewBack: boolean;
  canViewForward: boolean;
  canSave: boolean;
};

/** Stable window keydown wiring; handlers read from a ref each keystroke. */
export function useMenuBarShortcuts(handlers: MenuBarShortcutHandlers): void {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const h = ref.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      if (e.altKey && !mod && e.key === 'ArrowLeft') {
        if (isTypingTarget(e.target)) return;
        if (!h.canViewBack) return;
        e.preventDefault();
        h.viewHistoryBack();
        return;
      }
      if (e.altKey && !mod && e.key === 'ArrowRight') {
        if (isTypingTarget(e.target)) return;
        if (!h.canViewForward) return;
        e.preventDefault();
        h.viewHistoryForward();
        return;
      }

      if (!mod && !e.altKey && e.key === 'Delete') {
        if (isTypingTarget(e.target)) return;
        if (!h.canDeleteMark) return;
        e.preventDefault();
        h.onDeleteMark();
        return;
      }

      if (!mod || e.altKey) return;
      if (isTypingTarget(e.target)) return;

      if (key === 'n' && !e.shiftKey) {
        e.preventDefault();
        h.onNewProject();
        return;
      }
      if (key === 'o' && !e.shiftKey) {
        e.preventDefault();
        h.onOpenProjectJson();
        return;
      }
      if (key === 's' && !e.shiftKey) {
        if (!h.canSave) return;
        e.preventDefault();
        h.onSaveProject();
        return;
      }
      if (key === 'z' && !e.shiftKey) {
        if (!h.canUndo) return;
        e.preventDefault();
        h.onUndo();
        return;
      }
      if ((key === 'y' && !e.shiftKey) || (key === 'z' && e.shiftKey)) {
        if (!h.canRedo) return;
        e.preventDefault();
        h.onRedo();
        return;
      }
      // Wave33 B1: Ctrl+A SelectAll marks (desktop ShortcutOverride SelectAll).
      if (key === 'a' && !e.shiftKey) {
        if (!h.canSelectAllMarks) return;
        e.preventDefault();
        h.onSelectAllMarks();
        return;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
