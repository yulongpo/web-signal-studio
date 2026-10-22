/**
 * G09 D4 — BottomPanel scale / range readout chrome (Bot-B).
 * Mirrors rebuild@17471a6 main_window viewData_ / cursor meta (ΔT / ΔF),
 * not PlotWidget axis tick paint (Bot-C axis bind).
 */
import { useMemo } from 'react';
import { useUiStore } from '../store/uiStore';

function fmtSpan(v: number, kind: 'time' | 'freq'): string {
  if (!Number.isFinite(v) || v < 0) return '—';
  if (kind === 'time') {
    if (v >= 1) return `${v.toFixed(3)} s`;
    if (v >= 1e-3) return `${(v * 1e3).toFixed(3)} ms`;
    return `${(v * 1e6).toFixed(1)} µs`;
  }
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(3)} MHz`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(3)} kHz`;
  return `${v.toFixed(1)} Hz`;
}

export function BottomScaleChrome() {
  const navWindowTime = useUiStore((s) => s.navWindowTime);
  const spectrogramDisplay = useUiStore((s) => s.spectrogramDisplay);
  const statusCursor = useUiStore((s) => s.statusCursor);
  const chartMode = useUiStore((s) => s.chartMode);

  const deltaT = useMemo(
    () => Math.max(0, navWindowTime.max - navWindowTime.min),
    [navWindowTime.min, navWindowTime.max],
  );
  const deltaF = useMemo(() => {
    const f = spectrogramDisplay?.freqHz;
    if (!f || !Number.isFinite(f.max) || !Number.isFinite(f.min)) return null;
    return Math.abs(f.max - f.min);
  }, [spectrogramDisplay]);

  const viewLabel = useMemo(() => {
    const tPart = `ΔT ${fmtSpan(deltaT, 'time')}`;
    const fPart =
      deltaF == null ? 'ΔF — (await spectrogram)' : `ΔF ${fmtSpan(deltaF, 'freq')}`;
    return `| 视图 ${tPart} · ${fPart}`;
  }, [deltaT, deltaF]);

  return (
    <div
      className="bottom-scale-chrome"
      data-testid="bottom-scale-chrome"
      data-object-name="viewData"
      data-g09="partial"
      data-g09-owner="bot-b"
      data-axis-bind="deferred-to-c"
      data-chart-mode={chartMode}
      title="G09 scale chrome: view ΔT/ΔF from uiStore (navWindowTime + spectrogramDisplay). Plot axis ticks → Bot-C."
    >
      <span
        className="bottom-scale-view"
        data-testid="bottom-scale-view"
        data-object-name="viewData"
        data-delta-t={String(deltaT)}
        data-delta-f={deltaF == null ? '' : String(deltaF)}
      >
        {viewLabel}
      </span>
      <span className="bottom-scale-sep" aria-hidden>
        |
      </span>
      <span
        className="bottom-scale-cursor"
        data-testid="bottom-scale-cursor"
        data-object-name="cursorData"
      >
        光标 T {statusCursor.timeLabel} · F {statusCursor.freqLabel}
      </span>
      <span
        className="bottom-scale-honesty muted"
        data-testid="bottom-scale-honesty"
        data-axis-bind="deferred-to-c"
      >
        axis ticks → C
      </span>
    </div>
  );
}
