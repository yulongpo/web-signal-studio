/** Desktop PlotWidget zone hit-test + drag-mode resolve (17471a6 parity). */

export type ChartHitZone = "plot" | "x-axis" | "y-axis" | "none";

export type ChartDragMode =
  | "pan-x"
  | "pan-y"
  | "pan-both"
  | "box"
  | "zoom-box"
  | "none";

export interface PlotMargin {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Match chart_feedback::zoneAt / PlotWidget::zoneAt @ 17471a6:
 * - Plot: inside plot rect
 * - XAxis: below plot, within plot x-span
 * - YAxis: left of plot, within plot y-span
 * - corners / outer margins: none
 */
export function hitChartZone(
  xCss: number,
  yCss: number,
  cssW: number,
  cssH: number,
  margin: PlotMargin,
): ChartHitZone {
  const plotLeft = margin.left;
  const plotRight = cssW - margin.right;
  const plotTop = margin.top;
  const plotBottom = cssH - margin.bottom;
  if (
    xCss >= plotLeft &&
    xCss <= plotRight &&
    yCss >= plotTop &&
    yCss <= plotBottom
  ) {
    return "plot";
  }
  if (
    xCss >= plotLeft &&
    xCss <= plotRight &&
    yCss > plotBottom &&
    yCss <= cssH
  ) {
    return "x-axis";
  }
  if (
    xCss >= 0 &&
    xCss < plotLeft &&
    yCss >= plotTop &&
    yCss <= plotBottom
  ) {
    return "y-axis";
  }
  return "none";
}

/**
 * Resolve pointer-down drag mode.
 *
 * Desktop Main (navigate): axes pan one dimension; plot body is ZoomBox (never pan-both).
 * `axisOnlyPan` (desktop-axis host path): plot + gesture "pan" does not pan the plot body.
 * Legacy `uniform` demos may still pan-both on the plot when gesture is "pan".
 */
export function resolvePointerDragMode(opts: {
  zone: ChartHitZone;
  gesture: "pan" | "box" | "zoom-box";
  axisOnlyPan: boolean;
}): ChartDragMode {
  const { zone, gesture, axisOnlyPan } = opts;
  if (zone === "y-axis") return "pan-y";
  if (zone === "x-axis") return "pan-x";
  if (zone !== "plot") return "none";
  if (gesture === "box") return "box";
  if (gesture === "zoom-box") return "zoom-box";
  // gesture === "pan"
  return axisOnlyPan ? "none" : "pan-both";
}

/** CSS cursor matching Qt chart_feedback::cursor @ 17471a6. */
export type InteractionCursor = "grab" | "grabbing" | "crosshair" | "default";

/**
 * Match chart_feedback::cursor(Zone, pan, selecting) @ 17471a6:
 * - pan → ClosedHandCursor → grabbing
 * - selecting || Plot → CrossCursor → crosshair
 * - XAxis / YAxis → OpenHandCursor → grab
 * - else → ArrowCursor → default
 *
 * Plot ZoomBox keeps crosshair; axis pan regions use open-hand on hover
 * and closed-hand while dragging.
 */
export function resolveInteractionCursor(opts: {
  zone: ChartHitZone;
  pan?: boolean;
  selecting?: boolean;
}): InteractionCursor {
  const { zone, pan = false, selecting = false } = opts;
  if (pan) return "grabbing";
  if (selecting || zone === "plot") return "crosshair";
  if (zone === "x-axis" || zone === "y-axis") return "grab";
  return "default";
}

