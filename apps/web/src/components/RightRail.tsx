/**
 * PROVISIONAL — Bot-B right context rail (four pages + collapse).
 * G18: display-summary — PSD N/STFT N shell lines + 参考/动态 vs desktop 696ce12.
 * PSD mode (驻留帧谱/统计谱): charts UI slot (Bot-C) + DSP series (Bot-D).
 */
import { useState } from 'react';
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
  const stftN = useUiStore((s) => s.stftN);
  const paletteId = useUiStore((s) => s.paletteId);
  const narrowbandPsdFft = useUiStore((s) => s.narrowbandPsdFft);
  const narrowbandPsdMode = useUiStore((s) => s.narrowbandPsdMode);
  const pinnedDwellIndex = useUiStore((s) => s.narrowbandPinnedDwellIndex);
  const setNarrowbandPsdMode = useUiStore((s) => s.setNarrowbandPsdMode);
  const setNarrowbandPinnedDwellIndex = useUiStore((s) => s.setNarrowbandPinnedDwellIndex);
  const openLayer = useUiStore((s) => s.openLayer);
  const [dwellDraft, setDwellDraft] = useState(
    () => (pinnedDwellIndex != null ? String(pinnedDwellIndex) : '0'),
  );
  // G18: Bot-B owns dwell pin chrome; Bot-C mode label; Bot-D frame PSD series.
  const psdModeLabel =
    narrowbandPsdMode === 'frame' ? '驻留帧谱' : '统计谱';
  const pinLabel =
    pinnedDwellIndex == null ? '未钉住驻留' : `钉住驻留 #${pinnedDwellIndex}`;
  const summary = [
    `PSD N ${narrowbandPsdFft || '—'} · ${psdModeLabel}`,
    `STFT N ${stftN} · ${paletteId}`,
    pinLabel,
    `参考 ${level.refLevelDb.toFixed(2)} dB`,
    `动态 ${level.dynamicRangeDb.toFixed(2)} dB`,
    level.autoAdapt ? '自动适应: 开' : '自动适应: 关',
    `频率: ${display.freqMode === 'rf' ? 'RF' : '基带'}`,
  ].join('\n');

  const pinDwell = () => {
    const n = Number(dwellDraft);
    const idx = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
    setDwellDraft(String(idx));
    setNarrowbandPinnedDwellIndex(idx);
    setNarrowbandPsdMode('frame');
  };
  const clearPin = () => {
    setNarrowbandPinnedDwellIndex(null);
  };

  return (
    <div
      className="rail-display-page"
      data-testid="rail-display-body"
      data-pinned-dwell={pinnedDwellIndex == null ? '' : String(pinnedDwellIndex)}
      data-dwell-pin-chrome="wave8"
    >
      <pre
        className="display-summary"
        data-testid="display-summary"
        data-psd-mode={narrowbandPsdMode}
        data-psd-mode-label={psdModeLabel}
        data-context-frame-psd={
          narrowbandPsdMode === 'frame' && pinnedDwellIndex != null ? 'true' : 'false'
        }
        data-pinned-dwell={pinnedDwellIndex == null ? '' : String(pinnedDwellIndex)}
        aria-live="polite"
      >
        {summary}
      </pre>
      <div
        className="rail-dwell-pin"
        data-testid="rail-dwell-pin"
        data-pinned={pinnedDwellIndex == null ? 'false' : 'true'}
      >
        <label className="rail-dwell-pin-field">
          <span>驻留帧索引</span>
          <input
            type="number"
            min={0}
            step={1}
            data-testid="rail-dwell-index-input"
            value={dwellDraft}
            onChange={(e) => setDwellDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') pinDwell();
            }}
          />
        </label>
        <button
          type="button"
          className="btn-ghost"
          data-testid="rail-dwell-pin-btn"
          title="钉住驻留并切换到驻留帧谱"
          onClick={pinDwell}
        >
          钉住驻留
        </button>
        <button
          type="button"
          className="btn-ghost"
          data-testid="rail-dwell-clear-btn"
          disabled={pinnedDwellIndex == null}
          title="清除钉住（恢复默认末帧）"
          onClick={clearPin}
        >
          清除钉住
        </button>
      </div>
      <p className="rail-page-hint">显示参数（临时设置层对话后入库）</p>
      <button
        type="button"
        className="btn-ghost"
        data-testid="btn-open-level-layer"
        onClick={() => openLayer('level')}
      >
        打开 Level层
      </button>
      <button
        type="button"
        className="btn-ghost"
        data-testid="btn-open-display-layer"
        onClick={() => openLayer('display')}
      >
        打开显示层
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
