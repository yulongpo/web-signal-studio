/**
 * M-06 marks panel (Bot-B): thin UI chrome over Bot-F window.__wssM06.
 * Playwright may drive the hook directly and assert these testids, or click undo/redo.
 */
import { useCallback, useEffect, useState } from 'react';
import type { M06SessionSnapshot } from '../projectIo';

type MarkRow = { id: string; name: string; start: string; end: string };

function readHookState(): {
  snapshot: M06SessionSnapshot | null;
  marks: MarkRow[];
  channelHasSnapshot: boolean;
  channelAnnotationId?: string;
} {
  const hook = window.__wssM06;
  if (!hook) {
    return { snapshot: null, marks: [], channelHasSnapshot: false };
  }
  const snapshot = hook.getState();
  const anns = hook.session.annotations.annotations ?? [];
  const marks: MarkRow[] = anns.map((a) => ({
    id: a.id,
    name: a.name ?? a.id,
    start: String(a.start),
    end: String(a.end),
  }));
  let channelHasSnapshot = false;
  let channelAnnotationId: string | undefined;
  try {
    const decoded = hook.session.readChannelSnapshot('file-1', 'ch-1');
    channelHasSnapshot = decoded != null;
    channelAnnotationId = decoded?.annotationId;
  } catch {
    channelHasSnapshot = false;
  }
  return { snapshot, marks, channelHasSnapshot, channelAnnotationId };
}

export function M06MarksPanel() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  void tick;
  const { snapshot, marks, channelHasSnapshot, channelAnnotationId } = readHookState();
  const hookReady = Boolean(window.__wssM06);

  const onUndo = () => {
    window.__wssM06?.undo();
    refresh();
  };
  const onRedo = () => {
    window.__wssM06?.redo();
    refresh();
  };

  return (
    <div className="m06-marks-panel" data-testid="m06-panel" data-hook-ready={hookReady}>
      <h3 data-testid="m06-title">Marks (M-06)</h3>
      <p data-testid="m06-hook-status">{hookReady ? 'hook:ready' : 'hook:missing'}</p>
      <p data-testid="m06-mark-count">marks:{snapshot?.annotationCount ?? 0}</p>
      <p data-testid="m06-undo-depth">undoDepth:{snapshot?.undoDepth ?? 0}</p>
      <p data-testid="m06-redo-depth">redoDepth:{snapshot?.redoDepth ?? 0}</p>
      <p
        data-testid="m06-snapshot-status"
        data-has-snapshot={channelHasSnapshot ? 'true' : 'false'}
        data-annotation-id={channelAnnotationId ?? ''}
      >
        channelSnapshot:{channelHasSnapshot ? 'attached' : 'empty'}
        {channelAnnotationId ? ` (${channelAnnotationId})` : ''}
      </p>
      <div className="m06-actions">
        <button
          type="button"
          data-testid="m06-btn-undo"
          disabled={!snapshot?.canUndo}
          onClick={onUndo}
        >
          Undo
        </button>
        <button
          type="button"
          data-testid="m06-btn-redo"
          disabled={!snapshot?.canRedo}
          onClick={onRedo}
        >
          Redo
        </button>
      </div>
      <ul data-testid="m06-mark-list">
        {marks.length === 0 ? (
          <li data-testid="m06-mark-list-empty">No marks</li>
        ) : (
          marks.map((m) => (
            <li
              key={m.id}
              data-testid={`m06-mark-item-${m.id}`}
              data-mark-id={m.id}
              data-start={m.start}
              data-end={m.end}
            >
              {m.name} [{m.start},{m.end}]
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
