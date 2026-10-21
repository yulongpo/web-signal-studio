/**
 * PROVISIONAL — Bot-B single-row spectrum toolbar with overflow for low-priority actions.
 * Includes wideband / narrowband workspace mode toggle (StatusBar stays in sync via store).
 */
import { useEffect, useRef, useState } from 'react';
import { useUiStore } from '../store/uiStore';

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
  const overflowRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="spectrum-toolbar" data-testid="spectrum-toolbar" role="toolbar">
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
      </div>

      <div className="toolbar-overflow" ref={overflowRef}>
        <button
          type="button"
          data-testid="btn-toolbar-overflow"
          aria-expanded={overflowOpen}
          onClick={() => setOverflowOpen((v) => !v)}
        >
          More …
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
  );
}
