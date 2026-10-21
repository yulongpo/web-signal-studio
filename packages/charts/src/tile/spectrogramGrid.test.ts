import { describe, expect, it } from "vitest";
import {
  assertDisplayOnlyExtract,
  FORBIDDEN_DISPLAY_EXTRACT_KEYS,
} from "./displayExtract.js";
import {
  createSpectrogramTileSource,
  physicalRangeToSourceWindow,
  SpectrogramRingBuffer,
  viewToSourceWindow,
} from "./spectrogramGrid.js";

describe("physicalRangeToSourceWindow", () => {
  it("maps half-band view to half source span", () => {
    const win = physicalRangeToSourceWindow(0, 100, 25, 75, 200);
    expect(win.start).toBeCloseTo(50, 5);
    expect(win.span).toBeCloseTo(100, 5);
  });
});

describe("createSpectrogramTileSource", () => {
  it("crops by physical view then downsamples; displayOnly", () => {
    const binCount = 16;
    const frameCount = 16;
    const power = new Float32Array(binCount * frameCount);
    power[8 * frameCount + 4] = 42;
    const src = createSpectrogramTileSource({
      power,
      frameCount,
      binCount,
      freqHz: { min: 0, max: 1600 },
      timeSec: { min: 0, max: 16 },
      orientation: "stft",
    });
    const tile = src.extractTile({
      view: {
        xDomain: { min: 3.5, max: 5.5, unit: "s" },
        yDomain: { min: 700, max: 900, unit: "Hz" },
      },
      outW: 4,
      outH: 4,
      mode: "refine",
      reduce: "peak",
    });
    expect(tile.displayOnly).toBe(true);
    assertDisplayOnlyExtract(tile);
    expect(Math.max(...tile.data)).toBe(42);
    expect(tile.sourceWindow.w).toBeGreaterThan(0);
    expect(tile.sourceWindow.h).toBeGreaterThan(0);
    for (const key of FORBIDDEN_DISPLAY_EXTRACT_KEYS) {
      expect(tile).not.toHaveProperty(key);
    }
  });

  it("viewToSourceWindow for waterfall uses freq on X", () => {
    const win = viewToSourceWindow(
      {
        frameCount: 100,
        binCount: 50,
        extent: { freqHz: { min: 0, max: 50 }, timeSec: { min: 0, max: 10 } },
        orientation: "waterfall",
      },
      { xDomain: { min: 10, max: 30 }, yDomain: { min: 2, max: 4 } },
    );
    expect(win.sourceWidth).toBe(50);
    expect(win.sourceHeight).toBe(100);
    expect(win.srcX).toBeCloseTo(10, 5);
    expect(win.srcW).toBeCloseTo(20, 5);
    expect(win.srcY).toBeCloseTo(20, 5);
    expect(win.srcH).toBeCloseTo(20, 5);
  });
});

describe("SpectrogramRingBuffer", () => {
  it("appends without reallocating storage; drops oldest when full", () => {
    const ring = new SpectrogramRingBuffer(3, 2);
    const storageBefore = (ring as unknown as { storage: Float32Array }).storage;
    ring.appendFrame(new Float32Array([1, 1]));
    ring.appendFrame(new Float32Array([2, 2]));
    ring.appendFrame(new Float32Array([3, 3]));
    ring.appendFrame(new Float32Array([4, 4]));
    expect(ring.getFrameCount()).toBe(3);
    const { power, frameCount } = ring.toContiguous();
    expect(frameCount).toBe(3);
    expect([...power]).toEqual([2, 2, 3, 3, 4, 4]);
    const storageAfter = (ring as unknown as { storage: Float32Array }).storage;
    expect(storageAfter).toBe(storageBefore);
  });

  it("tile source ring appendFrame updates frame count", () => {
    const src = createSpectrogramTileSource({
      frameCount: 0,
      binCount: 4,
      freqHz: { min: -1, max: 1 },
      timeSec: { min: 0, max: 1 },
      orientation: "waterfall",
      ringCapacity: 8,
    });
    expect(src.appendFrame).toBeTypeOf("function");
    src.appendFrame!(new Float32Array([0.1, 0.2, 0.3, 0.4]));
    src.appendFrame!(new Float32Array([0.5, 0.6, 0.7, 0.8]));
    expect(src.getFrameCount()).toBe(2);
    const tile = src.extractTile({
      view: { xDomain: { min: -1, max: 1 }, yDomain: { min: 0, max: 1 } },
      outW: 4,
      outH: 2,
      mode: "preview",
    });
    expect(tile.displayOnly).toBe(true);
    assertDisplayOnlyExtract(tile);
  });
});
