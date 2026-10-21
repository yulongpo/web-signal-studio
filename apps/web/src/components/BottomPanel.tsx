/**
 * Bot-B G07 bottom bar — AnnotationPanel / DetectionPanel docks vs rebuild 17471a6.
 * G19: full Qt column matrix + paging(200)/quality. G07: live Detect feeds.
 * G08: bottom height 100–500 + collapse-to-min (29px) persist. G02 chrome adjacent.
 * Honest hosts — no fake DSP runs or invented marks. IQ only via real open path.
 */
import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import type { ReviewStatus } from '@wss/contracts';
import { useUiStore } from '../store/uiStore';
import { getIqFileSession } from '../dsp/iqFileSession';
import {
  QUALITY_LABEL_CN,
  annotationToTableRow,
} from './annotationTableMatrix';
import { LocalComputeClient } from '../localCompute/client';

const TABS = [
  { id: 'marks' as const, label: '统一标记记录', testId: 'bottom-tab-marks' },
  { id: 'tasks' as const, label: '后台任务', testId: 'bottom-tab-tasks' },
  { id: 'log' as const, label: '日志', testId: 'bottom-tab-log' },
];

const PAGE_SIZE = 200;

type MarkLayer = 'all' | 'Manual' | 'ImportedLabel' | 'Algorithm';
type QualityFilter = 'all' | ReviewStatus;

const QUALITY_LABEL = QUALITY_LABEL_CN;

export function BottomPanel() {
  const expanded = useUiStore((s) => s.bottomPanelExpanded);
  const setExpanded = useUiStore((s) => s.setBottomPanelExpanded);
  const tab = useUiStore((s) => s.bottomPanelTab);
  const setTab = useUiStore((s) => s.setBottomPanelTab);
  const heightPx = useUiStore((s) => s.bottomPanelHeightPx);
  const setHeightPx = useUiStore((s) => s.setBottomPanelHeightPx);
  const task = useUiStore((s) => s.taskProgress);
  const logs = useUiStore((s) => s.shellLogLines);
  const clearLog = useUiStore((s) => s.clearShellLog);
  const fileLabel = useUiStore((s) => s.statusFileLabel);
  const channelLabel = useUiStore((s) => s.statusChannelLabel);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const projectSummary = useUiStore((s) => s.projectSummary);
  const setRightPage = useUiStore((s) => s.setRightPage);
  const setRightPanelCollapsed = useUiStore((s) => s.setRightPanelCollapsed);
  const appendShellLog = useUiStore((s) => s.appendShellLog);
  const detectRunFeed = useUiStore((s) => s.detectRunFeed);
  const detectRunSelectedId = useUiStore((s) => s.detectRunSelectedId);
  const selectDetectRun = useUiStore((s) => s.selectDetectRun);
  const upsertDetectRun = useUiStore((s) => s.upsertDetectRun);
  const localComputeBaseUrl = useUiStore((s) => s.localComputeBaseUrl);
  const localComputeToken = useUiStore((s) => s.localComputeToken);
  const detectCapabilities = useUiStore((s) => s.detectCapabilities);

  const [m06Tick, setM06Tick] = useState(0);
  const [markLayer, setMarkLayer] = useState<MarkLayer>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [page, setPage] = useState(0);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const resizeStart = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (window.__wssM06) setM06Tick((t) => t + 1);
    }, 400);
    return () => window.clearInterval(id);
  }, []);
  void m06Tick;

  const hook = typeof window !== 'undefined' ? window.__wssM06 : undefined;
  const annotations = hook?.session.annotations.annotations ?? [];
  const snap = hook?.getState?.();
  const selectedIds = snap?.selectedMarkIds ?? [];
  const activeMarkId = snap?.activeMarkId ?? null;

  const sampleRateHz = getIqFileSession()?.sampleRateHz ?? null;

  const channelCountByAnnotationId = useMemo(() => {
    const counts: Record<string, number> = {};
    const hookNow = typeof window !== 'undefined' ? window.__wssM06 : undefined;
    const channels = (hookNow?.session as { channels?: Array<{ annotationId?: string }> } | undefined)
      ?.channels;
    if (Array.isArray(channels)) {
      for (const ch of channels) {
        const id = ch?.annotationId;
        if (!id) continue;
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [m06Tick]);

  const marks = useMemo(() => {
    return annotations.map((a) =>
      annotationToTableRow(a, {
        sampleRateHz,
        channelCountByAnnotationId,
      }),
    );
  }, [annotations, m06Tick, sampleRateHz, channelCountByAnnotationId]);

  const filteredMarks = useMemo(() => {
    return marks.filter((m) => {
      if (markLayer !== 'all' && m.sourceKind !== markLayer) return false;
      if (qualityFilter !== 'all' && m.reviewStatus !== qualityFilter) return false;
      return true;
    });
  }, [marks, markLayer, qualityFilter]);

  const liveFiltered = filteredMarks.filter((m) => !m.deleted);
  const totalPages = Math.max(1, Math.ceil(filteredMarks.length / PAGE_SIZE) || 1);
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = filteredMarks.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [markLayer, qualityFilter]);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [safePage, page]);

  const markCount = marks.filter((m) => !m.deleted).length;
  const softCount = marks.filter((m) => m.deleted).length;

  const marksSummary =
    fileLabel && fileLabel !== 'No file'
      ? `${fileLabel}    标记 ${markCount} 个${softCount ? `（软删 ${softCount}）` : ''}，通道摘要 ${channelLabel || '—'}。`
      : '空工程 · 请添加 IQ 文件';

  const taskSummary =
    workspaceMode === 'narrowband'
      ? `窄带通道 · ${channelLabel && channelLabel !== '—' ? channelLabel : '等待后台处理'}（Web：无伪造进度）`
      : fileLabel === 'No file'
        ? '空工程 · 无后台任务。'
        : task.label || '无后台任务；图谱/DSP 由 Worker 路径报告（不伪造进度）。';

  const openTab = (id: typeof tab) => {
    setTab(id);
    setExpanded(true);
  };

  const openMarkerRail = () => {
    setRightPanelCollapsed(false);
    setRightPage('marker');
  };
  const openDetectRail = () => {
    setRightPanelCollapsed(false);
    setRightPage('detect');
    appendShellLog('打开检测页（底栏 Detection 坞 → 右侧 Detect；不伪造运行）');
  };

  const applyQuality = (status: ReviewStatus) => {
    const hookNow = window.__wssM06;
    if (!hookNow || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const current = hookNow.session.annotations.annotations.find((a) => a.id === id);
      if (!current) continue;
      hookNow.session.replaceMark({ ...current, reviewStatus: status });
    }
    appendShellLog(`质量标记 → ${QUALITY_LABEL[status]}（${selectedIds.length}）`);
    setM06Tick((t) => t + 1);
  };

  const startBottomResize = (clientY0: number) => {
    if (!expanded) setExpanded(true);
    resizeStart.current = { y: clientY0, h: heightPx };
    const onMove = (e: PointerEvent) => {
      const start = resizeStart.current;
      if (!start) return;
      // drag up → taller (desktop reverse on bottomResize_)
      const next = start.h + (start.y - e.clientY);
      setHeightPx(next);
    };
    const onUp = () => {
      resizeStart.current = null;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };


  const [detectStatusFilter, setDetectStatusFilter] = useState<'all' | string>('all');

  const filteredDetectRuns = useMemo(() => {
    if (detectStatusFilter === 'all') return detectRunFeed;
    const map: Record<string, string[]> = {
      running: ['queued', 'running'],
      done: ['succeeded'],
      failed: ['failed', 'BLOCKED'],
      cancelled: ['cancelled'],
    };
    const allow = map[detectStatusFilter] ?? [detectStatusFilter];
    return detectRunFeed.filter((r) => allow.includes(r.status));
  }, [detectRunFeed, detectStatusFilter]);

  const selectedDetectRun =
    filteredDetectRuns.find((r) => r.runId === detectRunSelectedId) ??
    filteredDetectRuns[0] ??
    null;

  const refreshDetectFeeds = async () => {
    if (detectRunFeed.length === 0) {
      appendShellLog('Detect feed empty — open Detect page and run a real LocalCompute task');
      return;
    }
    const client = new LocalComputeClient({
      baseUrl: localComputeBaseUrl,
      token: localComputeToken,
    });
    for (const run of detectRunFeed.slice(0, 10)) {
      try {
        const rec = await client.getTask(run.runId);
        upsertDetectRun(rec);
      } catch (err) {
        appendShellLog(
          `Detect refresh failed ${run.runId.slice(0, 8)}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  };

  const cancelSelectedDetect = async () => {
    if (!selectedDetectRun?.runId) return;
    if (!['queued', 'running'].includes(selectedDetectRun.status)) return;
    const client = new LocalComputeClient({
      baseUrl: localComputeBaseUrl,
      token: localComputeToken,
    });
    try {
      await client.cancelTask(selectedDetectRun.runId);
      const rec = await client.getTask(selectedDetectRun.runId);
      upsertDetectRun({
        ...rec,
        result: rec.status === 'cancelled' ? null : rec.result,
      });
      appendShellLog(`Detect cancel ${selectedDetectRun.runId.slice(0, 8)}`);
    } catch (err) {
      appendShellLog(
        `Detect cancel failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const beginEditMark = (id: string) => {
    const hookNow = window.__wssM06;
    if (!hookNow) return;
    const ann = hookNow.session.annotations.annotations.find((a) => a.id === id);
    if (!ann) return;
    setEditingId(id);
    setEditName(ann.name || id);
    setEditNote(typeof ann.note === 'string' ? ann.note : '');
  };
  const commitEditMark = () => {
    const hookNow = window.__wssM06;
    if (!hookNow || !editingId) return;
    const current = hookNow.session.annotations.annotations.find((a) => a.id === editingId);
    if (!current) {
      setEditingId(null);
      return;
    }
    hookNow.session.replaceMark({
      ...current,
      name: editName.trim() || current.name || current.id,
      note: editNote,
    });
    appendShellLog(`G19 edit mark ${editingId.slice(0, 8)} via replaceMark`);
    setEditingId(null);
    setM06Tick((t) => t + 1);
  };

  const selectionSummary = `匹配 ${liveFiltered.length} / 总数 ${marks.length} / 已选 ${selectedIds.length} · 页 ${safePage + 1}/${totalPages}`;

  return (
    <section
      className="bottom-panel"
      data-testid="bottom-panel"
      data-expanded={expanded ? 'true' : 'false'}
      data-tab={tab}
      data-dock="annotation-detection"
      data-bottom-height={String(heightPx)}
      data-collapsed-min={expanded ? 'false' : 'true'}
      data-collapse-min-px="29"
      style={{ height: expanded ? heightPx : 29 }}
    >
      <div
        className="bottom-panel-resize"
        data-testid="bottom-panel-resize"
        data-shell-edge="bottom"
        data-hit-min-px="29"
        data-collapse-min="true"
        role="separator"
        aria-orientation="horizontal"
        aria-label="调整底栏高度"
        aria-valuemin={100}
        aria-valuemax={500}
        aria-valuenow={heightPx}
        onPointerDown={(e) => {
          e.preventDefault();
          startBottomResize(e.clientY);
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          // G08 collapse-to-min: desktop bottom closed height 29 (tabs only), persist expanded=false
          setExpanded(false);
          appendShellLog('G08 collapse-to-min → 29px (tabs)');
        }}
        title="拖拽调高；双击折叠到最小（29px）"
      />
      <div className="bottom-tabs" data-testid="bottom-tabs" style={{ height: 29 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="bottom-tab"
            data-testid={t.testId}
            data-active={tab === t.id}
            aria-pressed={tab === t.id}
            onClick={() => openTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <span className="bottom-tabs-spacer" />
        <div className="bottom-task-chip" data-testid="bottom-task-progress" title={taskSummary}>
          <span className="bottom-task-label">{task.percent == null ? '空闲' : `${task.percent}%`}</span>
          <span
            className="bottom-task-bar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={task.percent ?? 0}
            data-testid="bottom-task-bar"
          >
            <span
              className="bottom-task-bar-fill"
              style={{ width: `${Math.max(0, Math.min(100, task.percent ?? 0))}%` }}
            />
          </span>
        </div>
        <button
          type="button"
          className="bottom-toggle"
          data-testid="bottom-toggle"
          aria-expanded={expanded}
          title="展开 / 收起结果"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? '⌄' : '⌃'}
        </button>
      </div>

      {expanded ? (
        <div className="bottom-content" data-testid="bottom-content">
          {tab === 'marks' ? (
            <div
              className="bottom-pane bottom-dock-host"
              data-testid="bottom-pane-marks"
              data-host="annotation-panel"
              data-panel-shell="annotation-panel"
              data-annotation-edit="inline-replaceMark"
              data-edit-selection={selectedIds.length === 1 ? 'single' : selectedIds.length === 0 ? 'empty' : 'multi'}
              data-edit-path="replaceMark"
            >
              <p className="bottom-summary" data-testid="bottom-marks-summary">
                {marksSummary}
              </p>
              <div className="bottom-dock-toolbar" data-testid="bottom-annotation-toolbar">
                {(
                  [
                    ['all', '全部'],
                    ['Manual', '手工'],
                    ['ImportedLabel', '导入'],
                    ['Algorithm', '算法'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    data-testid={`bottom-mark-layer-${id}`}
                    data-active={markLayer === id}
                    onClick={() => setMarkLayer(id)}
                  >
                    {label}
                  </button>
                ))}
                <label className="bottom-quality-filter" data-testid="bottom-quality-filter">
                  <span>质量</span>
                  <select
                    data-testid="bottom-annotation-quality-filter"
                    value={qualityFilter}
                    onChange={(e) => setQualityFilter(e.target.value as QualityFilter)}
                  >
                    <option value="all">全部质量</option>
                    <option value="Pending">待判断</option>
                    <option value="Accepted">已采纳</option>
                    <option value="Rejected">已忽略</option>
                  </select>
                </label>
                <button type="button" data-testid="bottom-open-marker-rail" onClick={openMarkerRail}>
                  打开标记页…
                </button>
              </div>
              <div className="bottom-quality-actions" data-testid="bottom-annotation-quality-menu">
                <span className="muted">质量标记</span>
                <button
                  type="button"
                  data-testid="bottom-quality-accept"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyQuality('Accepted')}
                >
                  已采纳
                </button>
                <button
                  type="button"
                  data-testid="bottom-quality-reject"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyQuality('Rejected')}
                >
                  已忽略
                </button>
                <button
                  type="button"
                  data-testid="bottom-quality-pending"
                  disabled={selectedIds.length === 0}
                  onClick={() => applyQuality('Pending')}
                >
                  待判断
                </button>
                  <button
                    type="button"
                    data-testid="bottom-edit-mark"
                    disabled={selectedIds.length !== 1}
                    onClick={() => beginEditMark(selectedIds[0])}
                  >
                    编辑
                  </button>
                  {selectedIds.length === 0 ? (
                    <span className="bottom-hint muted" data-testid="bottom-edit-empty-hint">
                      无选中标注；编辑链路空闲（replaceMark）
                    </span>
                  ) : null}
              </div>
              <div className="bottom-layer-chips" data-testid="bottom-annotation-layers">
                <span className="bottom-layer-chip">
                  Manual {marks.filter((m) => m.sourceKind === 'Manual' && !m.deleted).length}
                </span>
                <span className="bottom-layer-chip">
                  Imported {marks.filter((m) => m.sourceKind === 'ImportedLabel' && !m.deleted).length}
                </span>
                <span className="bottom-layer-chip">
                  Algorithm {marks.filter((m) => m.sourceKind === 'Algorithm' && !m.deleted).length}
                </span>
              </div>
              <p className="bottom-selection-summary" data-testid="bottom-annotation-selection-summary">
                {selectionSummary}
              </p>
              <div className="bottom-annotation-paging" data-testid="bottom-annotation-paging">
                <button
                  type="button"
                  data-testid="bottom-annotation-prev-page"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  上一页
                </button>
                <button
                  type="button"
                  data-testid="bottom-annotation-next-page"
                  disabled={(safePage + 1) * PAGE_SIZE >= filteredMarks.length}
                  onClick={() =>
                    setPage((p) =>
                      (p + 1) * PAGE_SIZE < filteredMarks.length ? p + 1 : p,
                    )
                  }
                >
                  下一页
                </button>
                <span className="muted" data-testid="bottom-annotation-page-size">
                  每页 {PAGE_SIZE}
                </span>
              </div>
              <div className="bottom-annotation-select-all" data-testid="bottom-annotation-select-all">
                <label>
                  <input
                    type="checkbox"
                    data-testid="bottom-annotation-select-all-check"
                    checked={
                      liveFiltered.length > 0 &&
                      liveFiltered.every((m) => selectedIds.includes(m.id))
                    }
                    onChange={(e) => {
                      const live = liveFiltered.map((m) => m.id);
                      const ids = e.target.checked ? live : [];
                      hook?.setSelection({
                        activeMarkId: ids[0] ?? null,
                        selectedMarkIds: ids,
                      });
                      setM06Tick((t) => t + 1);
                    }}
                  />
                  全选可见（筛选）
                </label>
              </div>
                            {editingId ? (
                <div className="annotation-edit-form" data-testid="bottom-edit-form" data-editing-id={editingId}>
                  <label>
                    <span>名字</span>
                    <input
                      data-testid="bottom-edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditMark();
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                  </label>
                  <label>
                    <span>备注</span>
                    <input
                      data-testid="bottom-edit-note"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                    />
                  </label>
                  <button type="button" data-testid="bottom-edit-commit" onClick={commitEditMark}>
                    保存
                  </button>
                  <button type="button" data-testid="bottom-edit-cancel" onClick={() => setEditingId(null)}>
                    取消
                  </button>
                </div>
              ) : null}
<div className="annotation-table-chrome" data-testid="bottom-annotation-table">
                                <div
                  className="annotation-table-header annotation-table-header-full"
                  data-testid="bottom-annotation-table-header"
                  data-column-matrix="qt-full"
                >
                  <span className="col-h col-h-0" data-col="0"></span>
                  <span className="col-h col-h-1" data-col="1">名字 / annotationId</span>
                  <span className="col-h col-h-2" data-col="2">来源</span>
                  <span className="col-h col-h-3" data-col="3">当前段</span>
                  <span className="col-h col-h-4" data-col="4">开始 / ms</span>
                  <span className="col-h col-h-5" data-col="5">结束 / ms</span>
                  <span className="col-h col-h-6" data-col="6">中心 / MHz</span>
                  <span className="col-h col-h-7" data-col="7">带宽 / kHz</span>
                  <span className="col-h col-h-8" data-col="8">mean</span>
                  <span className="col-h col-h-9" data-col="9">质量</span>
                  <span className="col-h col-h-10" data-col="10">通道</span>
                </div>
                <ul
                  className="bottom-mark-list annotation-mark-table"
                  data-testid="bottom-mark-list"
                  data-annotation-paint="desktop-multi"
                  data-page={String(safePage + 1)}
                  data-page-size={String(PAGE_SIZE)}
                >
                  {pageRows.length === 0 ? (
                    <li className="bottom-empty-host" data-testid="bottom-marks-empty">
                      无标记记录。图内 ROI 或右侧标记页写入后在此列出（不伪造条目）。
                    </li>
                  ) : (
                    pageRows.map((m) => {
                      const isSelected = selectedIds.includes(m.id);
                      const isCurrent = activeMarkId === m.id;
                      const isHovered = hoveredId === m.id;
                      return (
                        <li
                          key={m.id}
                          className={[
                            'annotation-mark-row',
                            'bottom-mark-row',
                            isCurrent ? 'is-current' : '',
                            isSelected ? 'is-selected' : '',
                            isHovered ? 'is-hovered' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          data-testid={`bottom-mark-row-${m.id}`}
                          data-deleted={m.deleted ? 'true' : 'false'}
                          data-selected={isSelected ? 'true' : 'false'}
                          data-current={isCurrent ? 'true' : 'false'}
                          data-active={isCurrent ? 'true' : 'false'}
                          data-hovered={isHovered ? 'true' : 'false'}
                          data-review={m.reviewStatus}
                          onMouseEnter={() => setHoveredId(m.id)}
                          onMouseLeave={() =>
                            setHoveredId((id) => (id === m.id ? null : id))
                          }
                          onDoubleClick={() => beginEditMark(m.id)}
                          onClick={(e: MouseEvent<HTMLLIElement>) => {
                            const additive = e.metaKey || e.ctrlKey || e.shiftKey;
                            const prev = selectedIds;
                            let next: string[];
                            if (additive) {
                              next = prev.includes(m.id)
                                ? prev.filter((id) => id !== m.id)
                                : [...prev, m.id];
                              if (next.length === 0) next = [m.id];
                            } else {
                              next = [m.id];
                            }
                            hook?.setSelection({
                              activeMarkId: m.id,
                              selectedMarkIds: next,
                            });
                            setM06Tick((t) => t + 1);
                          }}
                        >
                                                    <span
                            className={`annotation-mark-check${isSelected ? ' on' : ''}`}
                            aria-hidden
                          />
                          <span className="annotation-mark-name col-name" title={m.nameCell}>
                            {m.name}
                          </span>
                          <span className="muted col-kind">{m.sourceLabel}</span>
                          <span className="col-segment" data-testid={`bottom-mark-segment-${m.id}`}>
                            {m.segmentLabel}
                          </span>
                          <span className="col-start-ms">{m.startMs}</span>
                          <span className="col-end-ms">{m.endMs}</span>
                          <span className="col-center-mhz">{m.centerMhz}</span>
                          <span className="col-bw-khz">{m.bandwidthKhz}</span>
                          <span className="col-mean">{m.mean}</span>
                          <span className="col-quality" data-testid={`bottom-mark-quality-${m.id}`}>
                            {QUALITY_LABEL[m.reviewStatus]}
                          </span>
                          <span className="col-channel">{m.channelLabel}</span>
                        </li>
                      );
                    })
                  )}
                </ul>
              </div>
              {projectSummary ? (
                <p className="bottom-hint">
                  工程 {projectSummary.name} · {projectSummary.fileCount} file(s)
                </p>
              ) : null}
            </div>
          ) : null}
          {tab === 'tasks' ? (
            <div
              className="bottom-pane bottom-dock-host"
              data-testid="bottom-pane-tasks"
              data-host="detection-panel"
              data-panel-shell="detection-panel"
            >
              <p className="bottom-summary" data-testid="bottom-task-summary">
                {taskSummary}
              </p>
              <div className="bottom-dock-toolbar" data-testid="bottom-detection-toolbar">
                <button type="button" data-testid="bottom-open-detect-rail" onClick={openDetectRail}>
                  打开检测页…
                </button>
                <button
                  type="button"
                  data-testid="bottom-detect-refresh"
                  disabled={detectRunFeed.length === 0}
                  title="Refresh live LocalCompute task records (no invented runs)"
                  onClick={() => void refreshDetectFeeds()}
                >
                  刷新列表
                </button>
                <button
                  type="button"
                  data-testid="bottom-detect-cancel"
                  disabled={
                    !selectedDetectRun ||
                    !['queued', 'running'].includes(selectedDetectRun.status)
                  }
                  title="Cancel selected live run (exact runId)"
                  onClick={() => void cancelSelectedDetect()}
                >
                  取消任务
                </button>
                <label className="bottom-detect-filter" data-testid="bottom-detect-status-filter">
                  <span>状态</span>
                  <select data-testid="bottom-detect-status-select" value={detectStatusFilter} onChange={(e) => setDetectStatusFilter(e.target.value)}>
                    <option value="all">全部</option>
                    <option value="running">运行中</option>
                    <option value="done">已完成</option>
                    <option value="failed">失败</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </label>
                <span className="bottom-hint muted">Detection 坞：不自动跑检测、不发明 run 列表</span>
              </div>
              <div
                className="bottom-detection-shell"
                data-testid="bottom-detection-shell"
                data-panel="detection-panel"
              >
                <div className="bottom-task-meter" data-testid="bottom-task-meter">
                  <span
                    className="bottom-task-bar bottom-task-bar-lg"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={task.percent ?? 0}
                  >
                    <span
                      className="bottom-task-bar-fill"
                      style={{
                        width: `${Math.max(0, Math.min(100, task.percent ?? 0))}%`,
                      }}
                    />
                  </span>
                  <span data-testid="bottom-task-detail">
                    {task.detail || '无运行中任务'}
                  </span>
                </div>
                                <div
                  className="bottom-detect-engine-slots"
                  data-testid="bottom-detect-engine-slots"
                  data-multi-engine="local-compute-caps"
                >
                  <h4 className="bottom-detect-col-title">引擎槽（仅真实 capabilities）</h4>
                  <ul data-testid="bottom-detect-engine-list">
                    <li data-testid="bottom-detect-engine-ffscn" data-available={detectCapabilities?.detection?.ffscn ? 'true' : 'false'}>
                      FFSCN: {detectCapabilities ? (detectCapabilities.detection.ffscn ? 'available' : 'unavailable') : 'caps offline'}
                    </li>
                    <li data-testid="bottom-detect-engine-scn" data-available={detectCapabilities?.detection?.scn ? 'true' : 'false'}>
                      SCN: {detectCapabilities ? (detectCapabilities.detection.scn ? 'available' : 'unavailable') : 'caps offline'}
                    </li>
                    {(detectCapabilities?.models ?? []).length === 0 ? (
                      <li data-testid="bottom-detect-engine-models-empty">models: none reported</li>
                    ) : (
                      detectCapabilities!.models.map((m) => (
                        <li
                          key={m.id}
                          data-testid={`bottom-detect-engine-model-${m.id}`}
                          data-present={m.present ? 'true' : 'false'}
                        >
                          model {m.id}: {m.present ? 'present' : 'missing'}
                          {m.notes ? ` · ${m.notes}` : ''}
                        </li>
                      ))
                    )}
                  </ul>
                  <p className="bottom-hint muted" data-testid="bottom-detect-engine-honesty">
                    No invented FFSCN/SCN/demod/recognition engines; slots mirror LocalCompute capabilities only.
                  </p>
                </div>
<div className="bottom-detect-columns" data-testid="bottom-detect-columns">
                  <div className="bottom-detect-col" data-testid="bottom-detect-col-runs">
                    <h4 className="bottom-detect-col-title">检测运行</h4>
                    <div
                      className="bottom-detect-table-header"
                      data-testid="bottom-detect-table-header"
                    >
                      <span>时间</span>
                      <span>状态</span>
                      <span>kind</span>
                      <span>%</span>
                      <span>runId</span>
                      <span>选中</span>
</div>
                    <ul className="bottom-detect-list" data-testid="bottom-detect-run-list" data-live-feed="local-compute">
                      {filteredDetectRuns.length === 0 ? (
                        <li data-testid="bottom-detect-run-empty">
                          <span>尚无检测 run（等待真实 Detect / Worker 回填）</span>
                        </li>
                      ) : (
                        filteredDetectRuns.map((run) => {
                          const selected = selectedDetectRun?.runId === run.runId;
                          return (
                            <li
                              key={run.runId}
                              className={selected ? 'is-selected' : ''}
                              data-testid={`bottom-detect-run-${run.runId}`}
                              data-run-id={run.runId}
                              data-status={run.status}
                              data-selected={selected ? 'true' : 'false'}
                              onClick={() => selectDetectRun(run.runId)}
                            >
                              <span>{run.updatedAt || run.createdAt || '—'}</span>
                              <span data-testid={`bottom-detect-status-${run.runId}`}>{run.status}</span>
                              <span>{run.kind}</span>
                              <span data-testid={`bottom-detect-progress-${run.runId}`}>
                                {typeof run.progress === 'number' ? `${Math.round(run.progress * 100)}%` : '—'}
                              </span>
                              <span title={run.runId}>{run.runId.slice(0, 8)}</span>
                              <span>{selected ? '●' : ''}</span>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                  <div className="bottom-detect-col" data-testid="bottom-detect-col-detail">
                    <h4 className="bottom-detect-col-title">运行详情</h4>
                                        <dl className="bottom-detect-inspector" data-testid="bottom-detect-inspector" data-worker-chrome="qt-residual">
                      <div>
                        <dt>kind</dt>
                        <dd data-testid="bottom-detect-inspector-engine">{selectedDetectRun?.kind ?? '—'}</dd>
                      </div>
                      <div>
                        <dt>状态</dt>
                        <dd data-testid="bottom-detect-inspector-stage">{selectedDetectRun?.status ?? '—'}</dd>
                      </div>
                      <div>
                        <dt>进度</dt>
                        <dd data-testid="bottom-detect-inspector-progress">
                          {selectedDetectRun && typeof selectedDetectRun.progress === 'number'
                            ? `${Math.round(selectedDetectRun.progress * 100)}%`
                            : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>runId</dt>
                        <dd data-testid="bottom-detect-inspector-runid">
                          {selectedDetectRun?.runId ?? '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>历史</dt>
                        <dd data-testid="bottom-detect-inspector-history">
                          {selectedDetectRun?.statusHistory?.join(' → ') || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>阻塞</dt>
                        <dd data-testid="bottom-detect-inspector-blocks">
                          {selectedDetectRun?.blockReasons?.length
                            ? selectedDetectRun.blockReasons.join('; ')
                            : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt>参数摘要</dt>
                        <dd data-testid="bottom-detect-inspector-params">
                          {selectedDetectRun
                            ? `${selectedDetectRun.runId.slice(0, 8)} · p=${Math.round((selectedDetectRun.progress || 0) * 100)}%`
                            : '选中真实 run 后显示'}
                        </dd>
                      </div>
                      <div>
                        <dt>result</dt>
                        <dd data-testid="bottom-detect-inspector-result">
                          {selectedDetectRun
                            ? selectedDetectRun.result == null
                              ? 'null (honest)'
                              : 'present'
                            : '—'}
                        </dd>
                      </div>
                    </dl>
                    {!selectedDetectRun ? (
                      <p className="bottom-empty-host" data-testid="bottom-detect-detail-empty">
                        选中真实 run 后显示详情与阶段（不伪造候选目标）
                      </p>
                    ) : (
                      <p className="bottom-hint" data-testid="bottom-detect-detail-live">
                        {(selectedDetectRun.messageZh || selectedDetectRun.message || selectedDetectRun.statusHistory?.join(' → ') || selectedDetectRun.status)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          {tab === 'log' ? (
            <div className="bottom-pane bottom-pane-log" data-testid="bottom-pane-log">
              <div className="bottom-log-toolbar">
                <span>日志（最多 300 行）</span>
                <button type="button" data-testid="bottom-log-clear" onClick={() => clearLog()}>
                  清空
                </button>
              </div>
              <pre className="bottom-log-strip" data-testid="bottom-log-strip" aria-live="polite">
                {logs.length === 0 ? '（暂无日志）' : logs.join('\n')}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
