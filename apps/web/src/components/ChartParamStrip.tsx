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
    <header className="chart-strip chart-strip-aux" data-testid="chart-strip-aux" data-strip-nuance="aux-wave8 wave9">
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
  const display = useUiStore((s) => s.display);
  const dspSource = useUiStore((s) => s.dspSource);
  const dspFftEngineActive = useUiStore((s) => s.dspFftEngineActive);
  const detectRunFeed = useUiStore((s) => s.detectRunFeed);
  const detectRunSelectedId = useUiStore((s) => s.detectRunSelectedId);
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

  
  const fftEngineLabel = dspFftEngineActive
    ? dspFftEngineActive.fellBackToJs
      ? `${dspFftEngineActive.requested}→js`
      : dspFftEngineActive.active
    : '—';
  const selectedRun =
    detectRunFeed.find((r) => r.runId === detectRunSelectedId) ??
    detectRunFeed[0] ??
    null;
  const feedStamp =
    detectRunFeed.length === 0
      ? '—'
      : selectedRun
        ? `${selectedRun.status}/${selectedRun.kind} · n=${detectRunFeed.length}`
        : `n=${detectRunFeed.length}`;

return (
    <header
      className="chart-strip chart-strip-main"
      data-testid="chart-strip-main"
      data-strip-nuance="wave9" data-strip-wave="wave11 wave14 wave19" data-strip-dsp="wave19"
      data-variant="chart-header"
      data-toolbar-habit="retired-aux-main"
    >
      <span className="chart-strip-caption" data-testid="chart-strip-caption-main">
        宽带时频谱
      </span>
      <span className="chart-strip-caption chart-strip-caption-physical" data-testid="chart-strip-caption-physical"
        data-strip-unit="physical"
        data-strip-nuance="wave8"
      >
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
          data-strip-unit="dB"
          data-strip-nuance="ref-dyn-units"
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
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-freq-mode"
          data-strip-wave="wave14"
          title="显示频率模式（图头）"
        >
          频率
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-freq-mode-value"
          data-strip-wave="wave14"
        >
          {display.freqMode === 'rf' ? 'RF' : '基带'}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-window"
          data-strip-wave="wave14"
          title="窗函数 — 未接 DSP 时诚实为空"
        >
          窗
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-window-value"
          data-strip-wave="wave14 wave19"
          data-strip-empty="true"
          data-strip-partial="true"
          data-strip-reason="no-window-fn-in-store"
        >
          —
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-overlap"
          data-strip-wave="wave14"
        >
          重叠
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-overlap-value"
          data-strip-wave="wave14 wave19"
          data-strip-empty="true"
          data-strip-partial="true"
          data-strip-reason="no-overlap-in-store"
        >
          —
        </span>

        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-dsp-source"
          data-strip-wave="wave19"
          title="DSP source (uiStore.dspSource)"
        >
          DSP
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-dsp-source-value"
          data-strip-wave="wave19"
          data-dsp-source={dspSource}
          data-strip-empty={dspSource === 'loading' ? 'true' : 'false'}
        >
          {dspSource === 'loading' ? '—' : dspSource}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-fft-engine"
          data-strip-wave="wave19"
          title="FFT engine (uiStore.dspFftEngineActive)"
        >
          FFT
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-fft-engine-value"
          data-strip-wave="wave19"
          data-fft-requested={dspFftEngineActive?.requested ?? ''}
          data-fft-active={dspFftEngineActive?.active ?? ''}
          data-fft-fallback={dspFftEngineActive?.fellBackToJs ? 'true' : 'false'}
          data-strip-empty={dspFftEngineActive ? 'false' : 'true'}
        >
          {fftEngineLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-detect-feed"
          data-strip-wave="wave19"
          title="detectRunFeed path stamp (real LocalCompute feed only)"
        >
          Detect
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-detect-feed-value"
          data-strip-wave="wave19"
          data-detect-feed-count={String(detectRunFeed.length)}
          data-detect-feed-status={selectedRun?.status ?? ''}
          data-detect-feed-kind={selectedRun?.kind ?? ''}
          data-strip-empty={detectRunFeed.length === 0 ? 'true' : 'false'}
        >
          {feedStamp}
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
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-freq-unit" data-strip-nuance="wave8">
                <span className="chart-strip-qlabel">频率单位</span>
                <span className="chart-strip-qlabel-value" data-strip-unit="Hz">Hz / MHz</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-spacing" data-strip-nuance="wave8-spacing">
                <span className="chart-strip-qlabel">图头间距</span>
                <span className="chart-strip-qlabel-value">compact</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-palette-unit" data-strip-nuance="wave9">
                <span className="chart-strip-qlabel">色板单位</span>
                <span className="chart-strip-qlabel-value" data-strip-unit="palette">index</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-mode-caption" data-strip-nuance="wave9">
                <span className="chart-strip-qlabel">主图模式</span>
                <span className="chart-strip-qlabel-value">STFT / Waterfall</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-grid" data-strip-wave="wave11">
                <span className="chart-strip-qlabel">网格</span>
                <span className="chart-strip-qlabel-value" data-strip-unit="grid">on/off</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-ref-unit" data-strip-wave="wave11">
                <span className="chart-strip-qlabel">参考单位</span>
                <span className="chart-strip-qlabel-value" data-strip-unit="dB">dB</span>
              </div>
                            <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-dsp-source" data-strip-wave="wave19">
                <span className="chart-strip-qlabel">DSP</span>
                <span className="chart-strip-qlabel-value" data-dsp-source={dspSource} data-strip-empty={dspSource === 'loading' ? 'true' : 'false'}>
                  {dspSource === 'loading' ? '—' : dspSource}
                </span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-fft-engine" data-strip-wave="wave19">
                <span className="chart-strip-qlabel">FFT</span>
                <span className="chart-strip-qlabel-value" data-strip-empty={dspFftEngineActive ? 'false' : 'true'}>
                  {fftEngineLabel}
                </span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-detect-feed" data-strip-wave="wave19">
                <span className="chart-strip-qlabel">Detect feed</span>
                <span className="chart-strip-qlabel-value" data-detect-feed-count={String(detectRunFeed.length)} data-strip-empty={detectRunFeed.length === 0 ? 'true' : 'false'}>
                  {feedStamp}
                </span>
              </div>
<div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-window" data-strip-wave="wave14">
                <span className="chart-strip-qlabel">窗函数</span>
                <span className="chart-strip-qlabel-value" data-strip-empty="true">—</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-overlap" data-strip-wave="wave14">
                <span className="chart-strip-qlabel">重叠比</span>
                <span className="chart-strip-qlabel-value" data-strip-empty="true">—</span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-colormap" data-strip-wave="wave14">
                <span className="chart-strip-qlabel">色图</span>
                <span className="chart-strip-qlabel-value">{paletteId}</span>
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
