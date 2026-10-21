import { describe, expect, it } from "vitest";
import {
  assertDisplayOnlyExtract,
  extractDisplayGrid,
  extractViewportTile,
  FORBIDDEN_DISPLAY_EXTRACT_KEYS,
  suggestExtractOutSize,
} from "./displayExtract.js";

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
    expect(r.displayOnly).toBe(true);
    expect(Math.max(...r.data)).toBe(10);
    expect(r.extractMs).toBeGreaterThanOrEqual(0);
    assertDisplayOnlyExtract(r);
    for (const key of FORBIDDEN_DISPLAY_EXTRACT_KEYS) {
      expect(r).not.toHaveProperty(key);
    }
  });

  it("mean and nearest reduce modes", () => {
    const source = new Float32Array([1, 3, 5, 7]);
    const mean = extractDisplayGrid({
      source,
      sourceWidth: 2,
      sourceHeight: 2,
      srcX: 0,
      srcY: 0,
      srcW: 2,
      srcH: 2,
      outW: 1,
      outH: 1,
      reduce: "mean",
    });
    expect(mean.data[0]).toBe(4);
    const nearest = extractDisplayGrid({
      source,
      sourceWidth: 2,
      sourceHeight: 2,
      srcX: 0,
      srcY: 0,
      srcW: 2,
      srcH: 2,
      outW: 1,
      outH: 1,
      reduce: "nearest",
    });
    expect(Number.isFinite(nearest.data[0]!)).toBe(true);
    expect([1, 3, 5, 7]).toContain(nearest.data[0]);
  });

  it("clamps partial windows to source bounds", () => {
    const source = new Float32Array(9);
    source[8] = 42;
    const r = extractDisplayGrid({
      source,
      sourceWidth: 3,
      sourceHeight: 3,
      srcX: 1,
      srcY: 1,
      srcW: 10,
      srcH: 10,
      outW: 2,
      outH: 2,
      reduce: "peak",
    });
    expect(r.sourceWindow.x).toBe(1);
    expect(r.sourceWindow.y).toBe(1);
    expect(r.sourceWindow.w).toBe(2);
    expect(r.sourceWindow.h).toBe(2);
    expect(Math.max(...r.data)).toBe(42);
  });
});

describe("extractViewportTile", () => {
  it("maps CSS viewport to source pixels without Hz/marker fields", () => {
    const source = new Float32Array(100);
    source[55] = 9; // y=5 x=5 in 10x10
    const r = extractViewportTile({
      source,
      sourceWidth: 10,
      sourceHeight: 10,
      plotCssWidth: 200,
      plotCssHeight: 100,
      viewCssX: 100,
      viewCssY: 50,
      viewCssW: 40,
      viewCssH: 20,
      outW: 4,
      outH: 2,
      reduce: "peak",
    });
    expect(r.displayOnly).toBe(true);
    expect(r.sourceWindow.x).toBeGreaterThanOrEqual(4);
    expect(r.sourceWindow.y).toBeGreaterThanOrEqual(4);
    assertDisplayOnlyExtract(r);
    expect(Object.keys(r).sort()).toEqual(
      ["data", "displayOnly", "extractMs", "height", "reduce", "sourceWindow", "width"].sort(),
    );
  });
});

describe("suggestExtractOutSize", () => {
  it("preview is coarser than refine", () => {
    const preview = suggestExtractOutSize({
      sourceWidth: 1024,
      sourceHeight: 512,
      plotCssWidth: 400,
      plotCssHeight: 200,
      mode: "preview",
    });
    const refine = suggestExtractOutSize({
      sourceWidth: 1024,
      sourceHeight: 512,
      plotCssWidth: 400,
      plotCssHeight: 200,
      mode: "refine",
    });
    expect(preview.outW).toBeLessThan(refine.outW);
    expect(preview.outH).toBeLessThan(refine.outH);
  });
});
