/**
 * Bot-B chart param strip for aux/spec headers (rebuild: settings hang on chart header, not nav).
 * G02 demotion: chart-header toolbar only (no aux↔main SpectrumToolbar habit);
 * f9f05bb overflow focus (Esc / autofocus). Open IQ lives in overflow.
 */
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import {
  clearOpenedIq,
  detectFsaCapabilities,
  openIqFromFiles,
  openIqViaFsa,
} from '../dsp/openIqForMainChart';

const STFT_N_OPTIONS = [256, 512, 1024, 2048, 4096] as const;
const PALETTES = ['viridis', 'inferno', 'magma', 'gray'] as const;

export function AuxParamStrip() {
  const auxChartKind = useUiStore((s) => s.auxChartKind);
  const setAuxChartKind = useUiStore((s) => s.setAuxChartKind);
  const openTempLayer = useUiStore((s) => s.openTempLayer);
  const toggleLayer = useUiStore((s) => s.toggleLayer);

  return (
    <header className="chart-strip chart-strip-aux" data-testid="chart-strip-aux">
      <span className="chart-strip-caption chart-strip-qlabel" data-testid="chart-strip-caption-aux">
        辅助分析
      </span>
      <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-aux-kind">
        视图
      </span>
      <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-aux-caption">辅助图</span>
      <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-aux-wave">波形</span>
      <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-aux-psd">PSD</span>
      <button
        type="button"
        data-testid="btn-aux-wave"
        data-active={auxChartKind === 'wave'}
        onClick={() => setAuxChartKind('wave')}
      >
        Wave
      </button>
      <button
        type="button"
        data-testid="btn-aux-psd"
        data-active={auxChartKind === 'psd'}
        onClick={() => setAuxChartKind('psd')}
      >
        PSD
      </button>
      <span className="toolbar-sep" aria-hidden />
      <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-level-btn">电平</span>
      <button
        type="button"
        data-testid="btn-open-level"
        data-qlabel="电平"
        data-active={openTempLayer === 'level'}
        onClick={() => toggleLayer('level')}
      >
        Level
      </button>
      <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-display-btn">显示</span>
      <button
        type="button"
        data-testid="btn-open-display"
        data-active={openTempLayer === 'display'}
        onClick={() => toggleLayer('display')}
      >
        Display
      </button>
    </header>
  );
}

export function SpecParamStrip() {
  const chartMode = useUiStore((s) => s.chartMode);
  const setChartMode = useUiStore((s) => s.setChartMode);
  const stftN = useUiStore((s) => s.stftN);
  const setStftN = useUiStore((s) => s.setStftN);
  const paletteId = useUiStore((s) => s.paletteId);
  const setPaletteId = useUiStore((s) => s.setPaletteId);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const setWorkspaceMode = useUiStore((s) => s.setWorkspaceMode);
  const level = useUiStore((s) => s.level);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [iqOpenError, setIqOpenError] = useState<string | null>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const iqInputRef = useRef<HTMLInputElement>(null);

  const overflowMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    const onDown = (e: MouseEvent) => {
      if (overflowRef.current && e.target instanceof Node && !overflowRef.current.contains(e.target)) {
        setOverflowOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOverflowOpen(false);
        (overflowRef.current?.querySelector('[data-testid="btn-toolbar-overflow"]') as HTMLElement | null)?.focus();
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    // f9f05bb: focus first actionable control when overflow opens
    window.requestAnimationFrame(() => {
      const root = overflowMenuRef.current;
      const focusable = root?.querySelector<HTMLElement>(
        'select, button, [href], input, textarea, [tabindex]:not([tabindex="-1"])',
      );
      focusable?.focus();
    });
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [overflowOpen]);

  const onOpenIqWav = async () => {
    setIqOpenError(null);
    const caps = detectFsaCapabilities();
    if (caps.openLocalFile) {
      const outcome = await openIqViaFsa();
      if (outcome.ok) return;
      if (outcome.reason === 'cancelled') return;
      if (outcome.reason === 'unsupported') {
        iqInputRef.current?.click();
        return;
      }
      setIqOpenError(outcome.message);
      return;
    }
    iqInputRef.current?.click();
  };

  const onIqFilesPicked = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setIqOpenError(null);
    const outcome = await openIqFromFiles(Array.from(list));
    if (!outcome.ok && outcome.reason !== 'cancelled') setIqOpenError(outcome.message);
  };

  return (
    <header
      className="chart-strip chart-strip-main"
      data-testid="chart-strip-main"
      data-variant="chart-header"
      data-toolbar-habit="retired-aux-main"
    >
      <span className="chart-strip-caption" data-testid="chart-strip-caption-main">
        宽带时频谱
      </span>
      <span className="chart-strip-caption chart-strip-caption-physical" data-testid="chart-strip-caption-physical">
        物理坐标
      </span>
      <div
        className="chart-header-toolbar"
        data-testid="chart-header-toolbar"
        data-variant="chart-header"
        data-legacy-testid="spectrum-toolbar"
        role="toolbar"
        aria-label="chart header settings"
      >
        <div className="toolbar-primary">
          <button
            type="button"
            data-testid="btn-workspace-wideband"
            data-active={workspaceMode === 'wideband' || workspaceMode === 'linked'}
            aria-pressed={workspaceMode === 'wideband' || workspaceMode === 'linked'}
            onClick={() => setWorkspaceMode('wideband')}
          >
            宽带
          </button>
          <button
            type="button"
            data-testid="btn-workspace-narrowband"
            data-active={workspaceMode === 'narrowband'}
            aria-pressed={workspaceMode === 'narrowband'}
            onClick={() => setWorkspaceMode('narrowband')}
          >
            窄带
          </button>
          <span className="toolbar-sep" aria-hidden />
          <button
            type="button"
            data-testid="btn-mode-stft"
            data-active={chartMode === 'stft'}
            onClick={() => setChartMode('stft')}
          >
            STFT
          </button>
          <button
            type="button"
            data-testid="btn-mode-waterfall"
            data-active={chartMode === 'waterfall'}
            onClick={() => setChartMode('waterfall')}
          >
            Waterfall
          </button>
          <span className="toolbar-sep" aria-hidden />
          <button
            type="button"
            data-testid="btn-header-detection-roi"
            data-tool="detection-roi"
            title="Detection ROI: confirm bar; Enter writes, Esc cancels"
            onClick={() => setActiveTool('detection-roi')}
          >
            Detection ROI
          </button>
          <span className="toolbar-sep" aria-hidden />
          <button type="button" data-testid="btn-open-iq-wav" onClick={() => void onOpenIqWav()}>
            Open IQ
          </button>
          <button type="button" data-testid="btn-clear-iq-wav" onClick={() => clearOpenedIq()}>
            Clear IQ
          </button>
          <input
            ref={iqInputRef}
            type="file"
            accept=".wav,.iq,.raw,.ci16,.sigmf-meta,.sigmf-data,audio/wav,audio/x-wav,application/json"
            multiple
            hidden
            data-testid="input-iq-wav"
            onChange={(e) => {
              void onIqFilesPicked(e.target.files);
              e.target.value = '';
            }}
          />
          {iqOpenError ? (
            <span className="toolbar-iq-error" data-testid="iq-open-error" title={iqOpenError}>
              IQ open failed
            </span>
          ) : null}
        </div>
                <span
          className="chart-strip-qlabel chart-strip-level-summary"
          data-testid="chart-strip-qlabel-level"
          title={`参考 ${level.refLevelDb.toFixed(2)} dB · 动态 ${level.dynamicRangeDb.toFixed(2)} dB`}
        >
          {`参考 ${level.refLevelDb.toFixed(2)} · 动态 ${level.dynamicRangeDb.toFixed(2)}`}
        </span>
        <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-stft">
          STFT点数
        </span>
        <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-palette">
          色板
        </span>
        <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-mode">
          模式：{chartMode === 'stft' ? 'STFT' : 'Waterfall'}
        </span>
        <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-workspace">
          工作区：{workspaceMode === 'narrowband' ? '窄带' : '宽带'}
        </span>
        <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-stft-value">
          N={stftN}
        </span>
        <span className="chart-strip-qlabel" data-testid="chart-strip-qlabel-palette-value">
          {paletteId}
        </span>
<div className="toolbar-overflow" ref={overflowRef} data-f9f05bb="true">
          <button
            type="button"
            data-testid="btn-toolbar-overflow"
            aria-expanded={overflowOpen}
            aria-haspopup="menu"
            onClick={() => setOverflowOpen((v) => !v)}
          >
            More
          </button>
          {overflowOpen ? (
            <div
              className="overflow-menu"
              data-testid="toolbar-overflow-menu"
              role="menu"
              tabIndex={-1}
              ref={overflowMenuRef}
            >
              <label className="overflow-item">
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft">STFT点数</span>
                <select
                  data-testid="select-stft-n"
                  value={stftN}
                  onChange={(e) => setStftN(Number(e.target.value))}
                >
                  {STFT_N_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="overflow-item">
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-palette">色板</span>
                <select
                  data-testid="select-palette"
                  value={paletteId}
                  onChange={(e) => setPaletteId(e.target.value)}
                >
                  {PALETTES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-stft-n">
                <span className="chart-strip-qlabel">STFT N</span>
                <span className="muted">{stftN}</span>
              </div>
                            <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-level">
                <span className="chart-strip-qlabel">参考 / 动态</span>
                <span className="muted">{`参考 ${level.refLevelDb.toFixed(1)} · 动态 ${level.dynamicRangeDb.toFixed(1)}`}</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-caption">
                <span className="chart-strip-qlabel">图头标题</span>
                <span className="muted">宽带时频图</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-iq">
                <span className="chart-strip-qlabel">IQ</span>
                <span className="muted">Open IQ / Clear IQ</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-workspace">
                <span className="chart-strip-qlabel">工作区</span>
                <span className="muted">{workspaceMode === 'narrowband' ? '窄带' : '宽带'}</span>
              </div>
<button
                type="button"
                className="overflow-action"
                data-testid="btn-tool-roi"
                data-tool="detection-roi"
                role="menuitem"
                onClick={() => {
                  setActiveTool('detection-roi');
                  setOverflowOpen(false);
                }}
              >
                检测ROI
              </button>
              <button
                type="button"
                className="overflow-action"
                data-testid="btn-tool-mark"
                role="menuitem"
                onClick={() => {
                  setActiveTool('marker');
                  setOverflowOpen(false);
                }}
              >
                标记
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
