/**
 * PROVISIONAL — Bot-B right context rail (four pages + collapse).
 */
import { useUiStore } from '../store/uiStore';
import type { RightPage } from '../types/provisional';
import { SHELL_RAIL_PAGES } from '../shellRail';

const PAGE_BODY: Record<RightPage, string> = {
  display: '显示参数（临时设置层对话后入库）',
  detect: '检测首项＜模板 / 门限 / 范围 / 结果',
  marker: '三来源标记列表（占位）',
  channel: '窄带通道（真实 DDC 后续）',
};

export function RightRail() {
  const rightPage = useUiStore((s) => s.rightPage);
  const setRightPage = useUiStore((s) => s.setRightPage);
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const toggleRightPanel = useUiStore((s) => s.toggleRightPanel);

  return (
    <aside
      className={`right-rail${collapsed ? ' right-rail-collapsed' : ''}`}
      aria-label="context-rail"
      data-testid="context-rail"
      data-collapsed={collapsed}
    >
      <div className="rail-chrome">
        <nav className="rail-tabs" data-testid="rail-tabs">
          {SHELL_RAIL_PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              data-testid={`rail-tab-${p.id}`}
              data-active={rightPage === p.id}
              aria-pressed={rightPage === p.id}
              onClick={() => {
                setRightPage(p.id);
                if (collapsed) toggleRightPanel();
              }}
            >
              {p.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="rail-collapse"
          data-testid="rail-collapse"
          aria-expanded={!collapsed}
          onClick={toggleRightPanel}
        >
          {collapsed ? '⟩' : '⟨'}
        </button>
      </div>
      {!collapsed ? (
        <div className="rail-body" data-testid={`rail-page-${rightPage}`}>
          <p>{PAGE_BODY[rightPage]}</p>
        </div>
      ) : null}
    </aside>
  );
}
