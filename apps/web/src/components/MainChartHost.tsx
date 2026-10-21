/**
 * PROVISIONAL - Bot-B main chart host + Bot-D real STFT path.
 * Embeds @wss/charts SpectrumChart (HeatmapCanvas + AxisOverlay + CursorOverlay).
 *
 * Power sources (parallel, explicit labels):
 * - Opened IQ WAV via FSA / file input → stftFromChunkedReader (file-stft-worker / fsa-wav-stft)
 * - No file / open failed / FSA unsupported → synthetic two-tone fixture (synthetic-stft-worker)
 * - Worker failure → demo synthPower fallback (never claimed as capture)
 */
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { SpectrumChart } from '@wss/charts/SpectrumChart';
import type { ColormapName } from '@wss/charts/lut/colormaps';
import { useUiStore } from '../store/uiStore';
import { useDspWorkerClient } from '../dsp/useDspWorkerClient';
import {
  computeMainSpectrogram,
  type MainSpectrogramResult,
} from '../dsp/computeMainSpectrogram';
import { computeFileSpectrogram } from '../dsp/computeFileSpectrogram';
import {
  getIqFileEpoch,
  getIqFileSession,
  subscribeIqFileSession,
} from '../dsp/iqFileSession';
import type { DspSourceKind } from '../types/provisional';

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

type ChartSpec = {
  power: Float32Array;
  binCount: number;
  frameCount: number;
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
  sourceLabel: string;
};

function chipLabelFor(kind: DspSourceKind): string {
  switch (kind) {
    case 'synthetic-stft-worker':
      return 'DSP: STFT worker (synthetic)';
    case 'file-stft-worker':
      return 'DSP: file STFT';
    case 'fsa-wav-stft':
      return 'DSP: FSA WAV STFT';
    case 'demo-fallback':
      return 'DSP: demo fallback';
    default:
      return 'DSP: loading…';
  }
}

function kindForVia(via: 'fsa' | 'input'): DspSourceKind {
  return via === 'fsa' ? 'fsa-wav-stft' : 'file-stft-worker';
}

export function MainChartHost() {
  const chartMode = useUiStore((s) => s.chartMode);
  const paletteId = useUiStore((s) => s.paletteId);
  const level = useUiStore((s) => s.level);
  const setStatusCursor = useUiStore((s) => s.setStatusCursor);
  const setDspSourceStore = useUiStore((s) => s.setDspSource);
  const setStatusFileLabel = useUiStore((s) => s.setStatusFileLabel);
  const client = useDspWorkerClient();

  const iqEpoch = useSyncExternalStore(
    subscribeIqFileSession,
    getIqFileEpoch,
    getIqFileEpoch,
  );

  const [spec, setSpec] = useState<ChartSpec | null>(null);
  const [dspSource, setDspSource] = useState<DspSourceKind>('loading');

  const fallbackPower = useMemo(
    () => synthPower(FALLBACK_BINS, FALLBACK_FRAMES),
    [],
  );

  useEffect(() => {
    if (!client) return;
    const ac = new AbortController();
    setDspSource('loading');
    setDspSourceStore('loading');

    const session = getIqFileSession();

    const run = async () => {
      if (session) {
        const result = await computeFileSpectrogram({
          reader: session.reader,
          client,
          sampleRateHz: session.sampleRateHz,
          sourceLabel: session.sourceLabel,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        const kind = kindForVia(session.via);
        setSpec({
          power: result.power,
          binCount: result.binCount,
          frameCount: result.frameCount,
          freqHz: result.freqHz,
          timeSec: result.timeSec,
          sourceLabel: result.sourceLabel,
        });
        setDspSource(kind);
        setDspSourceStore(kind);
        setStatusFileLabel(session.fileName);
        return;
      }

      const result: MainSpectrogramResult = await computeMainSpectrogram({
        client,
        signal: ac.signal,
      });
      if (ac.signal.aborted) return;
      setSpec(result);
      setDspSource('synthetic-stft-worker');
      setDspSourceStore('synthetic-stft-worker');
      setStatusFileLabel('No file (synthetic fixture)');
    };

    void run().catch((err: unknown) => {
      if (ac.signal.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('[MainChartHost] STFT path failed; using demo fallback', err);
      setSpec(null);
      setDspSource('demo-fallback');
      setDspSourceStore('demo-fallback');
    });

    return () => ac.abort();
  }, [client, iqEpoch, setDspSourceStore, setStatusFileLabel]);

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
      <span
        className="dsp-source-chip"
        data-testid="dsp-source-chip"
        data-dsp-source={dspSource}
        title={spec?.sourceLabel ?? dspSource}
      >
        {chipLabelFor(dspSource)}
      </span>
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
