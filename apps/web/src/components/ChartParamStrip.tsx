/**
 * Bot-B chart param strip for aux/spec headers (rebuild: settings hang on chart header, not nav).
 * G02 demotion: chart-header toolbar only (no aux↔main SpectrumToolbar habit);
 * f9f05bb overflow focus (Esc / autofocus). Open IQ lives in overflow.
 */
import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_KAISER_BETA,
  STFT_BLOCKED_METHODS,
  STFT_SPECTRUM_STATISTIC_STATUS,
  STFT_SUPPORTED_METHODS,
} from '@wss/contracts';
import { useUiStore } from '../store/uiStore';
import {
  clearOpenedIq,
  detectFsaCapabilities,
  openIqFromFiles,
  openIqViaFsa,
} from '../dsp/openIqForMainChart';

const STFT_N_OPTIONS = [256, 512, 1024, 2048, 4096] as const;
const PALETTES = ['viridis', 'inferno', 'magma', 'gray'] as const;
const STFT_WINDOW_OPTIONS = [
  'rectangular',
  'hann',
  'hamming',
  'blackman',
  'blackman_harris',
  'flat_top',
  'kaiser',
] as const;
const STFT_OVERLAP_PCT_OPTIONS = [0, 25, 50, 75, 90] as const;
/** Desktop SpectralSettings duration_ values (ms) when auto-N off. */
const STFT_SEGMENT_MS_OPTIONS = [0.1, 1, 10, 100] as const;

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
  const stftWindowPref = useUiStore((s) => s.stftWindowPref);
  const setStftWindowPref = useUiStore((s) => s.setStftWindowPref);
  const stftOverlapPref = useUiStore((s) => s.stftOverlapPref);
  const setStftOverlapPref = useUiStore((s) => s.setStftOverlapPref);
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
  const dspFftWindow = useUiStore((s) => s.dspFftWindow);
  const dspFftOverlap = useUiStore((s) => s.dspFftOverlap);
  const dspFftHopSize = useUiStore((s) => s.dspFftHopSize);
  const dspFftSizeActive = useUiStore((s) => s.dspFftSizeActive);
  const dspSpectralMethod = useUiStore((s) => s.dspSpectralMethod);
  const dspSegmentMs = useUiStore((s) => s.dspSegmentMs);
  const dspSpectrumStatistic = useUiStore((s) => s.dspSpectrumStatistic);
  const dspKaiserBeta = useUiStore((s) => s.dspKaiserBeta);
  const dspRemoveMean = useUiStore((s) => s.dspRemoveMean);
  const dspAutoNb = useUiStore((s) => s.dspAutoNb);
  const stftKaiserBetaPref = useUiStore((s) => s.stftKaiserBetaPref);
  const setStftKaiserBetaPref = useUiStore((s) => s.setStftKaiserBetaPref);
  const stftAutoNbPref = useUiStore((s) => s.stftAutoNbPref);
  const setStftAutoNbPref = useUiStore((s) => s.setStftAutoNbPref);
  const stftRemoveMeanPref = useUiStore((s) => s.stftRemoveMeanPref);
  const setStftRemoveMeanPref = useUiStore((s) => s.setStftRemoveMeanPref);
  const stftSegmentMsPref = useUiStore((s) => s.stftSegmentMsPref);
  const setStftSegmentMsPref = useUiStore((s) => s.setStftSegmentMsPref);
  const [overlapDraft, setOverlapDraft] = useState<string | null>(null);
  const [segmentDraft, setSegmentDraft] = useState<string | null>(null);
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

  const windowLabel = dspFftWindow ?? '—';
  const overlapLabel =
    dspFftOverlap == null || !Number.isFinite(dspFftOverlap)
      ? '—'
      : `${(dspFftOverlap * 100).toFixed(1)}%`;
  const hopLabel =
    dspFftHopSize == null || !Number.isFinite(dspFftHopSize)
      ? '—'
      : String(dspFftHopSize);
  const fftActiveLabel =
    dspFftSizeActive == null || !Number.isFinite(dspFftSizeActive)
      ? '—'
      : String(dspFftSizeActive);
  const methodLabel = dspSpectralMethod ?? '—';
  const segmentMsLabel =
    dspSegmentMs == null || !Number.isFinite(dspSegmentMs)
      ? '—'
      : `${dspSegmentMs.toFixed(3)} ms`;
  // Desktop STFT has no SpectrumStatistic — always NA (D: NA_PSD_ONLY).
  const statisticLabel =
    dspSpectrumStatistic == null
      ? `NA (${STFT_SPECTRUM_STATISTIC_STATUS})`
      : dspSpectrumStatistic;
  const kaiserBetaLabel =
    dspKaiserBeta == null || !Number.isFinite(dspKaiserBeta)
      ? '—'
      : String(dspKaiserBeta);
  const autoNbLabel =
    dspAutoNb == null ? '—' : dspAutoNb ? 'auto N/B' : 'fixed N';
  const removeMeanLabel =
    dspRemoveMean == null ? '—' : dspRemoveMean ? 'on' : 'off';
  const hasWindow = dspFftWindow != null;
  const hasOverlap = dspFftOverlap != null && Number.isFinite(dspFftOverlap);

return (
    <header
      className="chart-strip chart-strip-main"
      data-testid="chart-strip-main"
      data-strip-nuance="wave9" data-strip-wave="wave11 wave14 wave19 wave21 wave22 wave25 wave26 wave29 wave33" data-strip-dsp="wave19 wave21 wave25 wave26 wave29 wave33" data-stft-n-drives-compute="wave22" data-stft-segment-ms="wave33" data-native-qfiledialog="false"
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
          data-strip-wave="wave14 wave21"
          title="窗函数 — 未接 DSP 时诚实为空"
        >
          窗
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-window-value"
          data-strip-wave="wave14 wave19 wave21"
          data-strip-empty={hasWindow ? 'false' : 'true'}
          data-strip-partial={hasWindow ? 'false' : 'true'}
          data-strip-reason={hasWindow ? '' : 'no-window-fn-in-store'}
          data-dsp-fft-window={dspFftWindow ?? ''}
          data-dsp-fft-size={dspFftSizeActive == null ? '' : String(dspFftSizeActive)}
        >
          {windowLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-overlap"
          data-strip-wave="wave14 wave21"
        >
          重叠
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-overlap-value"
          data-strip-wave="wave14 wave19 wave21"
          data-strip-empty={hasOverlap ? 'false' : 'true'}
          data-strip-partial={hasOverlap ? 'false' : 'true'}
          data-strip-reason={hasOverlap ? '' : 'no-overlap-in-store'}
          data-dsp-fft-overlap={dspFftOverlap == null ? '' : String(dspFftOverlap)}
          data-dsp-fft-hop={dspFftHopSize == null ? '' : String(dspFftHopSize)}
        >
          {overlapLabel}
        </span>

        
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-fft-hop"
          data-strip-wave="wave21"
          title="STFT hop (uiStore.dspFftHopSize)"
        >
          Hop
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-fft-hop-value"
          data-strip-wave="wave21"
          data-dsp-fft-hop={dspFftHopSize == null ? '' : String(dspFftHopSize)}
          data-strip-empty={dspFftHopSize == null ? 'true' : 'false'}
          data-strip-partial={dspFftHopSize == null ? 'true' : 'false'}
        >
          {hopLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-fft-size-active"
          data-strip-wave="wave21"
          title="Active FFT size (uiStore.dspFftSizeActive)"
        >
          FFTn
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-qlabel-fft-size-active-value"
          data-strip-wave="wave21"
          data-dsp-fft-size={dspFftSizeActive == null ? '' : String(dspFftSizeActive)}
          data-strip-empty={dspFftSizeActive == null ? 'true' : 'false'}
          data-strip-partial={dspFftSizeActive == null ? 'true' : 'false'}
        >
          {fftActiveLabel}
        </span>

        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-method"
          data-strip-wave="wave25"
          title="Spectral method (D publish; only welch driveable)"
        >
          Method
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-value-method"
          data-dsp-spectral-method={dspSpectralMethod ?? ''}
          data-strip-empty={dspSpectralMethod == null ? 'true' : 'false'}
          data-strip-wave="wave25"
        >
          {methodLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-segment-ms"
          data-strip-wave="wave25"
          title="Segment ms derived from fftSize/fs (D dspSegmentMs)"
        >
          SegMs
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-value-segment-ms"
          data-dsp-segment-ms={dspSegmentMs == null ? '' : String(dspSegmentMs)}
          data-strip-empty={dspSegmentMs == null ? 'true' : 'false'}
          data-strip-wave="wave25"
        >
          {segmentMsLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-statistic"
          data-strip-wave="wave25"
          data-statistic-status={STFT_SPECTRUM_STATISTIC_STATUS}
          title="SpectrumStatistic is PSD-only on desktop STFT (NA)"
        >
          Stat
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-value-statistic"
          data-dsp-spectrum-statistic={dspSpectrumStatistic ?? ''}
          data-strip-empty="true"
          data-strip-wave="wave25"
        >
          {statisticLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-kaiser-beta"
          data-strip-wave="wave25"
          title="Kaiser beta (D publish when window=kaiser)"
        >
          β
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-value-kaiser-beta"
          data-dsp-kaiser-beta={dspKaiserBeta == null ? '' : String(dspKaiserBeta)}
          data-strip-empty={dspKaiserBeta == null ? 'true' : 'false'}
          data-strip-wave="wave25"
        >
          {kaiserBetaLabel}
        </span>

        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-auto-nb"
          data-strip-wave="wave29"
          title="D dspAutoNb publish"
        >
          AutoN
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-value-auto-nb"
          data-dsp-auto-nb={dspAutoNb == null ? "" : dspAutoNb ? "true" : "false"}
          data-strip-empty={dspAutoNb == null ? "true" : "false"}
          data-strip-wave="wave29"
        >
          {autoNbLabel}
        </span>
        <span
          className="chart-strip-qlabel"
          data-testid="chart-strip-qlabel-remove-mean"
          data-strip-wave="wave29"
          title="D dspRemoveMean publish"
        >
          Mean0
        </span>
        <span
          className="chart-strip-qlabel chart-strip-qlabel-value"
          data-testid="chart-strip-value-remove-mean"
          data-dsp-remove-mean={dspRemoveMean == null ? "" : dspRemoveMean ? "true" : "false"}
          data-strip-empty={dspRemoveMean == null ? "true" : "false"}
          data-strip-wave="wave29"
        >
          {removeMeanLabel}
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
                  data-stft-n-drives-compute="wave22"
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
              <label className="overflow-item" data-testid="overflow-spectral-window" data-strip-wave="wave22">
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-window">窗函数</span>
                <select
                  data-testid="select-stft-window"
                  value={stftWindowPref}
                  onChange={(e) =>
                    setStftWindowPref(e.target.value as (typeof STFT_WINDOW_OPTIONS)[number])
                  }
                  title="Desired STFT window (drives next compute)"
                >
                  {STFT_WINDOW_OPTIONS.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </label>
              <label className="overflow-item" data-testid="overflow-spectral-overlap" data-strip-wave="wave22">
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-overlap">重叠 %</span>
                <select
                  data-testid="select-stft-overlap"
                  value={
                    overlapDraft != null
                      ? overlapDraft
                      : String(Math.round(stftOverlapPref * 100))
                  }
                  onChange={(e) => {
                    const raw = e.target.value;
                    const pct = Number(raw);
                    if (
                      !Number.isFinite(pct) ||
                      !STFT_OVERLAP_PCT_OPTIONS.includes(
                        pct as (typeof STFT_OVERLAP_PCT_OPTIONS)[number],
                      )
                    ) {
                      setOverlapDraft(raw);
                      return;
                    }
                    setOverlapDraft(null);
                    setStftOverlapPref(pct / 100);
                  }}
                  onBlur={() => setOverlapDraft(null)}
                  title={
                    overlapDraft != null
                      ? `Invalid overlap draft "${overlapDraft}" — lastValid=${Math.round(stftOverlapPref * 100)}% (allowed: ${STFT_OVERLAP_PCT_OPTIONS.join("/")})`
                      : `Desired overlap % (hop = fft*(1-overlap)); lastValid=${Math.round(stftOverlapPref * 100)}%`
                  }
                  data-last-valid={String(Math.round(stftOverlapPref * 100))}
                  data-invalid-draft={overlapDraft != null ? "true" : "false"}
                >
                  {STFT_OVERLAP_PCT_OPTIONS.map((pct) => (
                    <option key={pct} value={pct}>
                      {pct}
                    </option>
                  ))}
                </select>
              </label>
              <div
                className="overflow-item overflow-qlabel-only"
                data-testid="overflow-spectral-method"
                data-strip-wave="wave25 wave26"
              >
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-method">谱估计方法</span>
                <select
                  data-testid="select-stft-method"
                  value="welch"
                  disabled
                  title="Only welch is driveable (D StftRequest)"
                >
                  {STFT_SUPPORTED_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <span
                  className="overflow-disabled-copy muted"
                  data-testid="overflow-stft-method-disabled-copy"
                  data-strip-wave="wave26"
                >
                  welch only · Multitaper/Burg/Periodogram/Bartlett BLOCKED
                </span>

                <ul
                  className="overflow-blocked-methods"
                  data-testid="overflow-stft-blocked-methods"
                  data-blocked="stft-methods"
                >
                  {STFT_BLOCKED_METHODS.map((m) => (
                    <li key={m} data-testid={`overflow-stft-blocked-${m}`} data-blocked="true">
                      {m}: BLOCKED
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="overflow-item overflow-qlabel-only"
                data-testid="overflow-spectral-statistic"
                data-strip-wave="wave25 wave33"
                data-psd-only="true"
                data-stft-statistic="NA_PSD_ONLY"
                data-statistic-status={STFT_SPECTRUM_STATISTIC_STATUS}
              >
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-statistic">统计类型</span>
                <span className="muted" data-testid="overflow-stft-statistic-na">
                  NA ({STFT_SPECTRUM_STATISTIC_STATUS})
                </span>
              </div>
              <div
                className="overflow-item overflow-qlabel-only"
                data-testid="overflow-spectral-segment-ms"
                data-strip-wave="wave25 wave26 wave29 wave33"
                data-auto-n={stftAutoNbPref ? "on" : "off"}
                data-dsp-auto-nb={dspAutoNb == null ? "" : dspAutoNb ? "true" : "false"}
                data-object-name="stftSegmentMs"
                title="Desktop segmentMilliseconds: 0 = auto N/B; fixed 0.1/1/10/100 ms via resolveAnalysisSamples PoT"
              >
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-segment-ms">分段时长</span>
                <span className="muted" data-testid="overflow-stft-segment-ms">
                  {stftAutoNbPref
                    ? dspAutoNb
                      ? `auto N/B · ${segmentMsLabel}`
                      : "auto N/B (pending settle)"
                    : `${stftSegmentMsPref} ms (pref) · settle ${segmentMsLabel}`}
                </span>
                <label className="overflow-toggle" data-testid="overflow-stft-auto-nb-toggle">
                  <input
                    type="checkbox"
                    data-testid="toggle-stft-auto-nb"
                    checked={stftAutoNbPref}
                    onChange={(e) => setStftAutoNbPref(e.target.checked)}
                  />
                  <span data-testid="overflow-stft-auto-nb-label">auto N/B (segmentMs=0)</span>
                </label>
                {!stftAutoNbPref ? (
                  <label className="overflow-field" data-testid="overflow-stft-segment-ms-field">
                    <span className="chart-strip-qlabel">SegmentMs</span>
                    <select
                      data-testid="select-stft-segment-ms"
                      value={
                        segmentDraft != null
                          ? segmentDraft
                          : String(stftSegmentMsPref)
                      }
                      onChange={(e) => {
                        const raw = e.target.value;
                        const ms = Number(raw);
                        if (
                          !Number.isFinite(ms) ||
                          !STFT_SEGMENT_MS_OPTIONS.includes(
                            ms as (typeof STFT_SEGMENT_MS_OPTIONS)[number],
                          )
                        ) {
                          setSegmentDraft(raw);
                          return;
                        }
                        setSegmentDraft(null);
                        setStftSegmentMsPref(ms);
                      }}
                      onBlur={() => setSegmentDraft(null)}
                      title={
                        segmentDraft != null
                          ? `Invalid SegmentMs draft "${segmentDraft}" — lastValid=${stftSegmentMsPref} ms (allowed: ${STFT_SEGMENT_MS_OPTIONS.join("/")})`
                          : `Fixed SegmentMs when auto-N off (desktop duration_); lastValid=${stftSegmentMsPref} ms`
                      }
                      data-last-valid={String(stftSegmentMsPref)}
                      data-invalid-draft={segmentDraft != null ? "true" : "false"}
                    >
                      {STFT_SEGMENT_MS_OPTIONS.map((ms) => (
                        <option key={ms} value={ms}>
                          {ms} ms
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <span
                  className="overflow-disabled-copy muted"
                  data-testid="overflow-stft-segment-auto-n"
                  data-blocked="false"
                  data-strip-wave="wave29 wave33"
                >
                  {stftAutoNbPref
                    ? "uses resolveAnalysisSamples(bandwidth=fs, points=stftN)"
                    : "fixed SegmentMs → resolveAnalysisSamples PoT (bandwidth=fs)"}
                </span>
              </div>
              <label
                className="overflow-item"
                data-testid="overflow-spectral-kaiser-beta"
                data-strip-wave="wave25 wave26"
                data-enabled={stftWindowPref === 'kaiser' ? 'true' : 'false'}
              >
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-kaiser-beta">Kaiser β</span>
                <input
                  type="number"
                  data-testid="input-stft-kaiser-beta"
                  min={0}
                  max={30}
                  step={0.1}
                  disabled={stftWindowPref !== 'kaiser'}
                  value={stftKaiserBetaPref}
                  onChange={(e) => setStftKaiserBetaPref(Number(e.target.value))}
                  title={
                    stftWindowPref === 'kaiser'
                      ? 'Kaiser beta drives next STFT (published as dspKaiserBeta)'
                      : `Enable when window=kaiser (default ${DEFAULT_KAISER_BETA})`
                  }
                />
                {stftWindowPref !== 'kaiser' ? (
                  <span
                    className="overflow-disabled-copy muted"
                    data-testid="overflow-stft-kaiser-disabled-copy"
                    data-strip-wave="wave26"
                    data-blocked="true"
                  >
                    disabled until window=kaiser
                  </span>
                ) : null}

              </label>
              <label
                className="overflow-item overflow-toggle-row"
                data-testid="overflow-spectral-remove-mean"
                data-strip-wave="wave29"
                data-dsp-remove-mean={dspRemoveMean == null ? "" : dspRemoveMean ? "true" : "false"}
              >
                <span className="chart-strip-qlabel" data-testid="overflow-qlabel-stft-remove-mean">去除均值</span>
                <input
                  type="checkbox"
                  data-testid="toggle-stft-remove-mean"
                  checked={stftRemoveMeanPref}
                  onChange={(e) => setStftRemoveMeanPref(e.target.checked)}
                  title="Desktop removeMean: subtract complex mean per frame before window (D StftRequest)"
                />
                <span className="muted" data-testid="overflow-stft-remove-mean-pub">
                  pub: {removeMeanLabel}
                </span>
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
<div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-window" data-strip-wave="wave14 wave21">
                <span className="chart-strip-qlabel">窗函数</span>
                <span
                  className="chart-strip-qlabel-value"
                  data-dsp-fft-window={dspFftWindow ?? ''}
                  data-strip-empty={hasWindow ? 'false' : 'true'}
                  data-strip-partial={hasWindow ? 'false' : 'true'}
                >
                  {windowLabel}
                </span>
              </div>
              <div className="overflow-item overflow-qlabel-only" data-testid="overflow-qlabel-overlap" data-strip-wave="wave14 wave21">
                <span className="chart-strip-qlabel">重叠</span>
                <span
                  className="chart-strip-qlabel-value"
                  data-dsp-fft-overlap={dspFftOverlap == null ? '' : String(dspFftOverlap)}
                  data-dsp-fft-hop={dspFftHopSize == null ? '' : String(dspFftHopSize)}
                  data-strip-empty={hasOverlap ? 'false' : 'true'}
                  data-strip-partial={hasOverlap ? 'false' : 'true'}
                >
                  {overlapLabel}
                </span>
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
