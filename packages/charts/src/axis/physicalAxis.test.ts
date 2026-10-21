import { describe, expect, it } from "vitest";
import { PhysicalAxis } from "./physicalAxis.js";

describe("PhysicalAxis", () => {
  it("maps domain to pixels linearly (horizontal)", () => {
    const axis = new PhysicalAxis({
      orientation: "horizontal",
      domain: { min: -5, max: 5 },
      pixelMin: 100,
      pixelMax: 300,
    });
    expect(axis.toPixel(0)).toBeCloseTo(200, 6);
    expect(axis.toPixel(-5)).toBeCloseTo(100, 6);
    expect(axis.toPixel(5)).toBeCloseTo(300, 6);
    expect(axis.toValue(200)).toBeCloseTo(0, 6);
  });

  it("supports inverted vertical pixels (STFT Y grows up)", () => {
    const axis = new PhysicalAxis({
      orientation: "vertical",
      domain: { min: 0, max: 100 },
      pixelMin: 10,
      pixelMax: 110,
      invertPixel: true,
    });
    expect(axis.toPixel(0)).toBeCloseTo(110, 6);
    expect(axis.toPixel(100)).toBeCloseTo(10, 6);
    expect(axis.toValue(10)).toBeCloseTo(100, 6);
  });

  it("produces ticks inside domain", () => {
    const axis = new PhysicalAxis({
      orientation: "horizontal",
      domain: { min: 0, max: 10 },
      pixelMin: 0,
      pixelMax: 100,
    });
    const ticks = axis.ticks(5);
    expect(ticks.length).toBeGreaterThan(1);
    expect(ticks[0]!).toBeGreaterThanOrEqual(0);
    expect(ticks[ticks.length - 1]!).toBeLessThanOrEqual(10);
  });
});
