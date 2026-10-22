/**
 * Bot-B desktop-like scope bar (MainWindow scopeBar @17471a6).
 * Primary page switch: checkable「宽带时频研判」(workspaceModeButton habit).
 * GAP_QUALITY_7f7aead Q7-01/12 — mode chrome unlike tiny MenuBar segment alone.
 * matrix_pass_claimed: false
 */
import { useUiStore } from '../store/uiStore';
import { SHELL_SCOPE_BAR_PX } from '../shellMidLayout';

export function ScopeBar() {
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const setWorkspaceMode = useUiStore((s) => s.setWorkspaceMode);
  const projectSummary = useUiStore((s) => s.projectSummary);
  const statusFileLabel = useUiStore((s) => s.statusFileLabel);
  const isWideband = workspaceMode !== 'narrowband';
  const projectName =
    projectSummary?.name?.trim() ||
    statusFileLabel?.trim() ||
    '未打开工程';

  return (
    <div
      className="scope-bar"
      data-testid="scope-bar"
      data-desktop-cite="scopeBar@17471a6"
      data-scope-h={SHELL_SCOPE_BAR_PX}
      style={{ height: SHELL_SCOPE_BAR_PX }}
    >
      <button
        type="button"
        className="scope-mode-btn"
        data-testid="btn-workspace-mode"
        data-ui-role="primary"
        data-active={isWideband ? 'true' : 'false'}
        aria-pressed={isWideband}
        title="桌面 workspaceModeButton：勾选=宽带工作区"
        onClick={() =>
          setWorkspaceMode(isWideband ? 'narrowband' : 'wideband')
        }
      >
        宽带时频研判
      </button>
      <span className="scope-project" data-testid="scope-project-label">
        {projectName}
      </span>
      <span className="scope-spacer" />
      <span className="scope-meta" data-testid="scope-meta">
        {isWideband ? '宽带工作区' : '窄带工作区'}
      </span>
      <div
        className="scope-mode-segment"
        data-testid="scope-mode-segment"
        role="group"
        aria-label="工作区页面"
      >
        <button
          type="button"
          className="scope-seg-btn"
          data-testid="scope-btn-wideband"
          data-active={isWideband ? 'true' : 'false'}
          aria-pressed={isWideband}
          onClick={() => setWorkspaceMode('wideband')}
        >
          宽带
        </button>
        <button
          type="button"
          className="scope-seg-btn"
          data-testid="scope-btn-narrowband"
          data-active={!isWideband ? 'true' : 'false'}
          aria-pressed={!isWideband}
          onClick={() => setWorkspaceMode('narrowband')}
        >
          窄带
        </button>
      </div>
    </div>
  );
}
