import { describe, expect, it } from "vitest";
import { sizeCanvasForDpr } from "./canvasSizing.js";

describe("sizeCanvasForDpr", () => {
  it("scales by devicePixelRatio", () => {
    const s = sizeCanvasForDpr({ cssWidth: 100, cssHeight: 50, devicePixelRatio: 2 });
    expect(s.bufferWidth).toBe(200);
    expect(s.bufferHeight).toBe(100);
  });

  it("clamps to maxDimension", () => {
    const s = sizeCanvasForDpr({
      cssWidth: 5000,
      cssHeight: 5000,
      devicePixelRatio: 3,
      maxDimension: 4096,
    });
    expect(Math.max(s.bufferWidth, s.bufferHeight)).toBeLessThanOrEqual(4096);
  });
});
