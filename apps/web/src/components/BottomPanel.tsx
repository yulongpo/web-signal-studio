/**
 * Bot-B G07 bottom bar — closer to rebuild bottomContent_ / AnnotationPanel / DetectionPanel docks.
 * Tabs: 统一标记记录 / 后台任务 / 日志. Honest hosts — no fake DSP runs or invented marks.
 */
import { useEffect, useMemo, useState } from 'react';
import { useUiStore } from '../store/uiStore';

const TABS = [
  { id: 'marks' as const, label: '统一标记记录', testId: 'bottom-tab-marks' },
  { id: 'tasks' as const, label: '后台任务', testId: 'bottom-tab-tasks' },
  { id: 'log' as const, label: '日志', testId: 'bottom-tab-log' },
];

type MarkLayer = 'all' | 'Manual' | 'ImportedLabel' | 'Algorithm';

export function BottomPanel() {
  const expanded = useUiStore((s) => s.bottomPanelExpanded);
  const setExpanded = useUiStore((s) => s.setBottomPanelExpanded);
  const tab = useUiStore((s) => s.bottomPanelTab);
  const setTab = useUiStore((s) => s.setBottomPanelTab);
  const heightPx = useUiStore((s) => s.bottomPanelHeightPx);
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

  const [m06Tick, setM06Tick] = useState(0);
  const [markLayer, setMarkLayer] = useState<MarkLayer>('all');

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

  const marks = useMemo(() => {
    return annotations.map((a) => ({
      id: a.id,
      name: a.name || a.id,
      sourceKind: a.sourceKind,
      deleted: a.deleted === true,
    }));
  }, [annotations, m06Tick]);

  const filteredMarks = marks.filter((m) =>
    markLayer === 'all' ? true : m.sourceKind === markLayer,
  );

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

  return (
    <section
      className="bottom-panel"
      data-testid="bottom-panel"
      data-expanded={expanded ? 'true' : 'false'}
      data-tab={tab}
      data-dock="annotation-detection"
      style={{ height: expanded ? heightPx : 29 }}
    >
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
                <button type="button" data-testid="bottom-open-marker-rail" onClick={openMarkerRail}>
                  打开标记页…
                </button>
              </div>
              <div className="bottom-layer-chips" data-testid="bottom-annotation-layers">
                <span className="bottom-layer-chip">Manual {marks.filter((m) => m.sourceKind === 'Manual' && !m.deleted).length}</span>
                <span className="bottom-layer-chip">Imported {marks.filter((m) => m.sourceKind === 'ImportedLabel' && !m.deleted).length}</span>
                <span className="bottom-layer-chip">Algorithm {marks.filter((m) => m.sourceKind === 'Algorithm' && !m.deleted).length}</span>
              </div>
              {filteredMarks.length === 0 ? (
                <p className="bottom-empty-host" data-testid="bottom-marks-empty">
                  无标记记录。图内创建或右侧标记页写入后在此列出（不伪造条目）。
                </p>
              ) : (
                <ul className="bottom-mark-list" data-testid="bottom-mark-list">
                  {filteredMarks.map((m) => (
                    <li
                      key={m.id}
                      data-testid={`bottom-mark-row-${m.id}`}
                      data-deleted={m.deleted ? 'true' : 'false'}
                      data-active={snap?.activeMarkId === m.id ? 'true' : 'false'}
                    >
                      <span>{m.name}</span>
                      <span className="muted">{m.sourceKind}</span>
                      {m.deleted ? <span>软删</span> : null}
                      <button
                        type="button"
                        data-testid={`bottom-mark-select-${m.id}`}
                        onClick={() => {
                          hook?.setSelection({ activeMarkId: m.id, selectedMarkIds: [m.id] });
                          setM06Tick((t) => t + 1);
                        }}
                      >
                        选中
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
            >
              <p className="bottom-summary" data-testid="bottom-task-summary">
                {taskSummary}
              </p>
              <div className="bottom-dock-toolbar" data-testid="bottom-detection-toolbar">
                <button type="button" data-testid="bottom-open-detect-rail" onClick={openDetectRail}>
                  打开检测页…
                </button>
                <span className="bottom-hint muted">Detection 坞：不自动跑检测、不发明 run 列表</span>
              </div>
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
                    style={{ width: `${Math.max(0, Math.min(100, task.percent ?? 0))}%` }}
                  />
                </span>
                <span data-testid="bottom-task-detail">{task.detail || '无运行中任务'}</span>
              </div>
              <ul className="bottom-detect-list" data-testid="bottom-detect-run-list">
                <li data-testid="bottom-detect-run-empty">
                  <span>暂无检测 run（等待真实 Detect / Worker 报告）</span>
                </li>
              </ul>
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
