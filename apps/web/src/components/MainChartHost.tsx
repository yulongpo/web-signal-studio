/**
 * PROVISIONAL - Bot-B main chart host + Bot-D real STFT path.
 * Embeds @wss/charts SpectrumChart (HeatmapCanvas + AxisOverlay + CursorOverlay).
 * Default power comes from synthetic two-tone IQ → DspWorkerClient STFT (labeled fixture).
 * Demo synthPower remains only as loading/fallback — never claimed as real capture.
 */
import { useEffect, useMemo, useState } from 'react';
import { SpectrumChart } from '@wss/charts/SpectrumChart';
import type { ColormapName } from '@wss/charts/lut/colormaps';
import { useUiStore } from '../store/uiStore';
import { useDspWorkerClient } from '../dsp/useDspWorkerClient';
import {
  computeMainSpectrogram,
  type MainSpectrogramResult,
} from '../dsp/computeMainSpectrogram';

/** Demo-only procedural frames (loading / error fallback). Not DSP output. */
function synthPower(binCount: number, frameCount: number): Float32Array {
  const out = new Float32Array(binCount * frameCount);
  for (let t = 0; t < frameCount; t++) {
    for (let f = 0; f < binCount; f++) {
      const u = f / binCount;
      const v = t / frameCount;
      const tone =
        Math.exp(-((u - 0.35) ** 2) / 0.002) * (0.6 + 0.4 * Math.sin(40 * v));
      const tone2 =
        Math.exp(-((u - 0.62) ** 2) / 0.0015) * (0.4 + 0.3 * Math.cos(25 * v));
      out[t * binCount + f] = tone + tone2 + 0.04 * Math.random();
    }
  }
  return out;
}

const PALETTE_OK: ColormapName[] = ['viridis', 'inferno', 'magma', 'gray'];
const FALLBACK_BINS = 256;
const FALLBACK_FRAMES = 128;

export function MainChartHost() {
  const chartMode = useUiStore((s) => s.chartMode);
  const paletteId = useUiStore((s) => s.paletteId);
  const level = useUiStore((s) => s.level);
  const setStatusCursor = useUiStore((s) => s.setStatusCursor);
  const client = useDspWorkerClient();

  const [spec, setSpec] = useState<MainSpectrogramResult | null>(null);
  const [dspSource, setDspSource] = useState<'loading' | 'synthetic-stft-worker' | 'demo-fallback'>(
    'loading',
  );

  const fallbackPower = useMemo(
    () => synthPower(FALLBACK_BINS, FALLBACK_FRAMES),
    [],
  );

  useEffect(() => {
    if (!client) return;
    const ac = new AbortController();
    setDspSource('loading');
    void computeMainSpectrogram({ client, signal: ac.signal })
      .then((result) => {
        if (ac.signal.aborted) return;
        setSpec(result);
        setDspSource('synthetic-stft-worker');
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn('[MainChartHost] STFT worker path failed; using demo fallback', err);
        setSpec(null);
        setDspSource('demo-fallback');
      });
    return () => ac.abort();
  }, [client]);

  const binCount = spec?.binCount ?? FALLBACK_BINS;
  const frameCount = spec?.frameCount ?? FALLBACK_FRAMES;
  const power = spec?.power ?? fallbackPower;
  const freqHz = spec?.freqHz ?? { min: -5e6, max: 5e6 };
  const timeSec = spec?.timeSec ?? { min: 0, max: 1 };

  const colormap: ColormapName = (
    PALETTE_OK.includes(paletteId as ColormapName) ? paletteId : 'viridis'
  ) as ColormapName;

  const levelMax = Math.max(0.2, 1 + level.refLevelDb / 100);
  const levelMin = Math.max(0, levelMax - level.dynamicRangeDb / 100);

  return (
    <div
      className="chart-host chart-host-live"
      data-chart-slot="main"
      data-chart-mode={chartMode}
      data-testid="main-chart-host"
      data-dsp-source={dspSource}
      data-dsp-label={spec?.sourceLabel ?? 'demo fallback'}
    >
      <SpectrumChart
        power={power}
        binCount={binCount}
        frameCount={frameCount}
        mode={chartMode}
        colormap={colormap}
        levels={{ min: levelMin, max: levelMax }}
        freqHz={freqHz}
        timeSec={timeSec}
        height="100%"
        testId="chart-main"
        onCursor={({ xValue, yValue }) => {
          const timeLabel =
            chartMode === 'stft'
              ? xValue.toFixed(3) + ' s'
              : yValue.toFixed(3) + ' s';
          const freqLabel =
            chartMode === 'stft'
              ? (yValue / 1e6).toFixed(3) + ' MHz'
              : (xValue / 1e6).toFixed(3) + ' MHz';
          setStatusCursor(timeLabel, freqLabel);
        }}
      />
    </div>
  );
}
