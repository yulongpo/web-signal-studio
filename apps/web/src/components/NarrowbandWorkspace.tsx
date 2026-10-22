/**
 * Bot-B G06 NarrowbandWorkspace — stacked multi-page shell vs rebuild NarrowbandWorkspace.
 * Settings live in uiStore so STFT N / grid / frequency persist across page + overflow (a64117e).
 * Observe/modulation/demod DSP feeds from Bot-D (sigmf_data_demo→DDC).
 * Recognition / eye / bitstream stay BLOCKED — no fake scores or bits.
 */
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import type { NarrowbandPageId, NarrowbandWaveformMode, NarrowbandPsdMode } from '../types/provisional';
import { NarrowbandObserveCharts } from './NarrowbandObserveCharts';
import { NarrowbandModulationCharts } from './NarrowbandModulationCharts';
import { NarrowbandDemodCharts } from './NarrowbandDemodCharts';
import {
  computeNarrowbandRecognition,
  NARROWBAND_RECOGNITION_BLOCKED,
} from '../dsp/narrowbandPageDspContracts';

const FFT_OPTIONS = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536] as const;

/** CAO P1#8: product surface default = Observe three charts only. */
const PRODUCT_PAGES: { id: NarrowbandPageId; label: string; testId: string }[] = [
  { id: 'observe', label: '信号观察', testId: 'nb-page-observe' },
];
/** Demoted entries — kept for honesty shells; not inventing G06/G17 content. */
const DEMOTED_PAGES: { id: NarrowbandPageId; label: string; testId: string }[] = [
  { id: 'modulation', label: '调制分析', testId: 'nb-page-modulation' },
  { id: 'deepLearning', label: '深度学习识别', testId: 'nb-page-deep-learning' },
  { id: 'demodulation', label: '解调工作台', testId: 'nb-page-demodulation' },
];
const PAGES = [...PRODUCT_PAGES, ...DEMOTED_PAGES];

function ChartPanel({
  title,
  testId,
  status,
}: {
  title: string;
  testId: string;
  status: string;
}) {
  return (
    <div className="nb-chart-panel" data-testid={testId}>
      <div className="nb-chart-panel-title">{title}</div>
      <div className="nb-chart-panel-body" role="img" aria-label={title}>
        <span className="nb-chart-panel-status">{status}</span>
      </div>
    </div>
  );
}

export function NarrowbandWorkspace() {
  const page = useUiStore((s) => s.narrowbandPage);
  const setPage = useUiStore((s) => s.setNarrowbandPage);
  const psdFft = useUiStore((s) => s.narrowbandPsdFft);
  const setPsdFft = useUiStore((s) => s.setNarrowbandPsdFft);
  const psdMode = useUiStore((s) => s.narrowbandPsdMode);
  const setPsdMode = useUiStore((s) => s.setNarrowbandPsdMode);
  const pinnedDwellIndex = useUiStore((s) => s.narrowbandPinnedDwellIndex);
  const setPinnedDwellIndex = useUiStore((s) => s.setNarrowbandPinnedDwellIndex);
  const clearActivePinnedCursor = useUiStore((s) => s.clearActivePinnedCursor);
  const stftFft = useUiStore((s) => s.narrowbandStftFft);
  const setStftFft = useUiStore((s) => s.setNarrowbandStftFft);
  const freqMode = useUiStore((s) => s.narrowbandFreqMode);
  const setFreqMode = useUiStore((s) => s.setNarrowbandFreqMode);
  const grid = useUiStore((s) => s.narrowbandGrid);
  const setGrid = useUiStore((s) => s.setNarrowbandGrid);
  const waveformMode = useUiStore((s) => s.narrowbandWaveformMode);
  const setWaveformMode = useUiStore((s) => s.setNarrowbandWaveformMode);
  const setWorkspaceMode = useUiStore((s) => s.setWorkspaceMode);
  const setStftN = useUiStore((s) => s.setStftN);
  const channelLabel = useUiStore((s) => s.statusChannelLabel);
  const fileLabel = useUiStore((s) => s.statusFileLabel);
  const projectSummary = useUiStore((s) => s.projectSummary);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const [demotedUnlocked, setDemotedUnlocked] = useState(false);

  // CAO P1#8: keep product default on Observe; demoted pages only after explicit unlock.
  useEffect(() => {
    if (!demotedUnlocked && page !== 'observe') {
      setPage('observe');
    }
  }, [page, demotedUnlocked, setPage]);
  const overflowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    const onDown = (e: MouseEvent) => {
      if (overflowRef.current && e.target instanceof Node && !overflowRef.current.contains(e.target)) {
        setOverflowOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [overflowOpen]);

  const hasChannel =
    Boolean(projectSummary?.activeChannelId) ||
    (channelLabel !== '—' &&
      channelLabel !== '-' &&
      channelLabel !== '' &&
      channelLabel !== '–');
  const dataStatus = hasChannel
    ? `通道 ${channelLabel} · 文件 ${fileLabel} · 信号观察：真实 DDC；降级页/识别 BLOCKED`
    : '观察/调制/解调可用 sigmf_data_demo→DDC；识别页 BLOCKED（不生成伪候选）';
  const onStftChange = (n: number) => {
    setStftFft(n);
    setStftN(n);
  };

  return (
    <div
      className="narrowband-workspace"
      data-testid="workspace-narrowband"
      data-nb-product-surface="observe-only"
      data-cao-p1-8="observe-three-charts"
      data-nb-page={page}
      data-nb-psd-fft={psdFft}
      data-nb-psd-mode={psdMode}
      data-nb-pinned-dwell={pinnedDwellIndex == null ? '' : String(pinnedDwellIndex)}
      data-nb-context-frame-psd={psdMode === 'frame' && pinnedDwellIndex != null ? 'true' : 'false'}
      data-nb-stft-fft={stftFft}
      data-nb-freq-mode={freqMode}
      data-nb-grid={grid ? 'true' : 'false'}
    >
      <header className="nb-header" data-testid="workspace-narrowband-header">
        <div
          className="nb-page-tabs"
          role="tablist"
          aria-label="narrowband pages"
          data-nb-product-surface="observe-only"
          data-cao-p1-8="observe-three-charts"
        >
          {PRODUCT_PAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              data-testid={p.testId}
              data-active={page === p.id}
              aria-selected={page === p.id}
              onClick={() => setPage(p.id)}
            >
              {p.label}
            </button>
          ))}
          <details className="nb-demoted-pages" data-testid="nb-demoted-pages" data-demoted="true">
            <summary title="CAO P1#8：产品面默认仅 Observe 三图；调制/解调/深度学习为降级入口，不发明 G06/G17">
              {'更多页面（降级）'}
            </summary>
            <div className="nb-demoted-page-list" role="group" aria-label="demoted narrowband pages">
              {DEMOTED_PAGES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  data-testid={p.testId}
                  data-demoted="true"
                  data-active={page === p.id}
                  aria-selected={page === p.id}
                  onClick={() => { setDemotedUnlocked(true); setPage(p.id); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </details>
        </div>
        <span className="nb-caption" data-testid="nb-caption">
          {hasChannel ? `窄带通道 ${channelLabel}` : '未选择窄带通道'}
        </span>
        <div
          className="nb-mode-chrome"
          data-testid="nb-mode-chrome"
          data-desktop-cite="workspaceModeButton@17471a6"
          role="group"
          aria-label="工作区模式"
        >
          <button
            type="button"
            data-testid="nb-mode-wideband"
            data-active="false"
            aria-pressed={false}
            onClick={() => setWorkspaceMode('wideband')}
          >
            宽带
          </button>
          <button
            type="button"
            data-testid="nb-mode-narrowband"
            data-active="true"
            aria-pressed={true}
          >
            窄带
          </button>
          <button
            type="button"
            data-testid="nb-return-wideband"
            onClick={() => setWorkspaceMode('wideband')}
          >
            返回宽带
          </button>
        </div>
      </header>

      <div className="nb-chart-toolbar" data-testid="nb-chart-toolbar">
        <label className="nb-field">
          <span>波形</span>
          <select
            data-testid="nb-select-waveform"
            value={waveformMode}
            onChange={(e) => setWaveformMode(e.target.value as NarrowbandWaveformMode)}
          >
            <option value="iq">I / Q</option>
            <option value="rms">幅度 (RMS)</option>
            <option value="phase">相位</option>
            <option value="envelope">幅度包络</option>
          </select>
        </label>
        <label className="nb-field">
          <span>PSD N</span>
          <select
            data-testid="nb-select-psd-fft"
            value={psdFft}
            onChange={(e) => setPsdFft(Number(e.target.value))}
          >
            {FFT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="nb-field">
          <span>PSD 模式</span>
          <select
            data-testid="nb-select-psd-mode"
            value={psdMode}
            onChange={(e) => setPsdMode(e.target.value as NarrowbandPsdMode)}
          >
            <option value="frame">驻留帧谱</option>
            <option value="statistical">统计谱</option>
          </select>
        </label>
                <label className="nb-field" data-testid="nb-field-context-frame-psd">
          <span>驻留帧谱</span>
          <button
            type="button"
            data-testid="nb-btn-context-frame-psd"
            disabled={pinnedDwellIndex == null}
            title={
              pinnedDwellIndex == null
                ? '先在时频谱上单击钉住驻留帧'
                : '使用钉住帧谱（切换到驻留帧谱模式）'
            }
            onClick={() => {
              // Desktop setFramePsd requires pinned; then frame mode.
              if (pinnedDwellIndex == null) return;
              setPsdMode('frame');
            }}
          >
            钉住帧谱
          </button>
          <button
            type="button"
            data-testid="nb-btn-clear-pinned-dwell"
            disabled={pinnedDwellIndex == null}
            onClick={() => clearActivePinnedCursor()}
          >
            清除钉住
          </button>
          <span data-testid="nb-pinned-dwell-label">
            {pinnedDwellIndex == null ? '未钉住' : `帧 ${pinnedDwellIndex}`}
          </span>
        </label>
        <div
          className="nb-field nb-dwell-pin"
          data-testid="nb-dwell-pin"
          data-pinned={pinnedDwellIndex == null ? 'false' : 'true'}
        >
          <span>驻留钉住</span>
          <input
            type="number"
            min={0}
            step={1}
            data-testid="nb-dwell-index-input"
            value={pinnedDwellIndex == null ? '' : String(pinnedDwellIndex)}
            placeholder="帧#"
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                clearActivePinnedCursor();
                return;
              }
              const n = Number(raw);
              if (!Number.isFinite(n)) return;
              setPinnedDwellIndex(Math.max(0, Math.floor(n)));
              setPsdMode('frame');
            }}
          />
          <button
            type="button"
            data-testid="nb-dwell-pin-btn"
            title="钉住当前索引并切到驻留帧谱"
            onClick={() => {
              const idx = pinnedDwellIndex == null ? 0 : pinnedDwellIndex;
              setPinnedDwellIndex(idx);
              setPsdMode('frame');
            }}
          >
            钉住
          </button>
          <button
            type="button"
            data-testid="nb-dwell-clear-btn"
            disabled={pinnedDwellIndex == null}
            title="清除钉住"
            onClick={() => clearActivePinnedCursor()}
          >
            清除
          </button>
        </div>
        <label className="nb-field">
          <span>STFT N</span>
          <select
            data-testid="nb-select-stft-fft"
            value={stftFft}
            onChange={(e) => onStftChange(Number(e.target.value))}
          >
            {FFT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="nb-field">
          <span>频率</span>
          <select
            data-testid="nb-select-freq-mode"
            value={freqMode}
            onChange={(e) => setFreqMode(e.target.value as 'baseband' | 'rf')}
          >
            <option value="baseband">基带</option>
            <option value="rf">射频</option>
          </select>
        </label>
        <label className="nb-field nb-field-check">
          <input
            type="checkbox"
            data-testid="nb-check-grid"
            checked={grid}
            onChange={(e) => setGrid(e.target.checked)}
          />
          <span>显示网格</span>
        </label>
        <div className="toolbar-overflow" ref={overflowRef}>
          <button
            type="button"
            data-testid="nb-btn-overflow"
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((v) => !v)}
          >
            更多
          </button>
          {overflowOpen ? (
            <div className="overflow-menu" data-testid="nb-overflow-menu" role="menu">
              <label className="overflow-item">
                <span>STFT N</span>
                <select
                  data-testid="nb-overflow-stft-fft"
                  value={stftFft}
                  onChange={(e) => onStftChange(Number(e.target.value))}
                >
                  {FFT_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="overflow-item">
                <span>频率</span>
                <select
                  data-testid="nb-overflow-freq-mode"
                  value={freqMode}
                  onChange={(e) => setFreqMode(e.target.value as 'baseband' | 'rf')}
                >
                  <option value="baseband">基带</option>
                  <option value="rf">射频</option>
                </select>
              </label>
              <label className="overflow-item nb-field-check">
                <input
                  type="checkbox"
                  data-testid="nb-overflow-grid"
                  checked={grid}
                  onChange={(e) => setGrid(e.target.checked)}
                />
                <span>显示网格</span>
              </label>
            </div>
          ) : null}
        </div>
        <span className="nb-data-status" data-testid="nb-data-status">
          {dataStatus}
        </span>
      </div>

      <div className="nb-page-stack" data-testid="workspace-narrowband-stack">
        {page === 'observe' ? (
          <div className="nb-page nb-page-observe" data-testid="workspace-narrowband-observe">
            <NarrowbandObserveCharts />
          </div>
        ) : null}
                {page === 'modulation' ? (
          <div className="nb-page nb-page-modulation" data-testid="workspace-narrowband-modulation">
            <p className="nb-honest" data-testid="nb-modulation-note">
              调制分析：星座/时频来自 sigmf_data_demo→DDC；眼图 BLOCKED（无定时同步）；无调制判决分数。
            </p>
            <NarrowbandModulationCharts />
          </div>
        ) : null}
        {page === 'deepLearning' ? (
          <div className="nb-page nb-page-dl" data-testid="workspace-narrowband-deep-learning">
            <p className="nb-honest" data-testid="nb-dl-note">
              {NARROWBAND_RECOGNITION_BLOCKED.reasonZh}
            </p>
            <div className="nb-dl-layout">
              <aside className="nb-dl-config" data-testid="nb-dl-config">
                <h3>识别配置</h3>
                <p className="muted">
                  BLOCKED: {NARROWBAND_RECOGNITION_BLOCKED.reasonCode} · 配置可留在 store；不加载权重、不生成伪分数。
                </p>
                <p className="muted" data-testid="nb-dl-blocked-code">
                  {computeNarrowbandRecognition({
                    tuning: {
                      loOffsetHz: 0,
                      interpolation: 1,
                      decimation: 1,
                      sampleBegin: 0n,
                      sampleEnd: 0n,
                    },
                    source: { sourceLabel: 'sigmf_data_demo', kind: 'sigmf_data_demo' },
                  }).reasonCode}
                </p>
              </aside>
              <ChartPanel
                title="识别时频"
                testId="nb-panel-dl-stft"
                status={`BLOCKED: ${NARROWBAND_RECOGNITION_BLOCKED.reasonCode}`}
              />
            </div>
          </div>
        ) : null}
        {page === 'demodulation' ? (
          <div className="nb-page nb-page-demod" data-testid="workspace-narrowband-demodulation">
            <p className="nb-honest" data-testid="nb-demod-note">
              解调工作区：AM/FM/RMS 包络预览来自 sigmf_data_demo→DDC；比特流/协议解调 BLOCKED（不伪造比特）。
            </p>
            <NarrowbandDemodCharts />
          </div>
        ) : null}
      </div>
    </div>
  );
}
