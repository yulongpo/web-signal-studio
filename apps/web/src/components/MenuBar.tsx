/**
 * Bot-B G01 MenuBar / command-bar — ~34px top chrome vs rebuild MainWindow::buildMenus().
 * File / Edit / View / Analysis / Tools / Help. Open IQ from File (not only SpectrumToolbar).
 * Wire real hooks where present; disabled/honest for unavailable. No fake demod.
 */
import { useEffect, useRef, useState } from 'react';
import { asProjectSessionHook, useUiStore } from '../store/uiStore';
import {
  clearOpenedIq,
  detectFsaCapabilities,
  openIqFromFiles,
  openIqViaFsa,
} from '../dsp/openIqForMainChart';
import {
  clearRecentProjects,
  listRecentProjects,
  pushRecentProject,
  type RecentProjectEntry,
} from '../recentProjects';

type MenuId = 'file' | 'edit' | 'view' | 'analysis' | 'tools' | 'help' | null;

const HELP_MOUSE = [
  '时频图：X 轴为时间，Y 轴为频率；瀑布图：X 轴为频率，Y 轴为时间（向下递增）。',
  '图内及底部滚轮缩放 X 轴，左侧滚轮缩放 Y 轴；拖动坐标轴平移。',
  '右键菜单开启持续选择信号后，拖动创建标记；Esc 可取消交互。',
  '辅助图可拖动区间放大；波形时间、PSD 频率与主图联动。',
  '全局导航支持单击跳转、拖动时间窗和滚轮缩放。',
].join('\n\n');

const ABOUT_TEXT =
  'Web Signal Studio — Bot-B shell chrome.\n对齐桌面 Signal Studio A1.4.3 菜单意图（buildMenus）。\n本页不为验收 PASS 声明。';

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function sessionHook() {
  return asProjectSessionHook(useUiStore.getState());
}

function m06Ready(): boolean {
  return Boolean(typeof window !== 'undefined' && window.__wssM06);
}

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [iqError, setIqError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ title: string; body: string } | null>(null);
  const [m06Tick, setM06Tick] = useState(0);
  const rootRef = useRef<HTMLElement>(null);
  const iqInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const setWorkspaceMode = useUiStore((s) => s.setWorkspaceMode);
  const chartMode = useUiStore((s) => s.chartMode);
  const setChartMode = useUiStore((s) => s.setChartMode);
  const rightPanelCollapsed = useUiStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const setRightPanelCollapsed = useUiStore((s) => s.setRightPanelCollapsed);
  const loadSampleProject = useUiStore((s) => s.loadSampleProject);
  const projectSummary = useUiStore((s) => s.projectSummary);
  const projectSource = useUiStore((s) => s.projectSource);
  const setRightPage = useUiStore((s) => s.setRightPage);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const viewHistory = useUiStore((s) => s.viewHistory);
  const viewHistoryIndex = useUiStore((s) => s.viewHistoryIndex);
  const viewHistoryBack = useUiStore((s) => s.viewHistoryBack);
  const viewHistoryForward = useUiStore((s) => s.viewHistoryForward);
  const fitNavToFull = useUiStore((s) => s.fitNavToFull);
  const restoreDefaultNavView = useUiStore((s) => s.restoreDefaultNavView);
  const statusFileLabel = useUiStore((s) => s.statusFileLabel);
  const [renameDraft, setRenameDraft] = useState('');
  const [recentEntries, setRecentEntries] = useState<RecentProjectEntry[]>(() =>
    typeof window !== 'undefined' ? listRecentProjects() : [],
  );
  const [chromeMaximized, setChromeMaximized] = useState(false);
  const [chromeNote, setChromeNote] = useState<string | null>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
        setDialog(null);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  useEffect(() => {
    if (openMenu === 'file') setRecentEntries(listRecentProjects());
  }, [openMenu]);

  // Refresh undo/redo enablement while Edit menu is open.
  useEffect(() => {
    if (openMenu !== 'edit') return;
    const id = window.setInterval(() => setM06Tick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [openMenu]);

  void m06Tick;
  const hook = typeof window !== 'undefined' ? window.__wssM06 : undefined;
  const snap = hook?.getState?.() ?? null;
  const canUndo = Boolean(snap?.canUndo);
  const canRedo = Boolean(snap?.canRedo);
  const activeMarkId = snap?.activeMarkId;
  const canDeleteMark = Boolean(hook && activeMarkId);

  const close = () => setOpenMenu(null);

  const onOpenIq = async () => {
    close();
    setIqError(null);
    const caps = detectFsaCapabilities();
    if (caps.openLocalFile) {
      const outcome = await openIqViaFsa();
      if (outcome.ok) return;
      if (outcome.reason === 'cancelled') return;
      if (outcome.reason === 'unsupported') {
        iqInputRef.current?.click();
        return;
      }
      setIqError(outcome.message);
      return;
    }
    iqInputRef.current?.click();
  };

  const onIqFilesPicked = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setIqError(null);
    const outcome = await openIqFromFiles(Array.from(list));
    if (!outcome.ok && outcome.reason !== 'cancelled') setIqError(outcome.message);
  };

  const onOpenProjectFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      sessionHook().openProjectFromText(text);
    };
    reader.readAsText(file);
  };

  const onSaveProject = () => {
    close();
    const text = sessionHook().saveProjectJsonText();
    if (text == null) return;
    const name = projectSummary?.name?.replace(/[^\w.-]+/g, '_') || 'project';
    pushRecentProject(`${name}.json`, text);
    setRecentEntries(listRecentProjects());
    downloadText(`${name}.json`, text);
  };

  const onNewProject = () => {
    close();
    sessionHook().clearProject();
    clearOpenedIq();
    setDialog({
      title: '新建工程',
      body: '已清空当前 Web 会话（工程树 + 已打开 IQ）。请再打开工程 JSON 或添加信号。文件夹工程向导仅桌面端完整支持。',
    });
  };

  const onOpenProjectFolder = async () => {
    close();
    const w = window as Window & {
      showDirectoryPicker?: () => Promise<{ name: string }>;
    };
    if (typeof w.showDirectoryPicker !== 'function') {
      setDialog({
        title: '打开工程文件夹',
        body: '当前浏览器不支持 Directory Picker。请改用「打开工程 JSON…」或桌面 Signal Studio。',
      });
      return;
    }
    try {
      const dir = await w.showDirectoryPicker();
      setDialog({
        title: '打开工程文件夹',
        body: `已选择文件夹「${dir.name}」。Web 壳暂不解析文件夹工程清单；请打开其中的工程 JSON，或添加 IQ。`,
      });
    } catch {
      /* cancelled */
    }
  };

  const onOpenRecent = (entry: RecentProjectEntry) => {
    close();
    const result = sessionHook().openProjectFromText(entry.text);
    if (result && 'ok' in result && result.ok === false) {
      setIqError(result.error);
    }
  };

  const onRemoveCurrentFile = () => {
    close();
    clearOpenedIq();
    useUiStore.getState().setStatusFileLabel('No file');
  };

  const onFitAll = () => {
    fitNavToFull();
    close();
  };
  const onRestoreDefaults = () => {
    restoreDefaultNavView();
    close();
  };

  const onChromeMinimize = () => {
    setChromeNote('浏览器页无法真正最小化窗口（桌面端为 showMinimized）。');
    window.setTimeout(() => setChromeNote(null), 2400);
  };
  const onChromeMaximize = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setChromeMaximized(true);
      } else {
        await document.exitFullscreen();
        setChromeMaximized(false);
      }
    } catch {
      setChromeNote('无法切换全屏（权限或环境限制）。');
      window.setTimeout(() => setChromeNote(null), 2400);
    }
  };
  const onChromeClose = () => {
    window.close();
    setChromeNote('浏览器未允许关闭此标签（非脚本打开的窗口）。');
    window.setTimeout(() => setChromeNote(null), 2400);
  };

  const onUndo = () => {
    if (!hook) return;
    hook.undo();
    setM06Tick((t) => t + 1);
    close();
  };
  const onRedo = () => {
    if (!hook) return;
    hook.redo();
    setM06Tick((t) => t + 1);
    close();
  };
  const onDeleteMark = () => {
    if (!hook || !activeMarkId) return;
    hook.removeMark(activeMarkId);
    setM06Tick((t) => t + 1);
    close();
  };

  const openRenameDialog = () => {
    if (!hook || !activeMarkId) return;
    const ann = hook.session.annotations.annotations.find((a) => a.id === activeMarkId);
    setRenameDraft(ann?.name ?? activeMarkId);
    close();
    setDialog({ title: '重命名当前标记', body: '__rename__' });
  };

  const commitRename = () => {
    if (!hook || !activeMarkId) {
      setDialog(null);
      return;
    }
    const name = renameDraft.trim();
    if (!name) return;
    const ann = hook.session.annotations.annotations.find((a) => a.id === activeMarkId);
    if (!ann) {
      setDialog(null);
      return;
    }
    hook.session.replaceMark({ ...ann, name });
    setM06Tick((t) => t + 1);
    setDialog(null);
  };

  const canViewBack = viewHistoryIndex > 0;
  const canViewForward = viewHistoryIndex < viewHistory.length - 1;

  const openDetect = () => {
    setRightPanelCollapsed(false);
    setRightPage('detect');
    close();
  };
  const beginRoi = () => {
    setRightPanelCollapsed(false);
    setRightPage('detect');
    setActiveTool('select');
    close();
  };
  const openMarkers = () => {
    setRightPanelCollapsed(false);
    setRightPage('marker');
    setActiveTool('marker');
    close();
  };

  return (
    <header
      ref={rootRef}
      className="menubar command-bar"
      data-testid="menubar"
      data-variant="command-bar"
      role="menubar"
      aria-label="application menu"
      style={{ height: 34 }}
    >
      <div className="menubar-brand brand-v2" data-testid="menubar-brand" data-brand="BrandV2">
        <span className="menubar-brand-mark" data-testid="title-brand-icon" aria-hidden>
          SS
        </span>
        <span className="menubar-brand-text" data-testid="title-brand-wordmark">
          Signal Studio
        </span>
        <span className="menubar-brand-version" data-testid="title-brand-version">
          A1.4.3 · 交互可靠性优化
        </span>
      </div>

      <div className="menubar-menus">
        {/* File */}
        <div className="menubar-item">
          <button
            type="button"
            className="menubar-trigger"
            data-testid="menubar-file"
            data-open={openMenu === 'file'}
            aria-haspopup="true"
            aria-expanded={openMenu === 'file'}
            onClick={() => setOpenMenu((m) => (m === 'file' ? null : 'file'))}
          >
            文件(F)
          </button>
          {openMenu === 'file' ? (
            <div className="menubar-dropdown" data-testid="menubar-file-menu" role="menu">
              <button type="button" role="menuitem" data-testid="menu-new-project" onClick={onNewProject}>
                新建工程…
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-open-project-folder"
                onClick={() => void onOpenProjectFolder()}
              >
                打开工程文件夹…
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-open-project"
                onClick={() => {
                  close();
                  projectInputRef.current?.click();
                }}
              >
                打开工程 JSON…
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-load-sample"
                onClick={() => {
                  loadSampleProject();
                  close();
                }}
              >
                打开演示工程（样例树）
              </button>
              <div className="menubar-sep" role="separator" />
              <button type="button" role="menuitem" data-testid="menu-open-iq" onClick={() => void onOpenIq()}>
                添加 / 打开信号…
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-clear-iq"
                onClick={() => {
                  clearOpenedIq();
                  close();
                }}
              >
                清除已打开 IQ
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-save-project"
                disabled={projectSource !== 'json'}
                onClick={onSaveProject}
              >
                保存工程
              </button>
              <div className="menubar-item menubar-submenu" data-testid="menu-recent-projects">
                <button type="button" role="menuitem" className="menubar-submenu-trigger" tabIndex={-1}>
                  最近打开的工程
                </button>
                <div className="menubar-dropdown menubar-submenu-panel" role="menu">
                  {recentEntries.length === 0 ? (
                    <button type="button" role="menuitem" disabled data-testid="menu-recent-empty">
                      暂无历史工程
                    </button>
                  ) : (
                    recentEntries.map((entry) => (
                      <button
                        key={`${entry.name}-${entry.savedAt}`}
                        type="button"
                        role="menuitem"
                        data-testid="menu-recent-item"
                        title={entry.savedAt}
                        onClick={() => onOpenRecent(entry)}
                      >
                        {entry.name}
                      </button>
                    ))
                  )}
                  <div className="menubar-sep" role="separator" />
                  <button
                    type="button"
                    role="menuitem"
                    data-testid="menu-recent-clear"
                    onClick={() => {
                      clearRecentProjects();
                      setRecentEntries([]);
                      close();
                    }}
                  >
                    清除历史工程
                  </button>
                </div>
              </div>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-remove-current-file"
                disabled={statusFileLabel === 'No file'}
                title={
                  statusFileLabel === 'No file'
                    ? '无已打开文件'
                    : `从会话移除「${statusFileLabel}」（不删除源文件）`
                }
                onClick={onRemoveCurrentFile}
              >
                从工程移除当前文件
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-clear-project"
                onClick={() => {
                  sessionHook().clearProject();
                  close();
                }}
              >
                关闭工程
              </button>
            </div>
          ) : null}
        </div>

        {/* Edit */}
        <div className="menubar-item">
          <button
            type="button"
            className="menubar-trigger"
            data-testid="menubar-edit"
            data-open={openMenu === 'edit'}
            aria-haspopup="true"
            aria-expanded={openMenu === 'edit'}
            onClick={() => setOpenMenu((m) => (m === 'edit' ? null : 'edit'))}
          >
            编辑(E)
          </button>
          {openMenu === 'edit' ? (
            <div className="menubar-dropdown" data-testid="menubar-edit-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                data-testid="menu-edit-undo"
                disabled={!canUndo}
                title={m06Ready() ? undefined : '标记撤销需 M-06 hook（未安装则不可用）'}
                onClick={onUndo}
              >
                撤销标记命令
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-edit-redo"
                disabled={!canRedo}
                title={m06Ready() ? undefined : '标记重做需 M-06 hook（未安装则不可用）'}
                onClick={onRedo}
              >
                重做标记命令
              </button>
              <div className="menubar-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                data-testid="menu-edit-delete-marks"
                disabled={!canDeleteMark}
                title={
                  canDeleteMark
                    ? `删除当前标记 ${activeMarkId}`
                    : '无活动标记；需 M-06 hook 与选中标记'
                }
                onClick={onDeleteMark}
              >
                删除所选标记
              </button>
                            <button
                type="button"
                role="menuitem"
                data-testid="menu-edit-rename-mark"
                disabled={!canDeleteMark}
                title={
                  canDeleteMark
                    ? `Rename mark ${activeMarkId}`
                    : "No active mark; needs M-06 hook + selection"
                }
                onClick={openRenameDialog}
              >
                重命名当前标记…
              </button>
              <div className="menubar-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                data-testid="menu-edit-open-markers"
                onClick={openMarkers}
              >
                打开标记页…
              </button>
            </div>
          ) : null}
        </div>

        {/* View */}
        <div className="menubar-item">
          <button
            type="button"
            className="menubar-trigger"
            data-testid="menubar-view"
            data-open={openMenu === 'view'}
            aria-haspopup="true"
            aria-expanded={openMenu === 'view'}
            onClick={() => setOpenMenu((m) => (m === 'view' ? null : 'view'))}
          >
            视图(V)
          </button>
          {openMenu === 'view' ? (
            <div className="menubar-dropdown" data-testid="menubar-view-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-wideband"
                data-active={workspaceMode !== 'narrowband'}
                onClick={() => {
                  setWorkspaceMode('wideband');
                  close();
                }}
              >
                宽带工作区
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-narrowband"
                data-active={workspaceMode === 'narrowband'}
                onClick={() => {
                  setWorkspaceMode('narrowband');
                  close();
                }}
              >
                窄带工作区
              </button>
              <div className="menubar-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-stft"
                data-active={chartMode === 'stft'}
                onClick={() => {
                  setChartMode('stft');
                  close();
                }}
              >
                STFT
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-waterfall"
                data-active={chartMode === 'waterfall'}
                onClick={() => {
                  setChartMode('waterfall');
                  close();
                }}
              >
                Waterfall
              </button>
              <div className="menubar-sep" role="separator" />
                            <button
                type="button"
                role="menuitem"
                data-testid="menu-view-back"
                disabled={!canViewBack}
                title={canViewBack ? "视图后退" : "No earlier view history"}
                onClick={() => {
                  viewHistoryBack();
                  close();
                }}
              >
                视图后退
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-forward"
                disabled={!canViewForward}
                title={canViewForward ? "视图前进" : "No newer view history"}
                onClick={() => {
                  viewHistoryForward();
                  close();
                }}
              >
                视图前进
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-fit-all"
                title="适应全部数据（谱图全域）"
                onClick={onFitAll}
              >
                适应全部数据
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-view-restore-defaults"
                title="恢复默认视图"
                onClick={onRestoreDefaults}
              >
                恢复默认视图
              </button>
              <div className="menubar-sep" role="separator" />
              <button
                type="button"
                role="menuitem"
                data-testid="menu-toggle-rail"
                onClick={() => {
                  toggleRightPanel();
                  close();
                }}
              >
                {rightPanelCollapsed ? '展开右侧栏' : '收起右侧栏'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Analysis */}
        <div className="menubar-item">
          <button
            type="button"
            className="menubar-trigger"
            data-testid="menubar-analysis"
            data-open={openMenu === 'analysis'}
            aria-haspopup="true"
            aria-expanded={openMenu === 'analysis'}
            onClick={() => setOpenMenu((m) => (m === 'analysis' ? null : 'analysis'))}
          >
            分析(A)
          </button>
          {openMenu === 'analysis' ? (
            <div className="menubar-dropdown" data-testid="menubar-analysis-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                data-testid="menu-analysis-detect"
                onClick={openDetect}
              >
                宽带信号检测…
              </button>
              <button
                type="button"
                role="menuitem"
                data-testid="menu-analysis-roi"
                onClick={beginRoi}
              >
                选择检测 ROI…
              </button>
            </div>
          ) : null}
        </div>

        {/* Tools */}
        <div className="menubar-item">
          <button
            type="button"
            className="menubar-trigger"
            data-testid="menubar-tools"
            data-open={openMenu === 'tools'}
            aria-haspopup="true"
            aria-expanded={openMenu === 'tools'}
            onClick={() => setOpenMenu((m) => (m === 'tools' ? null : 'tools'))}
          >
            工具(T)
          </button>
          {openMenu === 'tools' ? (
            <div className="menubar-dropdown" data-testid="menubar-tools-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                data-testid="menu-tools-about"
                onClick={() => {
                  close();
                  setDialog({ title: '关于 Signal Studio', body: ABOUT_TEXT });
                }}
              >
                关于 Signal Studio
              </button>
            </div>
          ) : null}
        </div>

        {/* Help */}
        <div className="menubar-item">
          <button
            type="button"
            className="menubar-trigger"
            data-testid="menubar-help"
            data-open={openMenu === 'help'}
            aria-haspopup="true"
            aria-expanded={openMenu === 'help'}
            onClick={() => setOpenMenu((m) => (m === 'help' ? null : 'help'))}
          >
            帮助(H)
          </button>
          {openMenu === 'help' ? (
            <div className="menubar-dropdown" data-testid="menubar-help-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                data-testid="menu-help-mouse"
                onClick={() => {
                  close();
                  setDialog({ title: '鼠标交互帮助', body: HELP_MOUSE });
                }}
              >
                鼠标交互帮助
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <span className="menubar-spacer" />
      {iqError ? (
        <span className="menubar-iq-error" data-testid="menubar-iq-error" title={iqError}>
          IQ open failed
        </span>
      ) : null}
      {chromeNote ? (
        <span className="menubar-chrome-note" data-testid="menubar-chrome-note" title={chromeNote}>
          {chromeNote}
        </span>
      ) : null}
      <span className="menubar-hint" data-testid="command-bar">
        command-bar
      </span>
      <div className="menubar-window-controls" data-testid="window-controls" role="group" aria-label="window controls">
        <button
          type="button"
          className="menubar-window-btn"
          data-testid="window-minimize"
          title="最小化"
          onClick={onChromeMinimize}
        >
          −
        </button>
        <button
          type="button"
          className="menubar-window-btn"
          data-testid="window-maximize"
          title={chromeMaximized ? '还原' : '最大化'}
          aria-pressed={chromeMaximized}
          onClick={() => void onChromeMaximize()}
        >
          {chromeMaximized ? '❐' : '□'}
        </button>
        <button
          type="button"
          className="menubar-window-btn menubar-window-close"
          data-testid="window-close"
          title="关闭"
          onClick={onChromeClose}
        >
          ×
        </button>
      </div>

      <input
        ref={iqInputRef}
        type="file"
        accept=".wav,.iq,.raw,.ci16,.sigmf-meta,.sigmf-data,audio/wav,audio/x-wav,application/json"
        multiple
        hidden
        data-testid="menubar-input-iq"
        onChange={(e) => {
          void onIqFilesPicked(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={projectInputRef}
        type="file"
        accept="application/json,.json"
        hidden
        data-testid="menubar-input-project"
        onChange={(e) => {
          onOpenProjectFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {dialog ? (
        <div className="menubar-dialog-backdrop" data-testid="menubar-dialog" role="dialog" aria-modal="true">
          <div className="menubar-dialog">
            <header className="menubar-dialog-header">
              <h2 data-testid="menubar-dialog-title">{dialog.title}</h2>
              <button
                type="button"
                data-testid="menubar-dialog-close"
                onClick={() => setDialog(null)}
              >
                ×
              </button>
            </header>
            {dialog.body === '__rename__' ? (
              <div className="menubar-dialog-body" data-testid="menubar-dialog-body">
                <label className="menubar-rename-field">
                  <span>标记名称</span>
                  <input
                    data-testid="menu-rename-input"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename();
                    }}
                    autoFocus
                  />
                </label>
                <div className="menubar-dialog-actions">
                  <button type="button" data-testid="menu-rename-cancel" onClick={() => setDialog(null)}>
                    Cancel
                  </button>
                  <button type="button" data-testid="menu-rename-apply" onClick={commitRename}>
                    Apply
                  </button>
                </div>
              </div>
            ) : (
              <pre className="menubar-dialog-body" data-testid="menubar-dialog-body">
                {dialog.body}
              </pre>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
