import { describe, expect, it } from "vitest";
import {
  hitChartZone,
  resolvePointerDragMode,
  resolveInteractionCursor,
  resolveNavigationOverviewCursor,
  resolveMarkEdgeCursor,
  resolveMarkBodyHoverCursor,
} from "./chartHitZone.js";

const M = { left: 52, right: 12, top: 10, bottom: 36 };

describe("hitChartZone (desktop 17471a6)", () => {
  const W = 400;
  const H = 300;

  it("classifies plot body", () => {
    expect(hitChartZone(200, 150, W, H, M)).toBe("plot");
    expect(hitChartZone(M.left, M.top, W, H, M)).toBe("plot");
  });

  it("classifies x-axis below plot only within x-span", () => {
    expect(hitChartZone(200, H - 10, W, H, M)).toBe("x-axis");
    expect(hitChartZone(M.left + 1, H - 1, W, H, M)).toBe("x-axis");
    // bottom-left corner is none (desktop zoneAt)
    expect(hitChartZone(10, H - 10, W, H, M)).toBe("none");
  });

  it("classifies y-axis left of plot only within y-span", () => {
    expect(hitChartZone(10, 150, W, H, M)).toBe("y-axis");
    expect(hitChartZone(M.left - 1, M.top, W, H, M)).toBe("y-axis");
    // top-left above plot is none
    expect(hitChartZone(10, 2, W, H, M)).toBe("none");
  });
});

describe("resolvePointerDragMode axis-only pan", () => {
  it("axes always pan one dimension", () => {
    expect(
      resolvePointerDragMode({
        zone: "y-axis",
        gesture: "zoom-box",
        axisOnlyPan: true,
      }),
    ).toBe("pan-y");
    expect(
      resolvePointerDragMode({
        zone: "x-axis",
        gesture: "pan",
        axisOnlyPan: true,
      }),
    ).toBe("pan-x");
  });

  it("plot + zoom-box stays zoom-box", () => {
    expect(
      resolvePointerDragMode({
        zone: "plot",
        gesture: "zoom-box",
        axisOnlyPan: true,
      }),
    ).toBe("zoom-box");
  });

  it("plot + pan is none when axisOnlyPan (no plot-body pan)", () => {
    expect(
      resolvePointerDragMode({
        zone: "plot",
        gesture: "pan",
        axisOnlyPan: true,
      }),
    ).toBe("none");
  });

  it("plot + pan may pan-both when not axisOnlyPan (legacy uniform)", () => {
    expect(
      resolvePointerDragMode({
        zone: "plot",
        gesture: "pan",
        axisOnlyPan: false,
      }),
    ).toBe("pan-both");
  });

  it("none zone yields none", () => {
    expect(
      resolvePointerDragMode({
        zone: "none",
        gesture: "zoom-box",
        axisOnlyPan: true,
      }),
    ).toBe("none");
  });
});

describe("resolveInteractionCursor OpenHand/ClosedHand (17471a6)", () => {
  it("axis hover → grab (OpenHand)", () => {
    expect(resolveInteractionCursor({ zone: "x-axis" })).toBe("grab");
    expect(resolveInteractionCursor({ zone: "y-axis" })).toBe("grab");
  });

  it("axis pan drag → grabbing (ClosedHand)", () => {
    expect(resolveInteractionCursor({ zone: "x-axis", pan: true })).toBe("grabbing");
    expect(resolveInteractionCursor({ zone: "y-axis", pan: true })).toBe("grabbing");
    expect(resolveInteractionCursor({ zone: "plot", pan: true })).toBe("grabbing");
  });

  it("plot / selecting → crosshair (ZoomBox)", () => {
    expect(resolveInteractionCursor({ zone: "plot" })).toBe("crosshair");
    expect(resolveInteractionCursor({ zone: "x-axis", selecting: true })).toBe("crosshair");
  });

  it("none → default", () => {
    expect(resolveInteractionCursor({ zone: "none" })).toBe("default");
  });
});

describe("resolveNavigationOverviewCursor OpenHand (17471a6 Kind::Navigation)", () => {
  it("inside window hover → grab (OpenHand)", () => {
    expect(resolveNavigationOverviewCursor({ insideWindow: true })).toBe("grab");
  });

  it("window move drag → grabbing (ClosedHand)", () => {
    expect(
      resolveNavigationOverviewCursor({ insideWindow: true, draggingWindow: true }),
    ).toBe("grabbing");
  });

  it("outside window → pointer (PointingHand)", () => {
    expect(resolveNavigationOverviewCursor({ insideWindow: false })).toBe("pointer");
  });

  it("create-drag outside keeps pointer (not ClosedHand)", () => {
    expect(
      resolveNavigationOverviewCursor({ insideWindow: false, draggingWindow: false }),
    ).toBe("pointer");
  });
});

describe("resolveMarkEdgeCursor (17471a6 edgeCursor)", () => {
  it("corners map SizeFDiag / SizeBDiag", () => {
    expect(resolveMarkEdgeCursor({ edge: "nw" })).toBe("nwse-resize");
    expect(resolveMarkEdgeCursor({ edge: "se" })).toBe("nwse-resize");
    expect(resolveMarkEdgeCursor({ edge: "ne" })).toBe("nesw-resize");
    expect(resolveMarkEdgeCursor({ edge: "sw" })).toBe("nesw-resize");
  });

  it("edge midpoints map SizeHor / SizeVer", () => {
    expect(resolveMarkEdgeCursor({ edge: "e" })).toBe("ew-resize");
    expect(resolveMarkEdgeCursor({ edge: "w" })).toBe("ew-resize");
    expect(resolveMarkEdgeCursor({ edge: "n" })).toBe("ns-resize");
    expect(resolveMarkEdgeCursor({ edge: "s" })).toBe("ns-resize");
  });

  it("move / draggingMove map SizeAll / ClosedHand", () => {
    expect(resolveMarkEdgeCursor({ edge: "move" })).toBe("move");
    expect(resolveMarkEdgeCursor({ edge: "move", draggingMove: true })).toBe(
      "grabbing",
    );
  });
});

describe("resolveMarkBodyHoverCursor (17471a6 updateHover)", () => {
  it("unselected -> pointer (PointingHand)", () => {
    expect(resolveMarkBodyHoverCursor({ selected: false })).toBe("pointer");
  });

  it("selected -> move (SizeAll); dragging -> grabbing (ClosedHand)", () => {
    expect(resolveMarkBodyHoverCursor({ selected: true })).toBe("move");
    expect(
      resolveMarkBodyHoverCursor({ selected: true, draggingMove: true }),
    ).toBe("grabbing");
  });
});

