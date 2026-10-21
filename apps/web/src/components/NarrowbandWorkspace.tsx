/**
 * Bot-B G06 NarrowbandWorkspace — stacked multi-page shell vs rebuild NarrowbandWorkspace.
 * Settings live in uiStore so STFT N / grid / frequency persist across page + overflow (a64117e).
 * Mod/DL/demod: real control chrome + honest empty hosts. No fake demod / candidates. DSP = Bot-D.
 */
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import type {
  NarrowbandDemodMode,
  NarrowbandModulationType,
  NarrowbandPageId,
  NarrowbandWaveformMode,
} from '../types/provisional';
import { NarrowbandObserveCharts } from './NarrowbandObserveCharts';

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
  const appendShellLog = useUiStore((s) => s.appendShellLog);

  const nbModulationType = useUiStore((s) => s.nbModulationType);
  const setNbModulationType = useUiStore((s) => s.setNbModulationType);
  const nbSymbolRate = useUiStore((s) => s.nbSymbolRate);
  const setNbSymbolRate = useUiStore((s) => s.setNbSymbolRate);
  const nbDlModelLabel = useUiStore((s) => s.nbDlModelLabel);
  const setNbDlModelLabel = useUiStore((s) => s.setNbDlModelLabel);
  const nbDlTargetRate = useUiStore((s) => s.nbDlTargetRate);
  const setNbDlTargetRate = useUiStore((s) => s.setNbDlTargetRate);
  const nbDlAllowResample = useUiStore((s) => s.nbDlAllowResample);
  const setNbDlAllowResample = useUiStore((s) => s.setNbDlAllowResample);
  const nbDemodMode = useUiStore((s) => s.nbDemodMode);
  const setNbDemodMode = useUiStore((s) => s.setNbDemodMode);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);

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
    ? `通道 ${channelLabel} · 文件 ${fileLabel} · 观察页：sigmf_data_demo→DDC（不伪解调）`
    : '观察页可用 sigmf_data_demo→DDC；通道未选时仍用 demo 源（不生成伪候选）';
  const chartStatus = hasChannel ? '通道已选 · 等待真实 DDC/STFT 帧' : '等待通道数据';

  const onStftChange = (n: number) => {
    setStftFft(n);
    setStftN(n);
  };

  const workbenchTitle = hasChannel
    ? `窄带工作台 · ${channelLabel}`
    : '窄带工作台 · 未选择通道';

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
          {workbenchTitle}
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
            <NarrowbandObserveCharts />
          </div>
        ) : null}

        {page === 'modulation' ? (
          <div className="nb-page nb-page-modulation" data-testid="workspace-narrowband-modulation">
            <p className="nb-honest" data-testid="nb-modulation-note">
              调制分析页：控件可配置并跨页保留；不执行真实调制判决，无合成星座/眼图伪结果。
            </p>
            <div className="nb-page-controls" data-testid="nb-modulation-controls">
              <label className="nb-field">
                <span>调制格式</span>
                <select
                  data-testid="nb-mod-type"
                  value={nbModulationType}
                  title="人工选择仅用于界面配置，未执行真实调制判决"
                  onChange={(e) =>
                    setNbModulationType(e.target.value as NarrowbandModulationType)
                  }
                >
                  <option value="unknown">未指定</option>
                  <option value="psk">PSK</option>
                  <option value="qam">QAM</option>
                  <option value="fsk">FSK</option>
                  <option value="ask">ASK</option>
                </select>
              </label>
              <label className="nb-field">
                <span>符号率</span>
                <input
                  data-testid="nb-mod-symbol-rate"
                  value={nbSymbolRate}
                  onChange={(e) => setNbSymbolRate(e.target.value)}
                  inputMode="decimal"
                />
              </label>
              <button
                type="button"
                className="nb-primary"
                data-testid="nb-mod-run"
                disabled
                title="真实调制分析由 Bot-D 接入；本按钮保持禁用以免伪造结果"
              >
                运行调制分析
              </button>
            </div>
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
              识别页：配置保留在会话 store；不加载权重、不生成伪分数/Top-5 候选。模型路径约束见 Detect/Bot-E。
            </p>
            <div className="nb-dl-layout">
              <aside className="nb-dl-config" data-testid="nb-dl-config">
                <h3>识别配置</h3>
                <label className="nb-field nb-field-stack">
                  <span>模型文件名（仅记录，不加载）</span>
                  <div className="nb-inline">
                    <input
                      data-testid="nb-dl-model-label"
                      value={nbDlModelLabel}
                      readOnly
                      placeholder="未选择"
                    />
                    <button
                      type="button"
                      data-testid="nb-dl-pick-model"
                      onClick={() => modelInputRef.current?.click()}
                    >
                      选择…
                    </button>
                    <input
                      ref={modelInputRef}
                      type="file"
                      accept=".engine,.onnx,.pt,.pth"
                      hidden
                      data-testid="nb-dl-model-input"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setNbDlModelLabel(f.name);
                        appendShellLog(`识别配置记录模型文件名：${f.name}（未读取权重）`);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </label>
                <label className="nb-field nb-field-stack">
                  <span>目标采样率</span>
                  <input
                    data-testid="nb-dl-target-rate"
                    value={nbDlTargetRate}
                    onChange={(e) => setNbDlTargetRate(e.target.value)}
                    inputMode="decimal"
                  />
                </label>
                <label className="nb-field nb-field-check">
                  <input
                    type="checkbox"
                    data-testid="nb-dl-allow-resample"
                    checked={nbDlAllowResample}
                    onChange={(e) => setNbDlAllowResample(e.target.checked)}
                  />
                  <span>允许重采样（仅配置）</span>
                </label>
                <button
                  type="button"
                  className="nb-primary"
                  data-testid="nb-dl-run"
                  disabled
                  title="真实识别由 Bot-D/E 接入；禁用以免伪造候选"
                >
                  运行识别
                </button>
                <p className="nb-dl-top5" data-testid="nb-dl-top5">
                  Top-5 候选 · 等待真实识别任务
                </p>
              </aside>
              <ChartPanel title="识别时频" testId="nb-panel-dl-stft" status="等待真实识别任务" />
            </div>
          </div>
        ) : null}

        {page === 'demodulation' ? (
          <div className="nb-page nb-page-demod" data-testid="workspace-narrowband-demodulation">
            <p className="nb-honest" data-testid="nb-demod-note">
              解调工作区：控件可配置；无伪解调、无假比特流。真实 DDC/解调由 Bot-D 接入后填充。
            </p>
            <div className="nb-page-controls" data-testid="nb-demod-controls">
              <label className="nb-field">
                <span>解调方式</span>
                <select
                  data-testid="nb-demod-mode"
                  value={nbDemodMode}
                  onChange={(e) => setNbDemodMode(e.target.value as NarrowbandDemodMode)}
                >
                  <option value="none">未指定</option>
                  <option value="am">AM</option>
                  <option value="fm">FM</option>
                  <option value="psk">PSK</option>
                  <option value="qam">QAM</option>
                </select>
              </label>
              <button
                type="button"
                className="nb-primary"
                data-testid="nb-demod-run"
                disabled
                title="真实解调由 Bot-D 接入；本按钮保持禁用"
              >
                运行解调
              </button>
              <button
                type="button"
                data-testid="nb-demod-export"
                disabled
                title="无真实位流可导出"
              >
                导出位流…
              </button>
              <span className="nb-demod-status" data-testid="nb-demod-status">
                未执行真实解调
              </span>
            </div>
            <div className="nb-demod-grid">
              <ChartPanel title="解调星座" testId="nb-panel-demod-constellation" status="等待真实解调输出" />
              <ChartPanel title="眼图" testId="nb-panel-demod-eye" status="等待真实定时同步" />
              <ChartPanel title="解调波形" testId="nb-panel-demod-wave" status="等待真实解调输出" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
