import { describe, expect, it } from "vitest";
import { AxisOverlay, suggestedTickCount } from "./axisOverlay.js";
import { PhysicalAxis } from "../axis/physicalAxis.js";

function mockCtx() {
  const texts: string[] = [];
  const ctx = {
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "",
    textAlign: "left",
    textBaseline: "middle",
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    clearRect() {},
    fillRect() {},
    translate() {},
    rotate() {},
    fillText(t: string) {
      texts.push(t);
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, texts };
}

describe("AxisOverlay physical scaling", () => {
  it("labels STFT axes with desktop-style 频率 (MHz) / 时间 (s) and scaled ticks", () => {
    const { ctx, texts } = mockCtx();
    const overlay = new AxisOverlay();
    const xAxis = new PhysicalAxis({
      orientation: "horizontal",
      domain: { min: 0, max: 1, unit: "s", label: "时间 (s)" },
      pixelMin: 52,
      pixelMax: 352,
    });
    const yAxis = new PhysicalAxis({
      orientation: "vertical",
      domain: { min: 1e6, max: 2e6, unit: "Hz", label: "频率 (Hz)" },
      pixelMin: 10,
      pixelMax: 164,
      invertPixel: true,
    });
    overlay.draw({
      ctx,
      width: 400,
      height: 200,
      margin: { left: 52, right: 48, top: 10, bottom: 36 },
      xAxis,
      yAxis,
    });
    expect(texts.some((t) => t.includes("频率 (MHz)"))).toBe(true);
    expect(texts.some((t) => t.includes("时间 (s)"))).toBe(true);
    // MHz-scaled tick present (1 or 2), not raw 1e6 scientific
    expect(texts.some((t) => t === "1" || t === "1.5" || t === "2")).toBe(true);
    expect(texts.some((t) => /e\+0?6/i.test(t))).toBe(false);
  });
});


describe("suggestedTickCount (4K density)", () => {
  it("densifies for wide 4K plot spans and stays sparse for aux", () => {
    expect(suggestedTickCount(400)).toBeLessThanOrEqual(8);
    expect(suggestedTickCount(2400)).toBeGreaterThanOrEqual(12);
    expect(suggestedTickCount(2400)).toBeLessThanOrEqual(18);
  });
});
