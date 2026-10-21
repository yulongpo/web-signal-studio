/**
 * Bot-B G01 MenuBar / command-bar — ~34px top chrome vs rebuild MainWindow::buildMenus().
 * File + View groups; Open/Add IQ reachable here (not only SpectrumToolbar).
 * Does not replace NavChrome / chart param strips / NarrowbandWorkspace.
 */
import { useEffect, useRef, useState } from 'react';
import { asProjectSessionHook, useUiStore } from '../store/uiStore';
import {
  clearOpenedIq,
  detectFsaCapabilities,
  openIqFromFiles,
  openIqViaFsa,
} from '../dsp/openIqForMainChart';

type MenuId = 'file' | 'view' | null;

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

export function MenuBar() {
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const [iqError, setIqError] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const iqInputRef = useRef<HTMLInputElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const setWorkspaceMode = useUiStore((s) => s.setWorkspaceMode);
  const chartMode = useUiStore((s) => s.chartMode);
  const setChartMode = useUiStore((s) => s.setChartMode);
  const rightPanelCollapsed = useUiStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);
  const loadSampleProject = useUiStore((s) => s.loadSampleProject);
  const projectSummary = useUiStore((s) => s.projectSummary);
  const projectSource = useUiStore((s) => s.projectSource);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

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
    downloadText(`${name}.json`, text);
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
      <div className="menubar-brand" data-testid="menubar-brand" aria-hidden>
        <span className="menubar-brand-mark">SS</span>
        <span className="menubar-brand-text">Web Signal Studio</span>
      </div>

      <div className="menubar-menus">
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
              <button
                type="button"
                role="menuitem"
                data-testid="menu-open-iq"
                onClick={() => void onOpenIq()}
              >
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
              <div className="menubar-sep" role="separator" />
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
              <button
                type="button"
                role="menuitem"
                data-testid="menu-save-project"
                disabled={projectSource !== 'json'}
                onClick={onSaveProject}
              >
                保存工程
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
      </div>

      <span className="menubar-spacer" />
      {iqError ? (
        <span className="menubar-iq-error" data-testid="menubar-iq-error" title={iqError}>
          IQ open failed
        </span>
      ) : null}
      <span className="menubar-hint" data-testid="command-bar">
        command-bar
      </span>

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
    </header>
  );
}
