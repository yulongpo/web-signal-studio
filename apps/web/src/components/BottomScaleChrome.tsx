/**
 * G09 D4 — BottomPanel scale / range readout chrome (Bot-B shell).
 * Mirrors rebuild@17471a6 main_window viewData_ / cursor meta (ΔT / ΔF).
 * Bot-C bind: ΔT/ΔF from mainChartPhysicalSpans (PhysicalAxis live view);
 * fallback to navWindowTime + spectrogramDisplay when spans unset.
 * Plot tick *paint* remains AxisOverlay on HeatmapCanvas (already MET).
 */
import { useMemo } from 'react';
import { useUiStore } from '../store/uiStore';
import { spanAbs } from '../dsp/physicalViewSpans';

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
  const physicalSpans = useUiStore((s) => s.mainChartPhysicalSpans);

  const bound = physicalSpans != null;

  const deltaT = useMemo(() => {
    if (physicalSpans) {
      const t = spanAbs(physicalSpans.timeSec);
      return Number.isFinite(t) ? Math.max(0, t) : 0;
    }
    return Math.max(0, navWindowTime.max - navWindowTime.min);
  }, [physicalSpans, navWindowTime.min, navWindowTime.max]);

  const deltaF = useMemo(() => {
    if (physicalSpans) {
      const f = spanAbs(physicalSpans.freqHz);
      return Number.isFinite(f) ? f : null;
    }
    const f = spectrogramDisplay?.freqHz;
    if (!f || !Number.isFinite(f.max) || !Number.isFinite(f.min)) return null;
    return Math.abs(f.max - f.min);
  }, [physicalSpans, spectrogramDisplay]);

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
      data-g09-owner="bot-b+c"
      data-axis-bind={bound ? 'physical-view' : 'deferred-await-host'}
      data-chart-mode={chartMode}
      title="G09: ΔT/ΔF from mainChartPhysicalSpans (C PhysicalAxis bind) with B chrome shell. Tick paint = AxisOverlay."
    >
      <span
        className="bottom-scale-view"
        data-testid="bottom-scale-view"
        data-object-name="viewData"
        data-delta-t={String(deltaT)}
        data-delta-f={deltaF == null ? '' : String(deltaF)}
        data-axis-bind={bound ? 'physical-view' : 'deferred-await-host'}
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
        data-axis-bind={bound ? 'physical-view' : 'deferred-await-host'}
      >
        {bound ? 'axis bind: physical-view' : 'axis bind: await host'}
      </span>
    </div>
  );
}
