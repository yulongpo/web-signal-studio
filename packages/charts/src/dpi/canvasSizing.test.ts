import { describe, expect, it, vi } from "vitest";
import {
  applyCanvasDpr,
  attachCanvasResize,
  needsCanvasResize,
  resolveDevicePixelRatio,
  sizeCanvasForDpr,
} from "./canvasSizing.js";

describe("sizeCanvasForDpr", () => {
  it("scales by devicePixelRatio", () => {
    const s = sizeCanvasForDpr({ cssWidth: 100, cssHeight: 50, devicePixelRatio: 2 });
    expect(s.bufferWidth).toBe(200);
    expect(s.bufferHeight).toBe(100);
    expect(s.clamped).toBe(false);
  });

  it("clamps to maxDimension", () => {
    const s = sizeCanvasForDpr({
      cssWidth: 5000,
      cssHeight: 5000,
      devicePixelRatio: 3,
      maxDimension: 4096,
    });
    expect(Math.max(s.bufferWidth, s.bufferHeight)).toBeLessThanOrEqual(4096);
    expect(s.clamped).toBe(true);
  });

  it("handles fractional dpr and zero css", () => {
    const s = sizeCanvasForDpr({ cssWidth: 10.4, cssHeight: 0, devicePixelRatio: 1.5 });
    expect(s.bufferWidth).toBe(Math.round(10.4 * 1.5));
    expect(s.bufferHeight).toBe(1);
  });
});

describe("resolveDevicePixelRatio", () => {
  it("rejects non-finite / non-positive", () => {
    expect(resolveDevicePixelRatio(0)).toBe(1);
    expect(resolveDevicePixelRatio(-2)).toBe(1);
    expect(resolveDevicePixelRatio(Number.NaN)).toBe(1);
  });
});

describe("applyCanvasDpr / needsCanvasResize", () => {
  it("updates buffer only when needed", () => {
    const canvas = {
      width: 0,
      height: 0,
      style: { width: "", height: "" },
    } as unknown as HTMLCanvasElement;
    const size = applyCanvasDpr(canvas, {
      cssWidth: 80,
      cssHeight: 40,
      devicePixelRatio: 2,
    });
    expect(canvas.width).toBe(160);
    expect(canvas.height).toBe(80);
    expect(needsCanvasResize(canvas, size)).toBe(false);
    expect(canvas.style.width).toBe("80px");
  });
});

describe("attachCanvasResize", () => {
  it("runs initial resize and disconnects observer", () => {
    const observed: Element[] = [];
    class FakeRO {
      cb: ResizeObserverCallback;
      constructor(cb: ResizeObserverCallback) {
        this.cb = cb;
      }
      observe(el: Element) {
        observed.push(el);
      }
      disconnect() {
        observed.length = 0;
      }
      unobserve() {}
    }
    const parent = {
      clientWidth: 120,
      clientHeight: 60,
    } as unknown as HTMLElement;
    const canvas = {
      width: 0,
      height: 0,
      clientWidth: 120,
      clientHeight: 60,
      parentElement: parent,
      style: { width: "", height: "" },
    } as unknown as HTMLCanvasElement;
    const onResize = vi.fn();
    const handle = attachCanvasResize({
      canvas,
      container: parent,
      devicePixelRatio: 2,
      onResize,
      ResizeObserverImpl: FakeRO as unknown as typeof ResizeObserver,
    });
    expect(onResize).toHaveBeenCalledTimes(1);
    expect(handle.getSize()?.bufferWidth).toBe(240);
    expect(observed.length).toBe(1);
    handle.disconnect();
    expect(observed.length).toBe(0);
  });
});
