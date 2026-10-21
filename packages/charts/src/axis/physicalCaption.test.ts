import { describe, expect, it } from "vitest";
import {
  displayUnit,
  formatPhysicalCaptionPair,
  formatPhysicalRange,
} from "./physicalCaption.js";

describe("physicalCaption (G02 desktop-aligned)", () => {
  it("scales frequency spans like desktop displayUnit", () => {
    expect(displayUnit("frequency", 5e6)).toEqual({ name: "MHz", scale: 1e-6 });
    expect(displayUnit("frequency", 50e3)).toEqual({ name: "kHz", scale: 1e-3 });
    expect(displayUnit("frequency", 800)).toEqual({ name: "Hz", scale: 1 });
  });

  it("scales time spans like desktop displayUnit", () => {
    expect(displayUnit("time", 2)).toEqual({ name: "s", scale: 1 });
    expect(displayUnit("time", 0.05)).toEqual({ name: "ms", scale: 1e3 });
    expect(displayUnit("time", 5e-5)).toEqual({ name: "us", scale: 1e6 });
  });

  it("formats a MHz frequency range with zh title", () => {
    const r = formatPhysicalRange(1e6, 2e6, { unit: "Hz", label: "Frequency" });
    expect(r.kind).toBe("frequency");
    expect(r.title).toBe("频率");
    expect(r.unitName).toBe("MHz");
    expect(r.text).toContain("频率 (MHz)");
    expect(r.text).toContain("\u2013");
  });

  it("formats a short time window in ms", () => {
    const r = formatPhysicalRange(0.01, 0.04, { unit: "s", label: "Time" });
    expect(r.kind).toBe("time");
    expect(r.title).toBe("时间");
    expect(r.unitName).toBe("ms");
    expect(r.text).toContain("时间 (ms)");
  });

  it("joins X/Y caption pair", () => {
    const pair = formatPhysicalCaptionPair(
      { min: 0, max: 1, unit: "s", label: "Time" },
      { min: 1e6, max: 2e6, unit: "Hz", label: "Frequency" },
    );
    expect(pair.text).toContain(" | ");
    expect(pair.x.unitName).toBe("s");
    expect(pair.y.unitName).toBe("MHz");
  });
});
