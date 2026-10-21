import { useMemo, useState } from "react";
import { SpectrumChart } from "./SpectrumChart.js";
import type { ColormapName } from "../lut/colormaps.js";
import { COLORMAPS } from "../lut/colormaps.js";

function synthStft(frames: number, bins: number): Float32Array {
  // Stored as frames (X) * bins (Y) for STFT mode widthBins=frames heightBins=bins
  // HeatmapCanvas expects row-major height*width with width=widthBins.
  // For STFT: widthBins=frameCount, heightBins=binCount → row = bin, col = frame
  const out = new Float32Array(frames * bins);
  for (let bin = 0; bin < bins; bin++) {
    for (let frame = 0; frame < frames; frame++) {
      const f = frame / frames;
      const b = bin / bins;
      const chirp = Math.exp(-((b - (0.2 + 0.5 * f)) ** 2) / 0.0012);
      const tone = Math.exp(-((b - 0.7) ** 2) / 0.0008) * (0.5 + 0.5 * Math.sin(20 * f));
      out[bin * frames + frame] = chirp + tone + 0.03 * Math.random();
    }
  }
  return out;
}

/** Richer demo for local verify / Story-like embedding. */
export function SpectrumHeatmapDemo() {
  const [mode, setMode] = useState<"stft" | "waterfall">("stft");
  const [cmap, setCmap] = useState<ColormapName>("inferno");
  const frames = 320;
  const bins = 192;
  const power = useMemo(() => synthStft(frames, bins), []);

  // For waterfall we need freq along X → transpose layout: widthBins=bins heightBins=frames
  const layout = useMemo(() => {
    if (mode === "stft") {
      return { power, binCount: bins, frameCount: frames };
    }
    const transposed = new Float32Array(frames * bins);
    for (let bin = 0; bin < bins; bin++) {
      for (let frame = 0; frame < frames; frame++) {
        // waterfall row=time(frame), col=freq(bin)
        transposed[frame * bins + bin] = power[bin * frames + frame]!;
      }
    }
    return { power: transposed, binCount: bins, frameCount: frames };
  }, [mode, power]);

  return (
    <div style={{ display: "grid", gap: 8, padding: 8 }} data-testid="spectrum-heatmap-demo">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <strong>SpectrumHeatmapDemo</strong>
        <button type="button" data-active={mode === "stft"} onClick={() => setMode("stft")}>
          STFT
        </button>
        <button
          type="button"
          data-active={mode === "waterfall"}
          onClick={() => setMode("waterfall")}
        >
          Waterfall
        </button>
        <select value={cmap} onChange={(e) => setCmap(e.target.value as ColormapName)}>
          {COLORMAPS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <SpectrumChart
        power={layout.power}
        binCount={layout.binCount}
        frameCount={layout.frameCount}
        mode={mode}
        colormap={cmap}
        freqHz={{ min: -5e3, max: 5e3 }}
        timeSec={{ min: 0, max: 2 }}
        height={360}
      />
    </div>
  );
}
