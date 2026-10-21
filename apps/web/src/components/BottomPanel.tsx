/**
 * Bot-B G07 bottom bar — rebuild bottomContent_ / bottomTabs (29px collapsed, ~150px open).
 * Tabs: 统一标记记录 / 后台任务 / 日志. Task progress + log strip. No fake DSP results.
 */
import { useUiStore } from '../store/uiStore';

const TABS = [
  { id: 'marks' as const, label: '统一标记记录', testId: 'bottom-tab-marks' },
  { id: 'tasks' as const, label: '后台任务', testId: 'bottom-tab-tasks' },
  { id: 'log' as const, label: '日志', testId: 'bottom-tab-log' },
];

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

  const markCount =
    typeof window !== 'undefined' && window.__wssM06
      ? window.__wssM06.session.annotations.annotations.length
      : 0;

  const marksSummary =
    fileLabel && fileLabel !== 'No file'
      ? `${fileLabel}    标记 ${markCount} 个，通道摘要 ${channelLabel || '—'}。`
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

  return (
    <section
      className="bottom-panel"
      data-testid="bottom-panel"
      data-expanded={expanded ? 'true' : 'false'}
      data-tab={tab}
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
            <div className="bottom-pane" data-testid="bottom-pane-marks">
              <p className="bottom-summary" data-testid="bottom-marks-summary">
                {marksSummary}
              </p>
              <p className="bottom-hint muted">
                标记编辑在右侧「标记」页与图内 overlay；此处为统一记录摘要（对齐桌面 resultTab）。
              </p>
              {projectSummary ? (
                <p className="bottom-hint">工程 {projectSummary.name} · {projectSummary.fileCount} file(s)</p>
              ) : null}
            </div>
          ) : null}
          {tab === 'tasks' ? (
            <div className="bottom-pane" data-testid="bottom-pane-tasks">
              <p className="bottom-summary" data-testid="bottom-task-summary">
                {taskSummary}
              </p>
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
