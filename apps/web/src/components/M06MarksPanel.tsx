/**
 * M-06 marks panel + AnnotationPanel multi-select paint (desktop 17471a6 colors).
 * G19: paging(200) / quality filter+actions / table chrome. current #205d7c · selected #183f59 · hover #22425a.
 */
import { useCallback, useEffect, useMemo, useState, type MouseEvent } from 'react';
import type { ReviewStatus } from '@wss/contracts';
import type { M06SessionSnapshot } from '../projectIo';
import { getIqFileSession } from '../dsp/iqFileSession';
import {
  QUALITY_LABEL_CN,
  annotationToTableRow,
  type AnnotationTableRow,
} from './annotationTableMatrix';

type MarkRow = AnnotationTableRow;

const PAGE_SIZE = 200;

const QUALITY_LABEL = QUALITY_LABEL_CN;

type QualityFilter = 'all' | ReviewStatus;

function readHookState(): {
  snapshot: M06SessionSnapshot | null;
  marks: MarkRow[];
  selected: string[];
  active: string | null;
  hovered: string | null;
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
      hovered: null,
      channelHasSnapshot: false,
    };
  }
  const snapshot = hook.getState();
  const anns = hook.session.annotations.annotations ?? [];
  let channelHasSnapshot = false;
  let channelAnnotationId: string | undefined;
  try {
    const decoded = hook.session.readChannelSnapshot('file-1', 'ch-1');
    channelHasSnapshot = decoded != null;
    channelAnnotationId = decoded?.annotationId;
  } catch {
    channelHasSnapshot = false;
  }
  const sampleRateHz = getIqFileSession()?.sampleRateHz ?? null;
  const channelCountByAnnotationId: Record<string, number> = {};
  if (channelAnnotationId) {
    channelCountByAnnotationId[channelAnnotationId] = 1;
  }
  const marks: MarkRow[] = anns.map((a) =>
    annotationToTableRow(a, { sampleRateHz, channelCountByAnnotationId }),
  );
  return {
    snapshot,
    marks,
    selected: snapshot.selectedMarkIds ?? [],
    active: snapshot.activeMarkId ?? null,
    hovered: snapshot.hoveredMarkId ?? null,
    channelHasSnapshot,
    channelAnnotationId,
  };
}

export function M06MarksPanel() {
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(0);
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
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
    hovered: hoveredId,
    channelHasSnapshot,
    channelAnnotationId,
  } = readHookState();
  const hookReady = Boolean(window.__wssM06);

  const filtered = useMemo(() => {
    return marks.filter((m) => {
      if (m.deleted) return false;
      if (qualityFilter !== 'all' && m.reviewStatus !== qualityFilter) return false;
      return true;
    });
  }, [marks, qualityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [qualityFilter]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

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
    const ids = on ? filtered.map((m) => m.id) : [];
    // CI fix: setSelection.activeMarkId is string | undefined (not null).
    const activeId: string | undefined = ids.includes(active ?? '')
      ? (active ?? undefined)
      : ids[0];
    hook.setSelection({ activeMarkId: activeId, selectedMarkIds: ids });
    refresh();
  };

  const applyQuality = (status: ReviewStatus) => {
    const hook = window.__wssM06;
    if (!hook || selected.length === 0) return;
    for (const id of selected) {
      const current = hook.session.annotations.annotations.find((a) => a.id === id);
      if (!current) continue;
      hook.session.replaceMark({ ...current, reviewStatus: status });
    }
    refresh();
  };

  const beginEdit = (m: MarkRow) => {
    const hook = window.__wssM06;
    if (!hook) return;
    const ann = hook.session.annotations.annotations.find((a) => a.id === m.id);
    if (!ann) return;
    setEditingId(m.id);
    setEditName(ann.name || m.name);
    setEditNote(typeof ann.note === 'string' ? ann.note : '');
  };

  const commitEdit = () => {
    const hook = window.__wssM06;
    if (!hook || !editingId) return;
    const current = hook.session.annotations.annotations.find((a) => a.id === editingId);
    if (!current) {
      setEditingId(null);
      return;
    }
    const name = editName.trim() || current.name || current.id;
    const note = editNote;
    hook.session.replaceMark({ ...current, name, note });
    setEditingId(null);
    refresh();
  };

  const cancelEdit = () => {
    setEditingId(null);
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
    filtered.length > 0 && filtered.every((m) => selected.includes(m.id));
  const someSelected = selected.length > 0 && !allSelected;

  const locateActiveMark = () => {
    const hook = window.__wssM06;
    const id = active ?? (selected.length === 1 ? selected[0] : null);
    if (!hook || !id) return;
    hook.setSelection({
      activeMarkId: id,
      selectedMarkIds: selected.includes(id) ? selected : [id],
    });
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-testid="m06-mark-row-${id}"]`);
      if (el && "scrollIntoView" in el) (el as HTMLElement).scrollIntoView({ block: "nearest" });
    });
  };

  const deleteSelectedMarks = () => {
    const hook = window.__wssM06;
    if (!hook || selected.length === 0) return;
    for (const id of [...selected]) hook.removeMark(id);
    if (editingId && selected.includes(editingId)) setEditingId(null);
  };

  const selectAdjacentSegment = (offset: number) => {
    const hook = window.__wssM06;
    const id = editingId ?? active ?? (selected.length === 1 ? selected[0] : null);
    if (!hook || !id) return;
    const ann = hook.session.annotations.annotations.find((a) => a.id === id);
    if (!ann?.segments?.length) return;
    const segs = ann.segments;
    let idx = Math.max(0, segs.findIndex((s) => s.id === ann.activeSegmentId));
    const next = Math.max(0, Math.min(segs.length - 1, idx + offset));
    hook.session.replaceMark({ ...ann, activeSegmentId: segs[next].id });
    if (editingId === id) {
      const row = filtered.find((x) => x.id === id);
      if (row) beginEdit(row);
    }
  };


  return (
    <div
      className="m06-marks-panel annotation-panel"
      data-testid="m06-panel"
      data-annotation-panel="true"
      data-annotation-edit="inline-replaceMark"
      data-edit-selection={selected.length === 1 ? 'single' : selected.length === 0 ? 'empty' : 'multi'}
      data-edit-path="replaceMark" data-qt-reshot="wave8-annotation-panel" data-qt-interactive="wave9"
      data-hook-ready={hookReady}
      data-selected-count={selected.length}
    >
      <h3 data-testid="m06-title">标注面板</h3>
      <p data-testid="m06-hook-status">{hookReady ? 'hook:ready' : 'hook:missing'}</p>
      <p data-testid="m06-mark-count">marks:{snapshot?.annotationCount ?? 0}</p>
      <p data-testid="annotation-selection-summary">
        匹配 {filtered.length} / 总数 {marks.length} / 已选 {selected.length} · 页{' '}
        {safePage + 1}/{totalPages}
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
        <label className="annotation-quality-filter" data-testid="annotation-quality-filter">
          <span>质量</span>
          <select
            data-testid="annotation-quality-filter-select"
            value={qualityFilter}
            onChange={(e) => setQualityFilter(e.target.value as QualityFilter)}
          >
            <option value="all">全部质量</option>
            <option value="Pending">待判断</option>
            <option value="Accepted">已采纳</option>
            <option value="Rejected">已忽略</option>
          </select>
        </label>
        <button
          type="button"
          data-testid="m06-quality-accept"
          disabled={selected.length === 0}
          onClick={() => applyQuality('Accepted')}
        >
          已采纳
        </button>
        <button
          type="button"
          data-testid="m06-quality-reject"
          disabled={selected.length === 0}
          onClick={() => applyQuality('Rejected')}
        >
          已忽略
        </button>
        <button
          type="button"
          data-testid="m06-quality-pending"
          disabled={selected.length === 0}
          onClick={() => applyQuality('Pending')}
        >
          待判断
        </button>
                <div
          className="m06-review-bar"
          data-testid="m06-annotation-review-bar"
          data-qt-interactive="wave9"
        >
          <button
            type="button"
            data-testid="m06-btn-locate-mark"
            disabled={!active && selected.length !== 1}
            onClick={locateActiveMark}
          >
            定位
          </button>
          <button
            type="button"
            data-testid="m06-btn-delete-marks"
            disabled={selected.length === 0}
            onClick={deleteSelectedMarks}
          >
            删除
          </button>
          <button
            type="button"
            data-testid="m06-btn-segment-prev"
            disabled={selected.length !== 1 && !active}
            onClick={() => selectAdjacentSegment(-1)}
          >
            上一段
          </button>
          <button
            type="button"
            data-testid="m06-btn-segment-next"
            disabled={selected.length !== 1 && !active}
            onClick={() => selectAdjacentSegment(1)}
          >
            下一段
          </button>
        </div>
<button
          type="button"
          data-testid="m06-edit-mark"
          disabled={selected.length !== 1}
          title="Edit selected mark name/note via replaceMark"
          onClick={() => {
            const row = filtered.find((x) => x.id === selected[0]);
            if (row) beginEdit(row);
          }}
        >
          编辑
        </button>
        {selected.length === 0 ? (
          <span className="muted" data-testid="m06-edit-empty-hint">
            无选中；编辑空闲
          </span>
        ) : null}
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
      <div className="annotation-paging" data-testid="annotation-paging">
        <button
          type="button"
          data-testid="annotation-prev-page"
          disabled={safePage === 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          上一页
        </button>
        <button
          type="button"
          data-testid="annotation-next-page"
          disabled={(safePage + 1) * PAGE_SIZE >= filtered.length}
          onClick={() =>
            setPage((p) => ((p + 1) * PAGE_SIZE < filtered.length ? p + 1 : p))
          }
        >
          下一页
        </button>
        <span className="muted" data-testid="annotation-page-size">
          每页 {PAGE_SIZE}
        </span>
      </div>
            {editingId ? (
        <div className="annotation-edit-form" data-testid="m06-edit-form" data-editing-id={editingId}>
          <label>
            <span>名字</span>
            <input
              data-testid="m06-edit-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
          </label>
          <label>
            <span>备注</span>
            <input
              data-testid="m06-edit-note"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') cancelEdit();
              }}
            />
          </label>
          <button type="button" data-testid="m06-edit-commit" data-qt-apply="wave9" onClick={commitEdit}>
            保存
          </button>
          <button type="button" data-testid="m06-edit-cancel" onClick={cancelEdit}>
            取消
          </button>
        </div>
      ) : null}
      <div
        className="annotation-table-header annotation-table-header-full"
        data-testid="annotation-table-header"
        data-column-matrix="qt-full"
      >
        <span className="col-h col-h-0" data-col="0"></span>
        <span className="col-h col-h-1" data-col="1">名称 / annotationId</span>
        <span className="col-h col-h-2" data-col="2">来源</span>
        <span className="col-h col-h-3" data-col="3">当前段</span>
        <span className="col-h col-h-4" data-col="4">起始 / ms</span>
        <span className="col-h col-h-5" data-col="5">结束 / ms</span>
        <span className="col-h col-h-6" data-col="6">中心 / MHz</span>
        <span className="col-h col-h-7" data-col="7">带宽 / kHz</span>
        <span className="col-h col-h-8" data-col="8">mean</span>
        <span className="col-h col-h-9" data-col="9">质量</span>
        <span className="col-h col-h-10" data-col="10">通道</span>
      </div>
      <ul
        className="annotation-mark-table"
        data-testid="m06-mark-list"
        data-annotation-paint="desktop-multi"
        data-page={String(safePage + 1)}
        data-page-size={String(PAGE_SIZE)}
      >
        {pageRows.length === 0 ? (
          <li data-testid="m06-mark-list-empty">无标记</li>
        ) : (
          pageRows.map((m) => {
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
                data-source-kind={m.sourceKind ?? ''}
                data-review={m.reviewStatus}
                onMouseEnter={() => {
                  window.__wssM06?.setHoveredMark?.(m.id);
                  refresh();
                }}
                onMouseLeave={() => {
                  if (window.__wssM06?.getState?.()?.hoveredMarkId === m.id) {
                    window.__wssM06?.setHoveredMark?.(null);
                    refresh();
                  }
                }}
                onClick={(e: MouseEvent<HTMLLIElement>) => {
                  selectMark(m.id, e.metaKey || e.ctrlKey || e.shiftKey);
                }}
                onDoubleClick={() => beginEdit(m)}
              >
                <span
                  className={`annotation-mark-check${isSelected ? ' on' : ''}`}
                  aria-hidden
                />
                <span className="annotation-mark-name" title={m.nameCell}>{m.name}</span>
                <span className="muted col-kind">{m.sourceLabel}</span>
                <span className="col-segment">{m.segmentLabel}</span>
                <span className="col-start-ms">{m.startMs}</span>
                <span className="col-end-ms">{m.endMs}</span>
                <span className="col-center-mhz">{m.centerMhz}</span>
                <span className="col-bw-khz">{m.bandwidthKhz}</span>
                <span className="col-mean">{m.mean}</span>
                <span className="annotation-mark-quality">{QUALITY_LABEL[m.reviewStatus]}</span>
                <span className="col-channel">{m.channelLabel}</span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
