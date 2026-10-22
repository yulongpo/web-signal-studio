/**
 * Bot-C G04 host: aux Wave/PSD for `chart-aux` slot.
 * PSD = max-across-time from main spectrogram (display only).
 * Wave = raw IQ from sigmf_data_demo via chunked @wss/file-io (IqRms overview),
 *        not STFT time-envelope / not demod.
 */
import { useEffect, useMemo, useState } from 'react';
import { WaveformChart } from '@wss/charts/WaveformChart';
import { useUiStore } from '../store/uiStore';
import { derivePsdInWindow } from '../dsp/chartDisplayDerive';
import {
  readAuxWaveRawIq,
  type WaveIqSeries,
} from '../dsp/auxWaveRawIq';

export function AuxChartHost() {
  const kind = useUiStore((s) => s.auxChartKind);
  const win = useUiStore((s) => s.navWindowTime);
  const snap = useUiStore((s) => s.spectrogramDisplay);
  const linkedCursor = useUiStore((s) => s.linkedCursor);
  const pinLinkedCursor = useUiStore((s) => s.pinLinkedCursor);

  const psdSeries = useMemo(() => {
    if (kind !== 'psd') return null;
    if (!snap || snap.frameCount < 2 || snap.binCount < 2) return null;
    return derivePsdInWindow(snap, win);
  }, [snap, kind, win.min, win.max]);

  const [waveSeries, setWaveSeries] = useState<WaveIqSeries | null>(null);
  const [waveError, setWaveError] = useState<string | null>(null);
  const [waveLoading, setWaveLoading] = useState(false);

  useEffect(() => {
    if (kind !== 'wave') return;
    const ac = new AbortController();
    setWaveLoading(true);
    setWaveError(null);
    const fullTime = snap?.timeSec ?? null;
    void readAuxWaveRawIq({
      win,
      fullTime,
      signal: ac.signal,
    })
      .then((series) => {
        if (ac.signal.aborted) return;
        setWaveSeries(series);
        setWaveLoading(false);
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/abort/i.test(msg)) return;
        setWaveSeries(null);
        setWaveError(msg || 'sigmf_data_demo read failed');
        setWaveLoading(false);
      });
    return () => ac.abort();
  }, [kind, win.min, win.max, snap?.timeSec.min, snap?.timeSec.max]);

  if (kind === 'psd') {
    if (!psdSeries) {
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
        data-aux-points={psdSeries.y.length}
        data-g18-linked-cursor={linkedCursor.pinned ? 'true' : 'false'}
      >
        <WaveformChart
          y={psdSeries.y}
          xDomain={psdSeries.xDomain}
          kind="psd"
          height="100%"
          testId="chart-aux"
          windowX={null}
          linkedX={linkedCursor.pinned ? linkedCursor.frequencyHz : null}
          onPinX={(frequencyHz) => {
            const centerTime =
              snap != null
                ? (snap.timeSec.min + snap.timeSec.max) / 2
                : (win.min + win.max) / 2;
            pinLinkedCursor({
              source: 'psd',
              frequencyHz,
              centerTimeSec: centerTime,
              centerFrequencyHz: (psdSeries.xDomain.min + psdSeries.xDomain.max) / 2,
            });
          }}
        />
      </div>
    );
  }

  // Wave = raw IQ (sigmf_data_demo)
  if (waveLoading && !waveSeries) {
    return (
      <div
        className="chart-host"
        data-chart-slot="aux"
        data-chart-kind="wave"
        data-aux-ready="false"
        data-aux-wave-source="sigmf_data_demo"
        data-aux-wave-feed="sigmf_data_demo_only"
        data-testid="aux-chart-waiting"
        style={{
          display: 'grid',
          placeItems: 'center',
          color: '#9aa7b5',
          fontSize: 12,
        }}
      >
        Loading raw IQ (sigmf_data_demo)…
      </div>
    );
  }

  if (!waveSeries) {
    return (
      <div
        className="chart-host"
        data-chart-slot="aux"
        data-chart-kind="wave"
        data-aux-ready="false"
        data-aux-wave-source="sigmf_data_demo"
        data-aux-wave-feed="sigmf_data_demo_only"
        data-testid="aux-chart-waiting"
        style={{
          display: 'grid',
          placeItems: 'center',
          color: '#9aa7b5',
          fontSize: 12,
          padding: 8,
          textAlign: 'center',
        }}
      >
        {waveError
          ? `Raw IQ unavailable: ${waveError}`
          : 'Aux Wave feeds sigmf_data_demo only (not opened IQ) — waiting/unavailable'}
      </div>
    );
  }

  return (
    <div
      className="chart-host"
      data-chart-slot="aux"
      data-chart-kind="wave"
      data-aux-ready="true"
      data-aux-points={waveSeries.y.length}
      data-aux-wave-source="sigmf_data_demo"
        data-aux-wave-feed="sigmf_data_demo_only"
      data-aux-wave-label={waveSeries.sourceLabel}
      data-g18-linked-cursor={linkedCursor.pinned ? 'true' : 'false'}
      title={`Aux Wave: raw IQ IqRms · ${waveSeries.sourceLabel}`}
    >
      <WaveformChart
        y={waveSeries.y}
        xDomain={waveSeries.xDomain}
        kind="waveform"
        height="100%"
        testId="chart-aux"
        windowX={null}
        linkedX={linkedCursor.pinned ? linkedCursor.timeSec : null}
        onPinX={(timeSec) => {
          const centerFreq =
            snap != null ? (snap.freqHz.min + snap.freqHz.max) / 2 : 0;
          pinLinkedCursor({
            source: 'wave',
            timeSec,
            centerTimeSec: (waveSeries.xDomain.min + waveSeries.xDomain.max) / 2,
            centerFrequencyHz: centerFreq,
            selectedFrame: null,
          });
        }}
      />
    </div>
  );
}
