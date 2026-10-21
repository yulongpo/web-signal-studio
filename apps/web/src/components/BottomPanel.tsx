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
  ANNOTATION_TABLE_HEADERS,
} from './annotationTableMatrix';
import { LocalComputeClient } from '../localCompute/client';
import { AdaptiveValueEdit } from './AdaptiveValueEdit';
import { AnnotationEvidencePanel } from './AnnotationEvidencePanel';
import { browserSaveFile } from './browserSaveFile';

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
  /** Hover comes from __wssM06.setHoveredMark (chart <-> table sync). */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editStartMs, setEditStartMs] = useState('');
  const [editEndMs, setEditEndMs] = useState('');
  const [editLowerMhz, setEditLowerMhz] = useState('');
  const [editUpperMhz, setEditUpperMhz] = useState('');
  /** G19 Qt-like editCell: col 1 name, 4 startMs, 5 endMs, 6 centerMHz, 7 bwKHz */
  const [cellEdit, setCellEdit] = useState<null | { id: string; col: 1 | 4 | 5 | 6 | 7; draft: string }>(null);
  /** Wave16 OS-dialog chrome (browser-honest; not native QFileDialog). */
  const [exportSaveStatus, setExportSaveStatus] = useState('就绪');
  const [exportFilter, setExportFilter] = useState<'json' | 'csv'>('json');
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
  const hoveredId = snap?.hoveredMarkId ?? null;

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
    const segs = ann.segments ?? [];
    const seg =
      (ann.activeSegmentId && segs.find((s) => s.id === ann.activeSegmentId)) ||
      segs[0] ||
      null;
    const startSample = seg?.start ?? ann.start;
    const endSample = seg?.end ?? ann.end;
    const lowerHz = seg?.lowerHz ?? ann.lowerHz;
    const upperHz = seg?.upperHz ?? ann.upperHz;
    const sr = getIqFileSession()?.sampleRateHz ?? null;
    const toMs = (sample: string | undefined) => {
      if (sample == null || sample === '' || !sr || !(sr > 0)) return '';
      const n = Number(sample);
      if (!Number.isFinite(n)) return '';
      return String(Number(((n / sr) * 1000).toPrecision(10)));
    };
    setEditStartMs(toMs(startSample));
    setEditEndMs(toMs(endSample));
    setEditLowerMhz(
      typeof lowerHz === 'number' && Number.isFinite(lowerHz)
        ? String(Number((lowerHz / 1e6).toPrecision(10)))
        : '',
    );
    setEditUpperMhz(
      typeof upperHz === 'number' && Number.isFinite(upperHz)
        ? String(Number((upperHz / 1e6).toPrecision(10)))
        : '',
    );
  };
  const commitEditMark = () => {
    const hookNow = window.__wssM06;
    if (!hookNow || !editingId) return;
    const current = hookNow.session.annotations.annotations.find((a) => a.id === editingId);
    if (!current) {
      setEditingId(null);
      return;
    }
    const sr = getIqFileSession()?.sampleRateHz ?? null;
    const msToSample = (ms: string): string | undefined => {
      if (!ms.trim() || !sr || !(sr > 0)) return undefined;
      const n = Number(ms);
      if (!Number.isFinite(n)) return undefined;
      return String(Math.round((n / 1000) * sr));
    };
    const mhzToHz = (mhz: string): number | undefined => {
      if (!mhz.trim()) return undefined;
      const n = Number(mhz);
      if (!Number.isFinite(n)) return undefined;
      return n * 1e6;
    };
    const nextStart = msToSample(editStartMs);
    const nextEnd = msToSample(editEndMs);
    const nextLower = mhzToHz(editLowerMhz);
    const nextUpper = mhzToHz(editUpperMhz);
    const segs = current.segments ? [...current.segments] : [];
    let nextSegments = segs;
    if (segs.length > 0) {
      const idx = Math.max(
        0,
        segs.findIndex((s) => s.id === current.activeSegmentId),
      );
      const target = { ...segs[idx < 0 ? 0 : idx] };
      if (nextStart != null) target.start = nextStart;
      if (nextEnd != null) target.end = nextEnd;
      if (nextLower != null) target.lowerHz = nextLower;
      if (nextUpper != null) target.upperHz = nextUpper;
      nextSegments = segs.map((s, i) => (i === (idx < 0 ? 0 : idx) ? target : s));
    }
    hookNow.session.replaceMark({
      ...current,
      name: editName.trim() || current.name || current.id,
      note: editNote,
      ...(nextStart != null ? { start: nextStart } : {}),
      ...(nextEnd != null ? { end: nextEnd } : {}),
      ...(nextLower != null ? { lowerHz: nextLower } : {}),
      ...(nextUpper != null ? { upperHz: nextUpper } : {}),
      ...(nextSegments.length ? { segments: nextSegments } : {}),
    });
    appendShellLog(`G19 edit mark ${editingId.slice(0, 8)} via replaceMark (range+note)`);
    setEditingId(null);
    setM06Tick((t) => t + 1);
  };


  const cancelEditMark = () => {
    setEditingId(null);
    appendShellLog('G19 edit cancel');
  };

  const applyEditMark = () => {
    commitEditMark();
  };

  const locateActiveMark = () => {
    const hookNow = window.__wssM06;
    const id = activeMarkId ?? (selectedIds.length === 1 ? selectedIds[0] : null);
    if (!hookNow || !id) return;
    hookNow.setSelection({
      activeMarkId: id,
      selectedMarkIds: selectedIds.includes(id) ? selectedIds : [id],
    });
    setM06Tick((n) => n + 1);
    // Reveal row in DOM when present
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-testid="bottom-mark-row-${id}"]`);
      if (el && 'scrollIntoView' in el) {
        (el as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    });
    appendShellLog(`G19 locate mark ${id.slice(0, 8)}`);
  };

  const deleteSelectedMarks = () => {
    const hookNow = window.__wssM06;
    if (!hookNow || selectedIds.length === 0) return;
    const ids = [...selectedIds];
    for (const id of ids) {
      hookNow.removeMark(id);
    }
    if (editingId && ids.includes(editingId)) setEditingId(null);
    setM06Tick((n) => n + 1);
    appendShellLog(`G19 delete ${ids.length} mark(s)`);
  };

  const selectAdjacentSegment = (offset: number) => {
    const hookNow = window.__wssM06;
    const id = editingId ?? activeMarkId ?? (selectedIds.length === 1 ? selectedIds[0] : null);
    if (!hookNow || !id) return;
    const ann = hookNow.session.annotations.annotations.find((a) => a.id === id);
    if (!ann?.segments?.length) return;
    const segs = ann.segments;
    let idx = Math.max(0, segs.findIndex((s) => s.id === ann.activeSegmentId));
    if (ann.activeSegmentId && idx < 0) idx = 0;
    const next = Math.max(0, Math.min(segs.length - 1, idx + offset));
    if (next === idx && segs[next]?.id === ann.activeSegmentId) return;
    hookNow.session.replaceMark({
      ...ann,
      activeSegmentId: segs[next].id,
    });
    setM06Tick((n) => n + 1);
    if (editingId === id) beginEditMark(id);
    appendShellLog(`G19 segment ${offset < 0 ? 'prev' : 'next'} → ${segs[next].id.slice(0, 8)}`);
  };


  const beginCellEdit = (id: string, col: 1 | 4 | 5 | 6 | 7, initial: string) => {
    const hookNow = window.__wssM06;
    if (!hookNow) return;
    const ann = hookNow.session.annotations.annotations.find((a) => a.id === id);
    if (!ann) return;
    hookNow.setSelection({ activeMarkId: id, selectedMarkIds: [id] });
    setCellEdit({ id, col, draft: initial === '—' ? '' : initial });
    setM06Tick((n) => n + 1);
  };

  const cancelCellEdit = () => setCellEdit(null);
  const applyCellNumeric = (id: string, col: 4 | 5 | 6 | 7, storeValue: number) => {
    const hookNow = window.__wssM06;
    if (!hookNow || !Number.isFinite(storeValue)) {
      setCellEdit(null);
      return;
    }
    const current = hookNow.session.annotations.annotations.find((a) => a.id === id);
    if (!current) {
      setCellEdit(null);
      return;
    }
    const sr = getIqFileSession()?.sampleRateHz ?? null;
    if (col === 4 || col === 5) {
      // storeValue is milliseconds from AdaptiveValueEdit Time toStore
      if (!sr || !(sr > 0)) {
        setCellEdit(null);
        return;
      }
      const sample = String(Math.round((storeValue / 1000) * sr));
      const segs = current.segments ? [...current.segments] : [];
      let next = { ...current };
      if (segs.length > 0) {
        const idx = Math.max(0, segs.findIndex((s) => s.id === current.activeSegmentId));
        const ti = idx < 0 ? 0 : idx;
        const target = { ...segs[ti] };
        if (col === 4) target.start = sample;
        else target.end = sample;
        next = {
          ...current,
          segments: segs.map((s, i) => (i === ti ? target : s)),
          ...(col === 4 ? { start: sample } : { end: sample }),
        };
      } else if (col === 4) {
        next = { ...current, start: sample };
      } else {
        next = { ...current, end: sample };
      }
      hookNow.session.replaceMark(next);
    } else {
      const lower = typeof current.lowerHz === 'number' ? current.lowerHz : 0;
      const upper = typeof current.upperHz === 'number' ? current.upperHz : 0;
      let nextLower = lower;
      let nextUpper = upper;
      if (col === 6) {
        // storeValue = center Hz
        const bw = upper - lower;
        nextLower = storeValue - bw / 2;
        nextUpper = storeValue + bw / 2;
      } else {
        // storeValue = bandwidth Hz
        const center = (lower + upper) / 2;
        const half = storeValue / 2;
        nextLower = center - half;
        nextUpper = center + half;
      }
      const segs = current.segments ? [...current.segments] : [];
      let next = { ...current, lowerHz: nextLower, upperHz: nextUpper };
      if (segs.length > 0) {
        const idx = Math.max(0, segs.findIndex((s) => s.id === current.activeSegmentId));
        const ti = idx < 0 ? 0 : idx;
        const target = { ...segs[ti], lowerHz: nextLower, upperHz: nextUpper };
        next = { ...next, segments: segs.map((s, i) => (i === ti ? target : s)) };
      }
      hookNow.session.replaceMark(next);
    }
    appendShellLog(`G19 AdaptiveValueEdit cell col=${col} ${id.slice(0, 8)}`);
    setCellEdit(null);
    setM06Tick((n) => n + 1);
  };



  const finishCellEdit = (commit: boolean) => {
    if (!cellEdit) return;
    if (!commit) {
      setCellEdit(null);
      return;
    }
    const hookNow = window.__wssM06;
    if (!hookNow) {
      setCellEdit(null);
      return;
    }
    const current = hookNow.session.annotations.annotations.find((a) => a.id === cellEdit.id);
    if (!current) {
      setCellEdit(null);
      return;
    }
    const draft = cellEdit.draft.trim();
    const sr = getIqFileSession()?.sampleRateHz ?? null;
    const msToSample = (ms: string): string | undefined => {
      if (!ms || !sr || !(sr > 0)) return undefined;
      const n = Number(ms);
      if (!Number.isFinite(n)) return undefined;
      return String(Math.round((n / 1000) * sr));
    };
    if (cellEdit.col === 1) {
      hookNow.session.replaceMark({
        ...current,
        name: draft || current.name || current.id,
      });
    } else if (cellEdit.col === 4 || cellEdit.col === 5) {
      const sample = msToSample(draft);
      if (sample == null) {
        setCellEdit(null);
        return;
      }
      const segs = current.segments ? [...current.segments] : [];
      let next = { ...current };
      if (segs.length > 0) {
        const idx = Math.max(0, segs.findIndex((s) => s.id === current.activeSegmentId));
        const ti = idx < 0 ? 0 : idx;
        const target = { ...segs[ti] };
        if (cellEdit.col === 4) target.start = sample;
        else target.end = sample;
        next = {
          ...current,
          segments: segs.map((s, i) => (i === ti ? target : s)),
          ...(cellEdit.col === 4 ? { start: sample } : { end: sample }),
        };
      } else if (cellEdit.col === 4) {
        next = { ...current, start: sample };
      } else {
        next = { ...current, end: sample };
      }
      hookNow.session.replaceMark(next);
    } else if (cellEdit.col === 6 || cellEdit.col === 7) {
      const n = Number(draft);
      if (!Number.isFinite(n)) {
        setCellEdit(null);
        return;
      }
      const segs = current.segments ? [...current.segments] : [];
      const lower = typeof current.lowerHz === 'number' ? current.lowerHz : 0;
      const upper = typeof current.upperHz === 'number' ? current.upperHz : 0;
      let nextLower = lower;
      let nextUpper = upper;
      if (cellEdit.col === 6) {
        const bw = upper - lower;
        const centerHz = n * 1e6;
        nextLower = centerHz - bw / 2;
        nextUpper = centerHz + bw / 2;
      } else {
        const center = (lower + upper) / 2;
        const half = (n * 1e3) / 2;
        nextLower = center - half;
        nextUpper = center + half;
      }
      let next = { ...current, lowerHz: nextLower, upperHz: nextUpper };
      if (segs.length > 0) {
        const idx = Math.max(0, segs.findIndex((s) => s.id === current.activeSegmentId));
        const ti = idx < 0 ? 0 : idx;
        const target = { ...segs[ti], lowerHz: nextLower, upperHz: nextUpper };
        next = { ...next, segments: segs.map((s, i) => (i === ti ? target : s)) };
      }
      hookNow.session.replaceMark(next);
    }
    appendShellLog(`G19 editCell col=${cellEdit.col} ${cellEdit.id.slice(0, 8)}`);
    setCellEdit(null);
    setM06Tick((n) => n + 1);
  };

  const exportAnnotationsJson = () => {
    const hookNow = window.__wssM06;
    if (!hookNow) return;
    const { annotationsText } = hookNow.exportJson();
    void browserSaveFile({
      suggestedName: 'annotations.json',
      mimeType: 'application/json',
      contents: annotationsText,
      dialogTitle: '无损标记JSON导出',
      filterDescription: 'JSON (*.json) · 工程交换',
    }).then((r) => {
      if (r.ok) {
        setExportSaveStatus(`已导出标记JSON；工程交换格式 · ${r.method}`);
        appendShellLog(`G19 export JSON via ${r.method}`);
      } else if (r.reason === 'cancelled') {
        setExportSaveStatus('已取消');
      } else {
        setExportSaveStatus(`失败：${r.reason}`);
        appendShellLog(`G19 export JSON failed: ${r.reason}`);
      }
    });
  };

  const exportAnnotationsCsv = () => {
    const header = [
      'name',
      'annotationId',
      'source',
      'segment',
      'start_ms',
      'end_ms',
      'center_mhz',
      'bandwidth_khz',
      'mean',
      'quality',
      'channel',
    ];
    const escape = (v: string) => {
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const lines = [header.join(',')];
    for (const m of liveFiltered) {
      if (m.deleted) continue;
      lines.push(
        [
          m.name,
          m.id,
          m.sourceLabel,
          m.segmentLabel,
          m.startMs,
          m.endMs,
          m.centerMhz,
          m.bandwidthKhz,
          m.mean,
          m.qualityLabel,
          m.channelLabel,
        ]
          .map((x) => escape(String(x ?? '')))
          .join(','),
      );
    }
    void browserSaveFile({
      suggestedName: 'annotations.csv',
      mimeType: 'text/csv',
      contents: lines.join('\n'),
      dialogTitle: 'CSV每活动段一行；不保存完整原始字段/修订证据',
      filterDescription: 'CSV (*.csv) · 每活动段一行',
    }).then((r) => {
      if (r.ok) {
        setExportSaveStatus(`已导出CSV；原始字段/完整修订仅JSON保留 · ${r.method} · ${lines.length - 1} 行`);
        appendShellLog(`G19 export CSV via ${r.method} rows=${lines.length - 1}`);
      } else if (r.reason === 'cancelled') {
        setExportSaveStatus('已取消');
      } else {
        setExportSaveStatus(`失败：${r.reason}`);
        appendShellLog(`G19 export CSV failed: ${r.reason}`);
      }
    });
  };

  const selectionSummary = `匹配 ${liveFiltered.length} / 总数 ${marks.length} / 已选 ${selectedIds.length} · 页 ${safePage + 1}/${totalPages}`;

  const evidenceAnnotation = (() => {
    const id = editingId ?? activeMarkId ?? (selectedIds.length === 1 ? selectedIds[0] : null);
    if (!id || !hook) return null;
    return hook.session.annotations.annotations.find((a) => a.id === id) ?? null;
  })();


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
        data-shell-edge="bottom" data-bottom-desktop-min="29" data-bottom-desktop-range="100-500" data-shell-reshot="wave8" data-edge-side="bottom" data-shell-focus="wave9" data-shell-wave="wave11 wave14" tabIndex={0}
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
              data-qt-reshot="wave8-annotation-panel"
              data-qt-interactive="wave9" data-qt-editcell="wave11" data-qt-adaptive-cell="wave13"
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
                  <div
                    className="bottom-review-bar"
                    data-testid="bottom-annotation-review-bar"
                    data-qt-interactive="wave9"
                  >
                    <button
                      type="button"
                      data-testid="bottom-btn-locate-mark"
                      disabled={!activeMarkId && selectedIds.length !== 1}
                      title="定位当前标记"
                      onClick={locateActiveMark}
                    >
                      定位当前标记
                    </button>
                    <button
                      type="button"
                      data-testid="bottom-btn-delete-marks"
                      disabled={selectedIds.length === 0}
                      title="删除所选标记"
                      onClick={deleteSelectedMarks}
                    >
                      删除所选标记
                    </button>
                    <button
                      type="button"
                      data-testid="bottom-edit-mark"
                      disabled={selectedIds.length !== 1}
                      title="编辑选中标注（replaceMark）"
                      onClick={() => beginEditMark(selectedIds[0])}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      data-testid="bottom-btn-segment-prev"
                      disabled={selectedIds.length !== 1 && !activeMarkId}
                      title="上一段"
                      onClick={() => selectAdjacentSegment(-1)}
                    >
                      上一段
                    </button>
                    <button
                      type="button"
                      data-testid="bottom-btn-segment-next"
                      disabled={selectedIds.length !== 1 && !activeMarkId}
                      title="下一段"
                      onClick={() => selectAdjacentSegment(1)}
                    >
                      下一段
                    </button>
                    <div
                      className="bottom-export-dialog-chrome"
                      data-testid="bottom-export-dialog-chrome"
                      data-os-dialog-chrome="wave16"
                      data-native-qfiledialog="false"
                    >
                      <span
                        className="bottom-export-dialog-title"
                        data-testid="bottom-export-dialog-title"
                        data-native-qfiledialog="false"
                        title="浏览器保存；非原生 QFileDialog"
                      >
                        {exportFilter === 'json'
                          ? '无损标记JSON导出'
                          : 'CSV每活动段一行；不保存完整原始字段'}
                      </span>
                      <label className="bottom-export-filter" data-testid="bottom-export-filter-label">
                        <span>过滤器</span>
                        <select
                          data-testid="bottom-export-filter-select"
                          value={exportFilter}
                          onChange={(e) => setExportFilter(e.target.value as 'json' | 'csv')}
                          disabled={!hook}
                        >
                          <option value="json">JSON (*.json) — 工程交换</option>
                          <option value="csv">CSV (*.csv) — 每活动段一行</option>
                        </select>
                      </label>
                      <span
                        className="bottom-export-suggested-path"
                        data-testid="bottom-export-suggested-path"
                        title="建议文件名（浏览器保存；非原生 QFileDialog 路径）"
                      >
                        {exportFilter === 'json' ? 'annotations.json' : 'annotations.csv'}
                      </span>
                      <button
                        type="button"
                        data-testid="bottom-btn-export-json"
                        data-browser-save="wave13"
                        data-os-dialog-chrome="wave16"
                        disabled={!hook}
                        title="导出标记 JSON（browserSaveFile · exportJson）"
                        onClick={() => {
                          setExportFilter('json');
                          exportAnnotationsJson();
                        }}
                      >
                        保存 JSON
                      </button>
                      <button
                        type="button"
                        data-testid="bottom-btn-export-csv"
                        data-browser-save="wave13"
                        data-os-dialog-chrome="wave16"
                        disabled={liveFiltered.length === 0}
                        title="导出 CSV（browserSaveFile · 活动表行）"
                        onClick={() => {
                          setExportFilter('csv');
                          exportAnnotationsCsv();
                        }}
                      >
                        保存 CSV
                      </button>
                      <span
                        className="bottom-export-status muted"
                        data-testid="bottom-export-status"
                        aria-live="polite"
                      >
                        {exportSaveStatus}
                      </span>
                    </div>
                  </div>
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
                    <span>名称</span>
                    <input
                      data-testid="bottom-edit-name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') commitEditMark();
                        if (e.key === 'Escape') cancelEditMark();
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
                  <div
                    className="annotation-edit-range"
                    data-testid="bottom-edit-range"
                    data-qt-inspector="start-end-lower-upper"
                  >
                    <label>
                      <span>起始 / ms</span>
                      <input
                        data-testid="bottom-edit-start-ms"
                        value={editStartMs}
                        onChange={(e) => setEditStartMs(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>结束 / ms</span>
                      <input
                        data-testid="bottom-edit-end-ms"
                        value={editEndMs}
                        onChange={(e) => setEditEndMs(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>下边频 / MHz</span>
                      <input
                        data-testid="bottom-edit-lower-mhz"
                        value={editLowerMhz}
                        onChange={(e) => setEditLowerMhz(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>上边频 / MHz</span>
                      <input
                        data-testid="bottom-edit-upper-mhz"
                        value={editUpperMhz}
                        onChange={(e) => setEditUpperMhz(e.target.value)}
                      />
                    </label>
                  </div>
                  <button type="button" data-testid="bottom-edit-commit" onClick={applyEditMark}>
                    应用
                  </button>
                  <button type="button" data-testid="bottom-edit-apply" onClick={applyEditMark}>
                    保存
                  </button>
                  <button type="button" data-testid="bottom-edit-cancel" onClick={cancelEditMark}>
                    取消
                  </button>
                </div>
              ) : null}
              <AnnotationEvidencePanel annotation={evidenceAnnotation} mode="auxiliary" />
<div className="annotation-table-chrome" data-testid="bottom-annotation-table">
                                <div
                  className="annotation-table-header annotation-table-header-full"
                  data-testid="bottom-annotation-table-header"
                  data-column-matrix="qt-full"
                >
                  {ANNOTATION_TABLE_HEADERS.map((label, col) => (
                    <span key={col} className={`col-h col-h-${col}`} data-col={String(col)} data-qt-header={label || 'check'}>
                      {label}
                    </span>
                  ))}
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
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            beginEditMark(m.id);
                          }}
                          data-current={isCurrent ? 'true' : 'false'}
                          data-active={isCurrent ? 'true' : 'false'}
                          data-hovered={isHovered ? 'true' : 'false'}
                          data-source-kind={m.sourceKind ?? ''}
                          data-g11-hover-sync="true"
                          data-review={m.reviewStatus}
                          onMouseEnter={() => {
                            hook?.setHoveredMark?.(m.id);
                            setM06Tick((t) => t + 1);
                          }}
                          onMouseLeave={() => {
                            if (hook?.getState?.()?.hoveredMarkId === m.id) {
                              hook?.setHoveredMark?.(null);
                              setM06Tick((t) => t + 1);
                            }
                          }}
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
                          {cellEdit?.id === m.id && cellEdit.col === 1 ? (
                            <input
                              className="annotation-mark-name col-name annotation-cell-edit"
                              data-testid={`bottom-cell-edit-${m.id}-1`}
                              data-edit-col="1"
                              autoFocus
                              value={cellEdit.draft}
                              onChange={(e) => setCellEdit({ ...cellEdit, draft: e.target.value })}
                              onBlur={() => finishCellEdit(true)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') finishCellEdit(true);
                                if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelCellEdit();
                                }
                              }}
                            />
                          ) : (
                            <span
                              className="annotation-mark-name col-name"
                              title={m.nameCell}
                              data-editable-col="1"
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                beginCellEdit(m.id, 1, m.name);
                              }}
                            >
                              {m.name}
                            </span>
                          )}
                          <span className="muted col-kind">{m.sourceLabel}</span>
                          <span className="col-segment" data-testid={`bottom-mark-segment-${m.id}`}>
                            {m.segmentLabel}
                          </span>
                          {cellEdit?.id === m.id && cellEdit.col === 4 ? (
                            <AdaptiveValueEdit
                              className="col-start-ms annotation-cell-edit"
                              data-testid={`bottom-cell-edit-${m.id}-4`}
                              data-object-name="annotationAdaptiveCell"
                              kind="Time"
                              value={Number(m.startMs) || 0}
                              fromStore={(ms) => ms / 1000}
                              toStore={(s) => s * 1000}
                              title="AdaptiveValueEdit Time · Enter/Tab commit · Esc discard"
                              onCommit={(v) => applyCellNumeric(m.id, 4, v)}
                            />
                          ) : (
                            <span
                              className="col-start-ms"
                              data-editable-col="4"
                              data-adaptive-cell="wave13"
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                beginCellEdit(m.id, 4, m.startMs);
                              }}
                            >
                              {m.startMs}
                            </span>
                          )}
                          {cellEdit?.id === m.id && cellEdit.col === 5 ? (
                            <AdaptiveValueEdit
                              className="col-end-ms annotation-cell-edit"
                              data-testid={`bottom-cell-edit-${m.id}-5`}
                              data-object-name="annotationAdaptiveCell"
                              kind="Time"
                              value={Number(m.endMs) || 0}
                              fromStore={(ms) => ms / 1000}
                              toStore={(s) => s * 1000}
                              title="AdaptiveValueEdit Time · Enter/Tab commit · Esc discard"
                              onCommit={(v) => applyCellNumeric(m.id, 5, v)}
                            />
                          ) : (
                            <span
                              className="col-end-ms"
                              data-editable-col="5"
                              data-adaptive-cell="wave13"
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                beginCellEdit(m.id, 5, m.endMs);
                              }}
                            >
                              {m.endMs}
                            </span>
                          )}
                          {cellEdit?.id === m.id && cellEdit.col === 6 ? (
                            <AdaptiveValueEdit
                              className="col-center-mhz annotation-cell-edit"
                              data-testid={`bottom-cell-edit-${m.id}-6`}
                              data-object-name="annotationAdaptiveCell"
                              kind="Frequency"
                              value={(Number(m.centerMhz) || 0) * 1e6}
                              title="AdaptiveValueEdit Frequency · Enter/Tab commit · Esc discard"
                              onCommit={(v) => applyCellNumeric(m.id, 6, v)}
                            />
                          ) : (
                            <span
                              className="col-center-mhz"
                              data-editable-col="6"
                              data-adaptive-cell="wave13"
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                beginCellEdit(m.id, 6, m.centerMhz);
                              }}
                            >
                              {m.centerMhz}
                            </span>
                          )}
                          {cellEdit?.id === m.id && cellEdit.col === 7 ? (
                            <AdaptiveValueEdit
                              className="col-bw-khz annotation-cell-edit"
                              data-testid={`bottom-cell-edit-${m.id}-7`}
                              data-object-name="annotationAdaptiveCell"
                              kind="Frequency"
                              value={(Number(m.bandwidthKhz) || 0) * 1e3}
                              title="AdaptiveValueEdit Frequency · Enter/Tab commit · Esc discard"
                              onCommit={(v) => applyCellNumeric(m.id, 7, v)}
                            />
                          ) : (
                            <span
                              className="col-bw-khz"
                              data-editable-col="7"
                              data-adaptive-cell="wave13"
                              onDoubleClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                beginCellEdit(m.id, 7, m.bandwidthKhz);
                              }}
                            >
                              {m.bandwidthKhz}
                            </span>
                          )}
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
                  data-worker-chrome="wave14"
                >
                  <h4 className="bottom-detect-col-title">Worker / 引擎槽（仅真实 LocalCompute）</h4>
                  <div
                    className="bottom-detect-worker-status"
                    data-testid="bottom-detect-worker-status"
                    data-online={detectCapabilities ? 'true' : 'false'}
                  >
                    <span data-testid="bottom-detect-worker-protocol">
                      protocol: {detectCapabilities?.protocolVersion ?? '—'}
                    </span>
                    <span data-testid="bottom-detect-worker-service">
                      service: {detectCapabilities?.serviceVersion ?? '—'}
                    </span>
                    <span data-testid="bottom-detect-worker-feed-counts">
                      feed:{' '}
                      {(() => {
                        const feed = detectRunFeed ?? [];
                        const n = (s: string) => feed.filter((r) => r.status === s).length;
                        if (!feed.length) return '—';
                        return `q${n('queued')}/r${n('running')}/s${n('succeeded')}/f${n('failed')}/c${n('cancelled')}/b${n('BLOCKED')}`;
                      })()}
                    </span>
                  </div>
                  <ul data-testid="bottom-detect-engine-list">
                    <li data-testid="bottom-detect-engine-ffscn" data-available={detectCapabilities?.detection?.ffscn ? 'true' : 'false'}>
                      FFSCN: {detectCapabilities ? (detectCapabilities.detection.ffscn ? 'available' : 'unavailable') : 'caps offline'}
                    </li>
                    <li data-testid="bottom-detect-engine-scn" data-available={detectCapabilities?.detection?.scn ? 'true' : 'false'}>
                      SCN: {detectCapabilities ? (detectCapabilities.detection.scn ? 'available' : 'unavailable') : 'caps offline'}
                    </li>
                    {(detectCapabilities?.models ?? []).length === 0 ? (
                      <li data-testid="bottom-detect-engine-models-empty">models: {detectCapabilities ? 'none reported' : '—'}</li>
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
                  <ul
                    className="bottom-detect-blocked-gaps"
                    data-testid="bottom-detect-blocked-gaps"
                    data-honest-blocked="g06-g17"
                  >
                    <li data-testid="bottom-detect-gap-eye" data-blocked="true" data-available="false">
                      eye-diagram: BLOCKED (not LocalCompute · not invented)
                    </li>
                    <li data-testid="bottom-detect-gap-bitstream" data-blocked="true" data-available="false">
                      bitstream: BLOCKED (not LocalCompute · not invented)
                    </li>
                    <li data-testid="bottom-detect-gap-demod" data-blocked="true" data-available="false">
                      demod/recognition: BLOCKED (not invented)
                    </li>
                  </ul>
                  <p className="bottom-hint muted" data-testid="bottom-detect-engine-honesty">
                    No invented FFSCN/SCN/demod/recognition/eye/bitstream engines or runs — missing slots stay — / BLOCKED.
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
