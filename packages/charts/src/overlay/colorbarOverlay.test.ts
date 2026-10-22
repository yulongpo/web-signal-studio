import { describe, expect, it, vi } from "vitest";
import { ColorbarOverlay, colorScaleTickLabels } from "./colorbarOverlay.js";
import { HEATMAP_COLORBAR } from "../react/plotMargin.js";

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
  it("draws LUT strip in the right gutter and dB ticks from reference/dynamicRange", () => {
    const { ctx, calls } = mockCtx();
    const overlay = new ColorbarOverlay();
    overlay.draw({
      ctx,
      width: 400,
      height: 200,
      margin: { left: 52, right: 48, top: 10, bottom: 36 },
      colormap: "viridis",
      levelsDb: { referenceLevelDb: -20, dynamicRangeDb: 70 },
      tickCount: 5,
    });
    const fillTexts = calls.filter((c) => c.op === "fillText");
    expect(fillTexts.length).toBeGreaterThanOrEqual(5);
    // top tick = referenceLevelDb
    expect(fillTexts[0]?.args[0]).toBe("-20");
    // bottom tick = ref - dynamicRange
    expect(fillTexts[4]?.args[0]).toBe("-90");
    const left = 400 - HEATMAP_COLORBAR.stripOffsetFromRight;
    const stroke = calls.find((c) => c.op === "strokeRect");
    expect(stroke?.args[0]).toBe(left + 0.5);
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
