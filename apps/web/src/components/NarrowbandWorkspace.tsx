/**
 * Bot-B G06 NarrowbandWorkspace — stacked multi-page shell vs rebuild NarrowbandWorkspace.
 * Settings live in uiStore so STFT N / grid / frequency persist across page + overflow (a64117e).
 * No fake demod / no invented candidates. Channel data awaits real DDC path (Bot-D).
 */
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import type { NarrowbandPageId, NarrowbandWaveformMode } from '../types/provisional';

const FFT_OPTIONS = [32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536] as const;

const PAGES: { id: NarrowbandPageId; label: string; testId: string }[] = [
  { id: 'observe', label: '信号观察', testId: 'nb-page-observe' },
  { id: 'modulation', label: '调制分析', testId: 'nb-page-modulation' },
  { id: 'deepLearning', label: '深度学习识别', testId: 'nb-page-deep-learning' },
  { id: 'demodulation', label: '解调工作区', testId: 'nb-page-demodulation' },
];

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
    ? `通道 ${channelLabel} · 文件 ${fileLabel} · 等待真实 DDC 帧（不伪解调）`
    : '等待通道数据（未选择窄带通道；不生成伪候选）';
  const chartStatus = hasChannel ? '通道已选 · 等待真实 DDC/STFT 帧' : '等待通道数据';

  const onStftChange = (n: number) => {
    setStftFft(n);
    setStftN(n);
  };

  return (
    <div
      className="narrowband-workspace"
      data-testid="workspace-narrowband"
      data-nb-page={page}
      data-nb-psd-fft={psdFft}
      data-nb-stft-fft={stftFft}
      data-nb-freq-mode={freqMode}
      data-nb-grid={grid ? 'true' : 'false'}
    >
      <header className="nb-header" data-testid="workspace-narrowband-header">
        <div className="nb-page-tabs" role="tablist" aria-label="narrowband pages">
          {PAGES.map((p) => (
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
        </div>
        <span className="nb-caption" data-testid="nb-caption">
          {hasChannel ? `窄带通道 ${channelLabel}` : '未选择窄带通道'}
        </span>
        <button
          type="button"
          data-testid="nb-return-wideband"
          onClick={() => setWorkspaceMode('wideband')}
        >
          返回宽带
        </button>
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
          <span>PSD FFT</span>
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
            <option value="rf">RF</option>
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
                <span>STFT N（overflow）</span>
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
                <span>频率（overflow）</span>
                <select
                  data-testid="nb-overflow-freq-mode"
                  value={freqMode}
                  onChange={(e) => setFreqMode(e.target.value as 'baseband' | 'rf')}
                >
                  <option value="baseband">基带</option>
                  <option value="rf">RF</option>
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
            <div className="nb-observe-top">
              <ChartPanel title="波形" testId="nb-panel-waveform" status={chartStatus} />
              <ChartPanel title="功率谱密度" testId="nb-panel-psd" status={chartStatus} />
            </div>
            <ChartPanel title="时频谱" testId="nb-panel-stft" status={chartStatus} />
          </div>
        ) : null}
        {page === 'modulation' ? (
          <div className="nb-page nb-page-modulation" data-testid="workspace-narrowband-modulation">
            <p className="nb-honest" data-testid="nb-modulation-note">
              调制分析页壳：未执行真实调制判决；无合成星座/眼图伪结果。
            </p>
            <div className="nb-mod-grid">
              <ChartPanel title="星座" testId="nb-panel-constellation" status="等待真实调制分析" />
              <ChartPanel title="眼图" testId="nb-panel-eye" status="等待真实定时同步" />
              <ChartPanel title="时频谱" testId="nb-panel-mod-stft" status={chartStatus} />
            </div>
          </div>
        ) : null}
        {page === 'deepLearning' ? (
          <div className="nb-page nb-page-dl" data-testid="workspace-narrowband-deep-learning">
            <p className="nb-honest" data-testid="nb-dl-note">
              识别页壳：不运行演示推理、不生成伪分数；模型路径由 Bot-E/Detect 页约束。
            </p>
            <div className="nb-dl-layout">
              <aside className="nb-dl-config" data-testid="nb-dl-config">
                <h3>识别配置</h3>
                <p className="muted">配置保留在会话 store；切页不丢失。不加载权重。</p>
              </aside>
              <ChartPanel title="识别时频" testId="nb-panel-dl-stft" status="等待真实识别任务" />
            </div>
          </div>
        ) : null}
        {page === 'demodulation' ? (
          <div className="nb-page nb-page-demod" data-testid="workspace-narrowband-demodulation">
            <p className="nb-honest" data-testid="nb-demod-note">
              解调工作区壳：无伪解调、无假比特流。真实 DDC/解调由 Bot-D 接入后填充。
            </p>
            <ChartPanel title="解调波形" testId="nb-panel-demod-wave" status="等待真实解调输出" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
