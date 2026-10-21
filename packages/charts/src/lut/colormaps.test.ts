import { describe, expect, it } from "vitest";
import { buildLutRgba8, mapScalarThroughLut } from "./colormaps.js";

describe("LUT independence", () => {
  it("changing colormap does not mutate scalar buffer", () => {
    const scalar = new Float32Array([0, 0.25, 0.5, 0.75, 1]);
    const copy = scalar.slice();
    const lutA = buildLutRgba8("viridis", 16);
    const lutB = buildLutRgba8("magma", 16);
    const rgbaA = mapScalarThroughLut(scalar, lutA, { min: 0, max: 1 });
    const rgbaB = mapScalarThroughLut(scalar, lutB, { min: 0, max: 1 });
    expect(Array.from(scalar)).toEqual(Array.from(copy));
    expect(rgbaA).not.toEqual(rgbaB);
    expect(lutA).not.toEqual(lutB);
  });

  it("level change remaps without rewriting source", () => {
    const scalar = new Float32Array([0, 1, 2, 3]);
    const before = scalar.slice();
    const lut = buildLutRgba8("gray", 8);
    mapScalarThroughLut(scalar, lut, { min: 0, max: 3 });
    mapScalarThroughLut(scalar, lut, { min: 1, max: 2 });
    expect(Array.from(scalar)).toEqual(Array.from(before));
  });
});
