/**
 * Bot-B chart param strip for aux/spec headers (rebuild: settings hang on chart header, not nav).
 * G02 demotion: replaces always-on SpectrumToolbar row between aux and main.
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
      <span className="chart-strip-title">Aux</span>
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
      <button
        type="button"
        data-testid="btn-open-level"
        data-active={openTempLayer === 'level'}
        onClick={() => toggleLayer('level')}
      >
        Level
      </button>
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
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [iqOpenError, setIqOpenError] = useState<string | null>(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const iqInputRef = useRef<HTMLInputElement>(null);

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
      className="chart-strip chart-strip-main spectrum-toolbar spectrum-toolbar-chart-header"
      data-testid="chart-strip-main"
      data-variant="chart-header"
    >
      <div
        className="spectrum-toolbar spectrum-toolbar-chart-header"
        data-testid="spectrum-toolbar"
        data-variant="chart-header"
        role="toolbar"
      >
        <div className="toolbar-primary">
          <button
            type="button"
            data-testid="btn-workspace-wideband"
            data-active={workspaceMode === 'wideband' || workspaceMode === 'linked'}
            aria-pressed={workspaceMode === 'wideband' || workspaceMode === 'linked'}
            onClick={() => setWorkspaceMode('wideband')}
          >
            Wideband
          </button>
          <button
            type="button"
            data-testid="btn-workspace-narrowband"
            data-active={workspaceMode === 'narrowband'}
            aria-pressed={workspaceMode === 'narrowband'}
            onClick={() => setWorkspaceMode('narrowband')}
          >
            Narrowband
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
        <div className="toolbar-overflow" ref={overflowRef}>
          <button
            type="button"
            data-testid="btn-toolbar-overflow"
            aria-expanded={overflowOpen}
            onClick={() => setOverflowOpen((v) => !v)}
          >
            More
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
                <span>Palette</span>
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
                  setActiveTool('select');
                  setOverflowOpen(false);
                }}
              >
                ROI
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
                Mark
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
