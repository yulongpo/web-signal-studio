import { describe, expect, it, vi } from "vitest";
import { ColorbarOverlay, colorScaleTickLabels } from "./colorbarOverlay.js";
import {
  heatmapPlotMargin,
  stripOffsetForMargin,
} from "../react/plotMargin.js";

function mockCtx() {
  const calls: Array<{ op: string; args: unknown[] }> = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "middle",
    fillRect: (...args: unknown[]) => calls.push({ op: "fillRect", args }),
    strokeRect: (...args: unknown[]) => calls.push({ op: "strokeRect", args }),
    fillText: (...args: unknown[]) => calls.push({ op: "fillText", args }),
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

describe("ColorbarOverlay (desktop colorScale)", () => {
  it("draws LUT strip flush after plot (right=70) with dB ticks", () => {
    const { ctx, calls } = mockCtx();
    const overlay = new ColorbarOverlay();
    const margin = heatmapPlotMargin(true);
    expect(margin.right).toBe(70);
    overlay.draw({
      ctx,
      width: 400,
      height: 200,
      margin,
      colormap: "viridis",
      levelsDb: { referenceLevelDb: -20, dynamicRangeDb: 70 },
      tickCount: 5,
    });
    const fillTexts = calls.filter((c) => c.op === "fillText");
    expect(fillTexts.length).toBeGreaterThanOrEqual(5);
    expect(fillTexts[0]?.args[0]).toBe("-20");
    expect(fillTexts[4]?.args[0]).toBe("-90");
    const left = 400 - stripOffsetForMargin(margin.right);
    const stroke = calls.find((c) => c.op === "strokeRect");
    expect(stroke?.args[0]).toBe(left + 0.5);
    // Flush: strip starts immediately after plot (+ plotGap)
    expect(left).toBe(400 - margin.right + 2);
    void vi;
  });
});

describe("colorScaleTickLabels", () => {
  it("returns top=reference and bottom=ref-dynamicRange labels", () => {
    expect(
      colorScaleTickLabels({ referenceLevelDb: -20, dynamicRangeDb: 70 }, 5),
    ).toEqual(["-20", "-38", "-55", "-73", "-90"]);
  });
});

describe("heatmapPlotMargin", () => {
  it("uses desktop 70/22 for colorScale on/off", () => {
    expect(heatmapPlotMargin(true).right).toBe(70);
    expect(heatmapPlotMargin(false).right).toBe(22);
  });
});
