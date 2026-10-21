import { describe, expect, it } from "vitest";
import { extractDisplayGrid } from "./displayExtract.js";

describe("extractDisplayGrid", () => {
  it("peak-reduces without inventing detection coords", () => {
    const source = new Float32Array(16);
    source[5] = 10; // y=1 x=1 in 4x4
    const r = extractDisplayGrid({
      source,
      sourceWidth: 4,
      sourceHeight: 4,
      srcX: 0,
      srcY: 0,
      srcW: 4,
      srcH: 4,
      outW: 2,
      outH: 2,
      reduce: "peak",
    });
    expect(r.width).toBe(2);
    expect(r.height).toBe(2);
    expect(r.sourceWindow).toEqual({ x: 0, y: 0, w: 4, h: 4 });
    expect(Math.max(...r.data)).toBe(10);
  });
});
