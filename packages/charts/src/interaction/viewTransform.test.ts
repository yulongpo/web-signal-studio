import { describe, expect, it } from "vitest";
import {
  panDomain,
  zoomDomain,
  panView,
  zoomViewAt,
  wheelDeltaToZoomFactor,
  clampZoomSpan,
  domainsEqual,
  viewFromPhysicalBox,
  BOX_ZOOM_MIN_DIAGONAL_PX,
  BOX_ZOOM_MIN_EDGE_PX,
  isBoxZoomLargeEnough,
  boxDiagonalPx,
} from "./viewTransform.js";

describe("viewTransform", () => {
  const xSpan = { pixelMin: 52, pixelMax: 452 }; // 400px plot
  const ySpan = { pixelMin: 10, pixelMax: 210 }; // 200px plot

  it("panDomain shifts by pixel delta (drag right decreases domain)", () => {
    const d = { min: 0, max: 10, unit: "s", label: "Time" };
    // drag +100px over 400px → shift -2.5
    const next = panDomain(d, 100, xSpan);
    expect(next.min).toBeCloseTo(-2.5, 10);
    expect(next.max).toBeCloseTo(7.5, 10);
    expect(next.unit).toBe("s");
  });

  it("zoomDomain keeps anchor value fixed", () => {
    const d = { min: 0, max: 10 };
    const midPx = (xSpan.pixelMin + xSpan.pixelMax) / 2;
    const next = zoomDomain(d, midPx, 2, xSpan);
    expect(next.max - next.min).toBeCloseTo(5, 10);
    // mid value 5 stays at mid pixel
    const t = (midPx - xSpan.pixelMin) / (xSpan.pixelMax - xSpan.pixelMin);
    const anchor = next.min + t * (next.max - next.min);
    expect(anchor).toBeCloseTo(5, 10);
  });

  it("zoom out expands span", () => {
    const d = { min: -5, max: 5 };
    const next = zoomDomain(d, xSpan.pixelMin, 0.5, xSpan);
    expect(next.max - next.min).toBeCloseTo(20, 10);
  });

  it("panView + zoomViewAt compose without touching labels", () => {
    const view = {
      xDomain: { min: 0, max: 1, unit: "s", label: "Time" },
      yDomain: { min: -0.5, max: 0.5, unit: "Hz", label: "Frequency" },
    };
    const panned = panView(view, 40, -20, xSpan, ySpan);
    expect(panned.xDomain.label).toBe("Time");
    expect(panned.yDomain.unit).toBe("Hz");
    const zoomed = zoomViewAt(panned, 200, 100, 1.1, xSpan, ySpan);
    expect(zoomed.xDomain.max - zoomed.xDomain.min).toBeLessThan(
      panned.xDomain.max - panned.xDomain.min,
    );
  });

  it("viewFromPhysicalBox replaces both domains and rejects empty boxes", () => {
    const view = {
      xDomain: { min: 0, max: 10, unit: "s", label: "Time" },
      yDomain: { min: -5, max: 5, unit: "Hz", label: "Frequency" },
    };
    const next = viewFromPhysicalBox(view, { xMin: 2, xMax: 4, yMin: 1, yMax: -1 });
    expect(next?.xDomain).toMatchObject({ min: 2, max: 4, unit: "s", label: "Time" });
    expect(next?.yDomain).toMatchObject({ min: -1, max: 1, unit: "Hz" });
    expect(viewFromPhysicalBox(view, { xMin: 1, xMax: 1, yMin: 0, yMax: 1 })).toBeNull();
    expect(boxDiagonalPx(6, 8)).toBe(10);
    expect(BOX_ZOOM_MIN_DIAGONAL_PX).toBe(8);
    expect(BOX_ZOOM_MIN_EDGE_PX).toBe(8);
    // Desktop ZoomBox: both edges >= 8 (a 20x4 drag must NOT zoom).
    expect(isBoxZoomLargeEnough(20, 4)).toBe(false);
    expect(isBoxZoomLargeEnough(8, 8)).toBe(true);
    expect(isBoxZoomLargeEnough(7.9, 100)).toBe(false);
  });

  it("zoomViewAt can zoom a single axis", () => {
    const view = {
      xDomain: { min: 0, max: 10, label: "Time" },
      yDomain: { min: 0, max: 10, label: "Frequency" },
    };
    const next = zoomViewAt(
      view,
      200,
      100,
      2,
      xSpan,
      ySpan,
      undefined,
      { x: true, y: false },
    );
    expect(next.yDomain).toEqual(view.yDomain);
    expect(next.xDomain.max - next.xDomain.min).toBeLessThan(10);
    expect(next.xDomain.label).toBe("Time");
  });

  it("wheelDeltaToZoomFactor: up zooms in", () => {
    expect(wheelDeltaToZoomFactor(-100, 1.25)).toBe(1.25);
    expect(wheelDeltaToZoomFactor(100, 1.25)).toBeCloseTo(0.8, 10);
    expect(wheelDeltaToZoomFactor(0)).toBe(1);
  });

  it("clampZoomSpan enforces bounds", () => {
    expect(clampZoomSpan(0, { minSpan: 1e-6 })).toBe(1e-6);
    expect(clampZoomSpan(100, { maxSpan: 10 })).toBe(10);
  });

  it("domainsEqual", () => {
    expect(domainsEqual({ min: 0, max: 1 }, { min: 0, max: 1 })).toBe(true);
    expect(domainsEqual({ min: 0, max: 1 }, { min: 0, max: 1.1 })).toBe(false);
  });
});
