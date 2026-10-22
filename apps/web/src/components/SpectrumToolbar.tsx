/**
 * PROVISIONAL — Bot-B single-row spectrum toolbar with overflow for low-priority actions.
 * Includes wideband / narrowband workspace mode toggle (StatusBar stays in sync via store).
 * Open IQ: FSA WAV when available, else <input type=file> WAV/RAW/SigMF via @wss/file-io.
 */
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../store/uiStore';
import {
  clearOpenedIq,
  detectFsaCapabilities,
  openDemoIqForMainChart,
  openIqFromFiles,
  openIqViaFsa,
} from '../dsp/openIqForMainChart';
import { beginIqFileOpen, endIqFileOpen } from '../dsp/iqFileSession';
import { clearDemoSigmfCache } from '../dsp/auxWaveRawIq';

const STFT_N_OPTIONS = [256, 512, 1024, 2048, 4096] as const;
const PALETTES = ['viridis', 'inferno', 'magma', 'gray'] as const;

export function SpectrumToolbar() {
  const chartMode = useUiStore((s) => s.chartMode);
  const setChartMode = useUiStore((s) => s.setChartMode);
  const auxChartKind = useUiStore((s) => s.auxChartKind);
  const setAuxChartKind = useUiStore((s) => s.setAuxChartKind);
  const openTempLayer = useUiStore((s) => s.openTempLayer);
  const toggleLayer = useUiStore((s) => s.toggleLayer);
  const stftN = useUiStore((s) => s.stftN);
  const setStftN = useUiStore((s) => s.setStftN);
  const paletteId = useUiStore((s) => s.paletteId);
  const setPaletteId = useUiStore((s) => s.setPaletteId);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const setWorkspaceMode = useUiStore((s) => s.setWorkspaceMode);

  const [overflowOpen, setOverflowOpen] = useState(false);
  const [iqOpenError, setIqOpenError] = useState<string | null>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const iqInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!overflowOpen) return;
    const onDown = (e: MouseEvent) => {
      if (
        overflowRef.current &&
        e.target instanceof Node &&
        !overflowRef.current.contains(e.target)
      ) {
        setOverflowOpen(false);
      }
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
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
    const files = Array.from(list);
    beginIqFileOpen();
    try {
      const outcome = await openIqFromFiles(files);
      if (!outcome.ok && outcome.reason !== 'cancelled') {
        setIqOpenError(outcome.message);
      }
    } finally {
      endIqFileOpen();
    }
  };

  const onClearIq = () => {
    setIqOpenError(null);
    clearOpenedIq();
  };

  const onLoadDemoIq = async () => {
    setIqOpenError(null);
    beginIqFileOpen();
    const ac = new AbortController();
    const timeoutId = window.setTimeout(() => {
      ac.abort();
      clearDemoSigmfCache();
    }, 45_000);
    try {
      const outcome = await openDemoIqForMainChart({ signal: ac.signal });
      if (!outcome.ok && outcome.reason !== 'cancelled') {
        setIqOpenError(outcome.message);
      } else if (!outcome.ok && outcome.reason === 'cancelled') {
        setIqOpenError('加载演示 IQ 超时或已取消（请重试）');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setIqOpenError(msg || '加载演示 IQ 失败');
    } finally {
      window.clearTimeout(timeoutId);
      endIqFileOpen();
    }
  };

  return (
    <div className="spectrum-toolbar" data-testid="spectrum-toolbar" data-native-qfiledialog="false" data-g16-shell="partial" role="toolbar">
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
        <div
          className="mode-wheel"
          data-testid="mode-wheel-demoted"
          data-g16-host="demoted-not-live-app-dom"
          data-g16="partial"
          data-live-dom="false"
          data-g16-owner="bot-b"
          data-desktop-main-mode="TimeFrequency|Waterfall"
          data-desktop-aux-mode="Waveform|Psd"
          data-matrix="insufficient"
          data-no-invent="true"
          role="group"
          aria-label="Chart mode wheel (desktop MainMode / AuxiliaryMode shell)"
          title="G16 shell: MainMode TimeFrequency/Waterfall + Aux Waveform/Psd. Enable/disable matrix incomplete — no invent. Chart consumers → C. DSP enum → D N/A."
        >
<button
          type="button"
          data-testid="btn-mode-stft"
          data-active={chartMode === 'stft'}
          onClick={() => setChartMode('stft')}
        >
          时频图
        </button>
        <button
          type="button"
          data-testid="btn-mode-waterfall"
          data-active={chartMode === 'waterfall'}
          onClick={() => setChartMode('waterfall')}
        >
          瀑布图
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button
          type="button"
          data-testid="btn-aux-wave"
          data-active={auxChartKind === 'wave'}
          onClick={() => setAuxChartKind('wave')}
        >
          时域波形
        </button>
        <button
          type="button"
          data-testid="btn-aux-psd"
          data-active={auxChartKind === 'psd'}
          onClick={() => setAuxChartKind('psd')}
        >
          功率谱(PSD)
        </button>
        </div>
        <span className="toolbar-sep" aria-hidden />
        <button
          type="button"
          data-testid="btn-open-iq-wav"
          data-native-qfiledialog="false"
          onClick={() => void onOpenIqWav()}
          title="打开 IQ（WAV / RAW / SigMF；可用时 FSA WAV）。浏览器选择器 / FSA，非原生 QFileDialog。"
        >
          打开 IQ
        </button>
        <button
          type="button"
          data-testid="btn-load-demo-iq"
          onClick={() => void onLoadDemoIq()}
          title="D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.*"
        >
          加载演示 IQ
        </button>
        <button
          type="button"
          data-testid="btn-clear-iq-wav"
          onClick={onClearIq}
          title="清除已打开 IQ，并回到合成夹具（非演示磁盘）"
        >
          清除 IQ
        </button>
        <input
          ref={iqInputRef}
          type="file"
          accept=".wav,.iq,.raw,.ci16,.sigmf-meta,.sigmf-data,audio/wav,audio/x-wav,application/json"
          multiple
          hidden
          data-testid="input-iq-wav" data-native-qfiledialog="false"
          onChange={(e) => {
            void onIqFilesPicked(e.target.files);
            e.target.value = '';
          }}
        />
        {iqOpenError ? (
          <span className="toolbar-iq-error" data-testid="iq-open-error" title={iqOpenError}>
            IQ 打开失败
          </span>
        ) : null}
        <button
          type="button"
          data-testid="btn-open-level"
          data-active={openTempLayer === 'level'}
          onClick={() => toggleLayer('level')}
        >
          电平
        </button>
        <button
          type="button"
          data-testid="btn-open-display"
          data-active={openTempLayer === 'display'}
          onClick={() => toggleLayer('display')}
        >
          显示
        </button>
      </div>

      <div className="toolbar-overflow" ref={overflowRef}>
        <button
          type="button"
          data-testid="btn-toolbar-overflow"
          aria-expanded={overflowOpen}
          onClick={() => setOverflowOpen((v) => !v)}
        >
          更多…
        </button>
        {overflowOpen ? (
          <div className="overflow-menu" data-testid="toolbar-overflow-menu" role="menu">
            <label className="overflow-item">
              <span>STFT N</span>
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
              <span>色板</span>
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
            <button
              type="button"
              className="overflow-action"
              data-testid="btn-tool-roi"
              role="menuitem"
              onClick={() => {
                setActiveTool('detection-roi');
                setOverflowOpen(false);
              }}
            >
              检测 ROI
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
  );
}
