import { useMemo, useState } from "react";
import { HeatmapCanvas } from "./HeatmapCanvas.js";
import { COLORMAPS, type ColormapName } from "../lut/colormaps.js";
import { PerformanceProbeSession } from "../probe/performanceProbe.js";

function synthMatrix(w: number, h: number): Float32Array {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const v = y / h;
      const tone = Math.exp(-((u - 0.35) ** 2) / 0.002) * (0.6 + 0.4 * Math.sin(40 * v));
      const tone2 = Math.exp(-((u - 0.62) ** 2) / 0.0015) * (0.4 + 0.3 * Math.cos(25 * v));
      const noise = 0.05 * Math.random();
      out[y * w + x] = tone + tone2 + noise;
    }
  }
  return out;
}

/** Local verify demo — Bot-B embeds HeatmapCanvas / SpectrumChart instead. */
export function HeatmapDemo() {
  const [cmap, setCmap] = useState<ColormapName>("viridis");
  const [levelMax, setLevelMax] = useState(1);
  const W = 256;
  const H = 128;
  const scalar = useMemo(() => synthMatrix(W, H), []);

  return (
    <div style={{ display: "grid", gap: 8, padding: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <strong>@wss/charts HeatmapDemo</strong>
        <label>
          LUT{" "}
          <select
            value={cmap}
            onChange={(e) => setCmap(e.target.value as ColormapName)}
            data-testid="heatmap-demo-cmap"
          >
            {COLORMAPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          level max{" "}
          <input
            type="range"
            min={0.2}
            max={1.5}
            step={0.05}
            value={levelMax}
            onChange={(e) => setLevelMax(Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          onClick={async () => {
            const session = new PerformanceProbeSession();
            await session.time("demo-paint-noop", async () => {
              await new Promise((r) => requestAnimationFrame(() => r(null)));
            });
            const result = await session.flush({
              repoRoot: undefined,
              fileName: "demo_probe.json",
            });
            console.info("[charts] probe", result);
          }}
        >
          Probe sample
        </button>
      </div>
      <HeatmapCanvas
        scalar={scalar}
        widthBins={W}
        heightBins={H}
        colormap={cmap}
        levels={{ min: 0, max: levelMax }}
        xDomain={{ min: 0, max: 1, unit: "s", label: "Time" }}
        yDomain={{ min: -0.5, max: 0.5, unit: "Hz", label: "Freq" }}
        height={320}
      />
      <p style={{ margin: 0, opacity: 0.7, fontSize: 12 }}>
        Changing LUT / levels does not rewrite the scalar Float32Array (same reference).
      </p>
    </div>
  );
}
