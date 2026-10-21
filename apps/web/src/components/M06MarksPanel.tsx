/**
 * M-06 marks panel + AnnotationPanel multi-select paint (desktop 17471a6 colors).
 * current #205d7c · selected #183f59 · hover #22425a — independent cues.
 */
import { useCallback, useEffect, useState, type MouseEvent } from 'react';
import type { M06SessionSnapshot } from '../projectIo';

type MarkRow = { id: string; name: string; start: string; end: string; deleted?: boolean };

function readHookState(): {
  snapshot: M06SessionSnapshot | null;
  marks: MarkRow[];
  selected: string[];
  active: string | null;
  channelHasSnapshot: boolean;
  channelAnnotationId?: string;
} {
  const hook = window.__wssM06;
  if (!hook) {
    return {
      snapshot: null,
      marks: [],
      selected: [],
      active: null,
      channelHasSnapshot: false,
    };
  }
  const snapshot = hook.getState();
  const anns = hook.session.annotations.annotations ?? [];
  const marks: MarkRow[] = anns.map((a) => ({
    id: a.id,
    name: a.name ?? a.id,
    start: String(a.start),
    end: String(a.end),
    deleted: Boolean(a.deleted),
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
  return {
    snapshot,
    marks,
    selected: snapshot.selectedMarkIds ?? [],
    active: snapshot.activeMarkId ?? null,
    channelHasSnapshot,
    channelAnnotationId,
  };
}

export function M06MarksPanel() {
  const [tick, setTick] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  void tick;
  const {
    snapshot,
    marks,
    selected,
    active,
    channelHasSnapshot,
    channelAnnotationId,
  } = readHookState();
  const hookReady = Boolean(window.__wssM06);
  const visible = marks.filter((m) => !m.deleted);

  const selectMark = (markId: string, additive: boolean) => {
    const hook = window.__wssM06;
    if (!hook) return;
    const prev = hook.getState().selectedMarkIds ?? [];
    let next: string[];
    if (additive) {
      next = prev.includes(markId) ? prev.filter((id) => id !== markId) : [...prev, markId];
      if (next.length === 0) next = [markId];
    } else {
      next = [markId];
    }
    hook.setSelection({ activeMarkId: markId, selectedMarkIds: next });
    refresh();
  };

  const selectAllVisible = (on: boolean) => {
    const hook = window.__wssM06;
    if (!hook) return;
    const ids = on ? visible.map((m) => m.id) : [];
    const activeId = ids.includes(active ?? '') ? active : ids[0] ?? null;
    hook.setSelection({ activeMarkId: activeId, selectedMarkIds: ids });
    refresh();
  };

  const onUndo = () => {
    window.__wssM06?.undo();
    refresh();
  };
  const onRedo = () => {
    window.__wssM06?.redo();
    refresh();
  };

  const allSelected =
    visible.length > 0 && visible.every((m) => selected.includes(m.id));
  const someSelected = selected.length > 0 && !allSelected;

  return (
    <div
      className="m06-marks-panel annotation-panel"
      data-testid="m06-panel"
      data-annotation-panel="true"
      data-hook-ready={hookReady}
      data-selected-count={selected.length}
    >
      <h3 data-testid="m06-title">标注面板</h3>
      <p data-testid="m06-hook-status">{hookReady ? 'hook:ready' : 'hook:missing'}</p>
      <p data-testid="m06-mark-count">marks:{snapshot?.annotationCount ?? 0}</p>
      <p data-testid="annotation-selection-summary">
        匹配 {visible.length} / 总数 {marks.length} / 已选 {selected.length}
      </p>
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
      <div className="m06-actions annotation-panel-toolbar">
        <label className="annotation-select-all" data-testid="annotation-select-all">
          <input
            type="checkbox"
            data-testid="annotation-select-all-check"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={(e) => selectAllVisible(e.target.checked)}
          />
          全选
        </label>
        <button
          type="button"
          data-testid="m06-btn-undo"
          disabled={!snapshot?.canUndo}
          onClick={onUndo}
        >
          撤销
        </button>
        <button
          type="button"
          data-testid="m06-btn-redo"
          disabled={!snapshot?.canRedo}
          onClick={onRedo}
        >
          重做
        </button>
      </div>
      <ul
        className="annotation-mark-table"
        data-testid="m06-mark-list"
        data-annotation-paint="desktop-multi"
      >
        {visible.length === 0 ? (
          <li data-testid="m06-mark-list-empty">无标记</li>
        ) : (
          visible.map((m) => {
            const isSelected = selected.includes(m.id);
            const isCurrent = active === m.id;
            const isHovered = hoveredId === m.id;
            return (
              <li
                key={m.id}
                className={[
                  'annotation-mark-row',
                  isCurrent ? 'is-current' : '',
                  isSelected ? 'is-selected' : '',
                  isHovered ? 'is-hovered' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                data-testid={`m06-mark-item-${m.id}`}
                data-mark-id={m.id}
                data-start={m.start}
                data-end={m.end}
                data-selected={isSelected ? 'true' : 'false'}
                data-current={isCurrent ? 'true' : 'false'}
                data-hovered={isHovered ? 'true' : 'false'}
                onMouseEnter={() => setHoveredId(m.id)}
                onMouseLeave={() => setHoveredId((id) => (id === m.id ? null : id))}
                onClick={(e: MouseEvent<HTMLLIElement>) => {
                  selectMark(m.id, e.metaKey || e.ctrlKey || e.shiftKey);
                }}
              >
                <span
                  className={`annotation-mark-check${isSelected ? ' on' : ''}`}
                  aria-hidden
                />
                <span className="annotation-mark-name">{m.name}</span>
                <span className="annotation-mark-range">
                  [{m.start},{m.end}]
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
