import { useMemo, type CSSProperties } from "react";
import { HeatmapCanvas, type HeatmapCanvasProps } from "./HeatmapCanvas.js";
import type { HeatmapOrientation } from "../webgl/heatmapRenderer.js";

export interface SpectrumChartProps
  extends Omit<
    HeatmapCanvasProps,
    "orientation" | "xDomain" | "yDomain" | "widthBins" | "heightBins" | "scalar"
  > {
  /** STFT/waterfall linear or dB power, row-major frames*bins or time*freq. */
  power: Float32Array;
  /** Number of frequency bins. */
  binCount: number;
  /** Number of time frames (rows). */
  frameCount: number;
  /** stft: X=time Y=freq; waterfall: X=freq Y=time. */
  mode?: HeatmapOrientation;
  freqHz?: { min: number; max: number };
  timeSec?: { min: number; max: number };
  className?: string;
  style?: CSSProperties;
  /**
   * Inherited from HeatmapCanvas (passed through unchanged):
   * - `interactionEnabled?: boolean` — pan (drag) + zoom (wheel); default true.
   * - `wheelModel?: 'uniform' | 'desktop-axis'` — uniform zooms both axes;
   *   desktop-axis matches Qt: plot/bottom wheel zooms X, left-axis wheel zooms Y.
   * - `gesture?: 'pan' | 'box' | 'zoom-box'` — plot-body box/zoom-box; with desktop-axis, pan is axis-only (no plot-body pan).
   * - `viewCommand?: { seq, view }` — apply an external physical view (nav / fit).
   * - `onViewChange?: (view) => void` — physical x/y domains only (no detection coords).
   * - `onCursor` — existing MainChartHost readout; unchanged.
   */
}

/**
 * Embeddable spectrum / waterfall chart for Bot-B.
 * Maps physical freq/time domains onto HeatmapCanvas.
 * Supports pointer pan + wheel zoom via HeatmapCanvas when interactionEnabled (default true).
 */
export function SpectrumChart(props: SpectrumChartProps) {
  const {
    power,
    binCount,
    frameCount,
    mode = "stft",
    freqHz = { min: -0.5, max: 0.5 },
    timeSec = { min: 0, max: 1 },
    ...rest
  } = props;

  const domains = useMemo(() => {
    if (mode === "waterfall") {
      return {
        xDomain: {
          min: freqHz.min,
          max: freqHz.max,
          unit: "Hz",
          label: "Frequency",
        },
        yDomain: {
          min: timeSec.min,
          max: timeSec.max,
          unit: "s",
          label: "Time",
        },
        widthBins: binCount,
        heightBins: frameCount,
      };
    }
    return {
      xDomain: {
        min: timeSec.min,
        max: timeSec.max,
        unit: "s",
        label: "Time",
      },
      yDomain: {
        min: freqHz.min,
        max: freqHz.max,
        unit: "Hz",
        label: "Frequency",
      },
      widthBins: frameCount,
      heightBins: binCount,
    };
  }, [mode, freqHz.min, freqHz.max, timeSec.min, timeSec.max, binCount, frameCount]);

  return (
    <HeatmapCanvas
      scalar={power}
      orientation={mode}
      widthBins={domains.widthBins}
      heightBins={domains.heightBins}
      xDomain={domains.xDomain}
      yDomain={domains.yDomain}
      testId={rest.testId ?? "spectrum-chart"}
      {...rest}
    />
  );
}
