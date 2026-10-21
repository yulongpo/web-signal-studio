/**
 * PROVISIONAL — Bot-B right context rail (four pages + collapse).
 * G18: display page keeps a live display-summary (参考 / 动态) vs desktop 696ce12.
 */
import { useUiStore } from '../store/uiStore';
import type { RightPage } from '../types/provisional';
import { SHELL_RAIL_PAGES } from '../shellRail';
import { DetectPage } from './DetectPage';
import { M06MarksPanel } from './M06MarksPanel';

const PAGE_BODY: Record<Exclude<RightPage, 'detect' | 'marker' | 'display'>, string> = {
  channel: '窄带通道（真实 DDC 后续）',
};

function DisplayPage() {
  const level = useUiStore((s) => s.level);
  const display = useUiStore((s) => s.display);
  const openLayer = useUiStore((s) => s.openLayer);
  const summary = [
    `参考 ${level.refLevelDb.toFixed(2)} dB`,
    `动态 ${level.dynamicRangeDb.toFixed(2)} dB`,
    level.autoAdapt ? '自动适应: 开' : '自动适应: 关',
    `频率: ${display.freqMode === 'rf' ? 'RF' : '基带'}`,
  ].join('\n');

  return (
    <div className="rail-display-page" data-testid="rail-display-body">
      <pre
        className="display-summary"
        data-testid="display-summary"
        aria-live="polite"
      >
        {summary}
      </pre>
      <p className="rail-page-hint">显示参数（临时设置层对话后入库）</p>
      <button
        type="button"
        className="btn-ghost"
        data-testid="btn-open-level-layer"
        onClick={() => openLayer('level')}
      >
        打开 Level…
      </button>
      <button
        type="button"
        className="btn-ghost"
        data-testid="btn-open-display-layer"
        onClick={() => openLayer('display')}
      >
        打开显示…
      </button>
    </div>
  );
}

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
          {collapsed ? '«' : '»'}
        </button>
      </div>
      {!collapsed ? (
        <div className="rail-body" data-testid={`rail-page-${rightPage}`}>
          {rightPage === 'detect' ? (
            <DetectPage />
          ) : rightPage === 'marker' ? (
            <M06MarksPanel />
          ) : rightPage === 'display' ? (
            <DisplayPage />
          ) : (
            <p>{PAGE_BODY[rightPage]}</p>
          )}
        </div>
      ) : null}
    </aside>
  );
}
