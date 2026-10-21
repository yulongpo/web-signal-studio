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
import type { IqFileFormat } from '../dsp/iqFileSession';
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
  sampleRateHz: number;
};

function chipLabelFor(kind: DspSourceKind, format?: IqFileFormat | null): string {
  switch (kind) {
    case 'synthetic-stft-worker':
      return 'DSP: STFT worker (synthetic)';
    case 'file-stft-worker':
      return format ? 'DSP: file STFT (' + format + ')' : 'DSP: file STFT';
    case 'fsa-wav-stft':
      return format ? 'DSP: FSA STFT (' + format + ')' : 'DSP: FSA WAV STFT';
    case 'demo-fallback':
      return 'DSP: demo fallback';
    default:
      return 'DSP: loading…';
  }
}

function kindForVia(via: 'fsa' | 'input'): DspSourceKind {
  return via === 'fsa' ? 'fsa-wav-stft' : 'file-stft-worker';
}

/** Map a chart time to a decimal sample index. Refuses non-safe integers. */
function secondsToSampleIndex(sec: number, sampleRateHz: number): string | null {
  if (!(sampleRateHz > 0) || !Number.isFinite(sec)) return null;
  const n = Math.round(sec * sampleRateHz);
  if (!Number.isSafeInteger(n) || n < 0) return null;
  return String(n);
}

function halfOpenEnd(start: string, end: string): string | null {
  try {
    const a = BigInt(start);
    let b = BigInt(end);
    if (b <= a) b = a + 1n;
    if (b > BigInt(Number.MAX_SAFE_INTEGER)) return null;
    return b.toString();
  } catch {
    return null;
  }
}

export function MainChartHost() {
  const chartMode = useUiStore((s) => s.chartMode);
  const paletteId = useUiStore((s) => s.paletteId);
  const level = useUiStore((s) => s.level);
  const setStatusCursor = useUiStore((s) => s.setStatusCursor);
  const setDspSourceStore = useUiStore((s) => s.setDspSource);
  const setStatusFileLabel = useUiStore((s) => s.setStatusFileLabel);
  const fftActive = useUiStore((s) => s.dspFftEngineActive);
  const navWindowTime = useUiStore((s) => s.navWindowTime);
  const setNavFullTime = useUiStore((s) => s.setNavFullTime);
  const setNavWindowTime = useUiStore((s) => s.setNavWindowTime);
  const setSpectrogramDisplay = useUiStore((s) => s.setSpectrogramDisplay);
  const activeTool = useUiStore((s) => s.activeTool);
  const setActiveTool = useUiStore((s) => s.setActiveTool);
  const setDetectSampleRange = useUiStore((s) => s.setDetectSampleRange);
  const setRightPage = useUiStore((s) => s.setRightPage);
  const client = useDspWorkerClient();
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [roi, setRoi] = useState<{ start: string; end: string } | null>(null);
  const [markNote, setMarkNote] = useState<string | null>(null);

  const iqEpoch = useSyncExternalStore(
    subscribeIqFileSession,
    getIqFileEpoch,
    getIqFileEpoch,
  );

  const [spec, setSpec] = useState<ChartSpec | null>(null);
  const [dspSource, setDspSource] = useState<DspSourceKind>('loading');
  const [iqFormat, setIqFormat] = useState<IqFileFormat | null>(null);

  const fallbackPower = useMemo(
    () => synthPower(FALLBACK_BINS, FALLBACK_FRAMES),
    [],
  );

  useEffect(() => {
    if (!client) return;
    const ac = new AbortController();
    setDspSource('loading');
    setDspSourceStore('loading');
    setIqFormat(null);

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
          sampleRateHz: result.sampleRateHz,
        });
        setDspSource(kind);
        setDspSourceStore(kind);
        setIqFormat(session.format);
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
      setIqFormat(null);
      setStatusFileLabel('No file (synthetic fixture)');
    };

    void run().catch((err: unknown) => {
      if (ac.signal.aborted) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      console.warn('[MainChartHost] STFT path failed; using demo fallback', err);
      setSpec(null);
      setDspSource('demo-fallback');
      setDspSourceStore('demo-fallback');
      setIqFormat(null);
    });

    return () => ac.abort();
  }, [client, iqEpoch, setDspSourceStore, setStatusFileLabel]);

  const binCount = spec?.binCount ?? FALLBACK_BINS;
  const frameCount = spec?.frameCount ?? FALLBACK_FRAMES;
  const power = spec?.power ?? fallbackPower;
  const freqHz = spec?.freqHz ?? { min: -5e6, max: 5e6 };
  const timeSec = spec?.timeSec ?? { min: 0, max: 1 };

  // G03: keep navigation full extent in sync with main spectrogram time.
  useEffect(() => {
    setNavFullTime({ min: timeSec.min, max: timeSec.max });
    const w = useUiStore.getState().navWindowTime;
    let min = Math.max(timeSec.min, Math.min(w.min, timeSec.max));
    let max = Math.min(timeSec.max, Math.max(w.max, timeSec.min));
    if (!(max > min)) {
      min = timeSec.min;
      max = timeSec.max;
    }
    setNavWindowTime({ min, max }, { recordHistory: false });
  }, [timeSec.min, timeSec.max, setNavFullTime, setNavWindowTime]);

  // G03/G04: publish spectrogram snapshot for nav envelope + aux Wave/PSD derive.
  useEffect(() => {
    setSpectrogramDisplay({
      power,
      binCount,
      frameCount,
      freqHz,
      timeSec,
    });
  }, [power, binCount, frameCount, freqHz.min, freqHz.max, timeSec.min, timeSec.max, setSpectrogramDisplay]);


  const colormap: ColormapName = (
    PALETTE_OK.includes(paletteId as ColormapName) ? paletteId : 'viridis'
  ) as ColormapName;

  const levelMax = Math.max(0.2, 1 + level.refLevelDb / 100);
  const levelMin = Math.max(0, levelMax - level.dynamicRangeDb / 100);
  const sampleRateHz = spec?.sampleRateHz ?? 0;
  const gesture = activeTool === 'marker' || activeTool === 'select' ? 'box' : 'pan';

  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null);
    };
    const onPointer = (e: PointerEvent) => {
      const target = e.target;
      if (target instanceof Element && target.closest('[data-testid="chart-context-menu"]')) return;
      setMenu(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [menu]);

  useEffect(() => {
    if (!roi) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRoi(null);
        setActiveTool('navigate');
      } else if (e.key === 'Enter') {
        setDetectSampleRange(roi);
        setRoi(null);
        setActiveTool('navigate');
        setRightPage('detect');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [roi, setActiveTool, setDetectSampleRange, setRightPage]);

  const onBoxCommit = (box: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  } | null) => {
    if (!box) return;
    const time0 = chartMode === 'stft' ? box.xMin : box.yMin;
    const time1 = chartMode === 'stft' ? box.xMax : box.yMax;
    const freq0 = chartMode === 'stft' ? box.yMin : box.xMin;
    const freq1 = chartMode === 'stft' ? box.yMax : box.xMax;
    const start = secondsToSampleIndex(Math.min(time0, time1), sampleRateHz);
    const endRaw = secondsToSampleIndex(Math.max(time0, time1), sampleRateHz);
    const end = start && endRaw ? halfOpenEnd(start, endRaw) : null;
    if (!start || !end) {
      setMarkNote('无安全采样率映射，不写入标记或 ROI');
      return;
    }
    if (activeTool === 'select') {
      setRoi({ start, end });
      setMarkNote(null);
      return;
    }
    if (activeTool !== 'marker') return;
    const hook = window.__wssM06;
    if (!hook) {
      setMarkNote('标记钩子未安装，未写入');
      return;
    }
    const id = `web-${crypto.randomUUID()}`;
    hook.addManualMark({
      id,
      name: id,
      start,
      end,
      lowerHz: Math.min(freq0, freq1),
      upperHz: Math.max(freq0, freq1),
    });
    setMarkNote(`已写入手动标记 [${start},${end})`);
    setRightPage('marker');
  };

  return (
    <div
      className="chart-host chart-host-live"
      data-chart-slot="main"
      data-chart-mode={chartMode}
      data-testid="main-chart-host"
      data-dsp-source={dspSource}
      data-dsp-label={spec?.sourceLabel ?? 'demo fallback'}
      data-iq-format={iqFormat ?? undefined}
      data-fft-engine={fftActive?.active ?? 'js'}
      data-fft-requested={fftActive?.requested ?? 'js'}
      data-fft-fallback={fftActive?.fellBackToJs ? 'true' : 'false'}
      data-chart-gesture={gesture}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <span
        className="dsp-source-chip"
        data-testid="dsp-source-chip"
        data-dsp-source={dspSource}
        data-iq-format={iqFormat ?? undefined}
        title={spec?.sourceLabel ?? dspSource}
      >
        {chipLabelFor(dspSource, iqFormat)}
      </span>
      <SpectrumChart
        power={power}
        binCount={binCount}
        frameCount={frameCount}
        mode={chartMode}
        colormap={colormap}
        levels={{ min: levelMin, max: levelMax }}
        freqHz={freqHz}
        timeSec={chartMode === 'stft' ? navWindowTime : timeSec}
        height="100%"
        testId="chart-main"
        wheelModel="desktop-axis"
        gesture={gesture}
        onBoxCommit={onBoxCommit}
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
      {roi ? (
        <div className="roi-confirm" data-testid="detection-roi-confirmation" role="status">
          <span>
            ROI [{roi.start}, {roi.end})
          </span>
          <button
            type="button"
            data-testid="confirm-detection-roi"
            onClick={() => {
              setDetectSampleRange(roi);
              setRoi(null);
              setActiveTool('navigate');
              setRightPage('detect');
            }}
          >
            确认 · Enter
          </button>
          <button
            type="button"
            data-testid="cancel-detection-roi"
            onClick={() => {
              setRoi(null);
              setActiveTool('navigate');
            }}
          >
            取消 · Esc
          </button>
        </div>
      ) : null}
      {markNote ? (
        <p className="chart-mark-note" data-testid="chart-mark-note">
          {markNote}
        </p>
      ) : null}
      {menu ? (
        <div
          className="chart-context-menu"
          data-testid="chart-context-menu"
          role="menu"
          style={{ left: menu.x, top: menu.y }}
        >
          <button
            type="button"
            role="menuitem"
            data-testid="chart-menu-navigate"
            onClick={() => {
              setActiveTool('navigate');
              setMenu(null);
            }}
          >
            导航（平移 / 滚轮缩放）
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="chart-menu-mark"
            onClick={() => {
              setActiveTool('marker');
              setMenu(null);
            }}
          >
            持续标记
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="chart-menu-roi"
            onClick={() => {
              setActiveTool('select');
              setMenu(null);
            }}
          >
            检测 ROI
          </button>
        </div>
      ) : null}
    </div>
  );
}
