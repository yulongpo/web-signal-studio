/**
 * PROVISIONAL - Bot-B main chart host.
 * Embeds @wss/charts SpectrumChart (HeatmapCanvas + AxisOverlay + CursorOverlay).
 */
import { useMemo } from 'react';
import { SpectrumChart } from '@wss/charts/SpectrumChart';
import type { ColormapName } from '@wss/charts/lut/colormaps';
import { useUiStore } from '../store/uiStore';

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

export function MainChartHost() {
  const chartMode = useUiStore((s) => s.chartMode);
  const paletteId = useUiStore((s) => s.paletteId);
  const level = useUiStore((s) => s.level);
  const setStatusCursor = useUiStore((s) => s.setStatusCursor);

  const binCount = 256;
  const frameCount = 128;
  const power = useMemo(() => synthPower(binCount, frameCount), []);

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
    >
      <SpectrumChart
        power={power}
        binCount={binCount}
        frameCount={frameCount}
        mode={chartMode}
        colormap={colormap}
        levels={{ min: levelMin, max: levelMax }}
        freqHz={{ min: -5e6, max: 5e6 }}
        timeSec={{ min: 0, max: 1 }}
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
