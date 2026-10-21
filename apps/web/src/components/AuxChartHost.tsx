/**
 * Bot-C G04 host: aux Wave/PSD for `chart-aux` slot.
 * Curves derived from main spectrogram + linked nav window (display only).
 * Wave = STFT time-envelope in window (not raw IQ / not demod).
 */
import { useMemo } from 'react';
import { WaveformChart } from '@wss/charts/WaveformChart';
import { useUiStore } from '../store/uiStore';
import {
  derivePsdInWindow,
  deriveWaveInWindow,
} from '../dsp/chartDisplayDerive';

export function AuxChartHost() {
  const kind = useUiStore((s) => s.auxChartKind);
  const win = useUiStore((s) => s.navWindowTime);
  const snap = useUiStore((s) => s.spectrogramDisplay);

  const series = useMemo(() => {
    if (!snap || snap.frameCount < 2 || snap.binCount < 2) {
      return null;
    }
    if (kind === 'psd') return derivePsdInWindow(snap, win);
    return deriveWaveInWindow(snap, win);
  }, [snap, kind, win.min, win.max]);

  if (!series) {
    return (
      <div
        className="chart-host"
        data-chart-slot="aux"
        data-chart-kind={kind}
        data-aux-ready="false"
        data-testid="aux-chart-waiting"
        style={{
          display: 'grid',
          placeItems: 'center',
          color: '#9aa7b5',
          fontSize: 12,
        }}
      >
        Waiting for spectrogram…
      </div>
    );
  }

  return (
    <div
      className="chart-host"
      data-chart-slot="aux"
      data-chart-kind={kind}
      data-aux-ready="true"
      data-aux-points={series.y.length}
    >
      <WaveformChart
        y={series.y}
        xDomain={series.xDomain}
        kind={kind === 'psd' ? 'psd' : 'waveform'}
        height="100%"
        testId="chart-aux"
        windowX={null}
      />
    </div>
  );
}
