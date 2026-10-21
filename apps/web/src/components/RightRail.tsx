/**
 * PROVISIONAL — Bot-B right context rail (four pages + collapse).
 * G18: display-summary — PSD N/STFT N shell lines + 参考/动态 vs desktop 696ce12.
 * PSD mode (驻留帧谱/统计谱): charts UI slot (Bot-C) + DSP series (Bot-D).
 */
import { useEffect, useState } from 'react';
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
  const [frameCount, setFrameCount] = useState(0);
  // Mirror chart-published frame count (C ObserveCharts data-frame-count / data-nb-psd-frame-count).
  // Chrome-only: do not recompute STFT; scrubber max stays honest empty until charts publish.
  useEffect(() => {
    const readCount = () => {
      const el =
        document.querySelector('[data-testid="nb-stft-pin-host"]') ||
        document.querySelector('[data-testid="nb-panel-psd"]') ||
        document.querySelector('[data-nb-psd-frame-count]');
      if (!el) {
        setFrameCount(0);
        return;
      }
      const raw =
        el.getAttribute('data-frame-count') ||
        el.getAttribute('data-nb-psd-frame-count') ||
        '';
      const n = Number(raw);
      setFrameCount(Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
    };
    readCount();
    const id = window.setInterval(readCount, 400);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (pinnedDwellIndex != null) setDwellDraft(String(pinnedDwellIndex));
  }, [pinnedDwellIndex]);
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
  const scrubToIndex = (idx: number) => {
    const max = frameCount > 0 ? frameCount - 1 : undefined;
    let next = Math.max(0, Math.floor(idx));
    if (max != null) next = Math.min(max, next);
    setDwellDraft(String(next));
    setNarrowbandPinnedDwellIndex(next);
    setNarrowbandPsdMode('frame');
  };

  return (
    <div
      className="rail-display-page"
      data-testid="rail-display-body"
      data-pinned-dwell={pinnedDwellIndex == null ? '' : String(pinnedDwellIndex)}
      data-dwell-pin-chrome="wave8" data-rail-scrubber="wave10" data-rail-scrubber-wave="wave11"
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
        data-testid="rail-dwell-pin" data-rail-stack="wave12"
        data-pinned={pinnedDwellIndex == null ? 'false' : 'true'}
      >
        <label className="rail-dwell-pin-field">
          <span>驻留帧索引</span>
          <input
            type="number"
            min={0}
            max={frameCount > 0 ? frameCount - 1 : undefined}
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
        <div
          className="rail-dwell-scrubber"
          data-testid="rail-dwell-scrubber"
          data-frame-count={frameCount > 0 ? String(frameCount) : ''}
          data-frame-index={pinnedDwellIndex == null ? '' : String(pinnedDwellIndex)}
          data-scrubber-source={frameCount > 0 ? 'chart-dom' : 'idle'}
          data-rail-scrubber="wave10"
        >
          <span className="rail-dwell-scrubber-label">驻留刷写</span>
          <input
            type="range"
            data-testid="rail-dwell-scrubber-input"
            min={0}
            max={frameCount > 0 ? frameCount - 1 : 0}
            step={1}
            disabled={frameCount <= 0}
            value={
              pinnedDwellIndex != null
                ? Math.min(
                    frameCount > 0 ? frameCount - 1 : pinnedDwellIndex,
                    Math.max(0, pinnedDwellIndex),
                  )
                : Number(dwellDraft) || 0
            }
            aria-label="驻留帧刷写"
            title={
              frameCount > 0
                ? `刷写驻留帧 0…${frameCount - 1}（与图内 scrubber 同源 store）`
                : '等待观察页 STFT 发布帧数'
            }
            onInput={(e) => {
              scrubToIndex(Number((e.target as HTMLInputElement).value));
            }}
            onChange={(e) => {
              scrubToIndex(Number(e.target.value));
            }}
          />
          <span
            className="rail-dwell-scrubber-readout"
            data-testid="rail-dwell-scrubber-readout"
          >
            {pinnedDwellIndex == null
              ? frameCount > 0
                ? `— / ${frameCount}`
                : '—'
              : frameCount > 0
                ? `${pinnedDwellIndex} / ${frameCount}`
                : String(pinnedDwellIndex)}
          </span>
        </div>
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
      data-testid="context-rail" data-rail-stack="wave12"
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
