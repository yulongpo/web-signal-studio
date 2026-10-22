/** CSS plot inset shared by HeatmapCanvas and web mark overlays.
 * right: desktop plot_widget.cpp plotRect — colorScale on Main => 70, else 22.
 * Colorbar strip is flush beside the plot (plotGap after plotR).
 */
export type HeatmapPlotMargin = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

/** Default = Main + colorScale (desktop right=70). Prefer heatmapPlotMargin(show). */
export const HEATMAP_PLOT_MARGIN: HeatmapPlotMargin = {
  left: 52,
  right: 70,
  top: 10,
  bottom: 36,
};

/** Colorbar strip geometry inside the right margin (desktop plot_widget colorScale). */
export const HEATMAP_COLORBAR = {
  stripWidth: 13,
  labelGap: 4,
  /** Room for dB tick text (e.g. "-120"). */
  labelColumn: 28,
  /** CSS px between plot right edge and strip left (flush). */
  plotGap: 2,
  /**
   * Legacy desktop strip left ≈ width-38 when right≈70.
   * Prefer stripOffsetForMargin(right) for flush layout.
   */
  stripOffsetFromRight: 38,
} as const;

/** Desktop Main plotRect right inset: colorScale ? 70 : 22. */
export const HEATMAP_RIGHT_WITH_COLORSCALE = 70;
export const HEATMAP_RIGHT_NO_COLORSCALE = 22;

/**
 * Plot margin for HeatmapCanvas. When colorScale is on, right = desktop 70 and
 * the strip sits flush after the plot (plotR + plotGap).
 */
export function heatmapPlotMargin(showColorScale: boolean): HeatmapPlotMargin {
  return {
    left: HEATMAP_PLOT_MARGIN.left,
    right: showColorScale
      ? HEATMAP_RIGHT_WITH_COLORSCALE
      : HEATMAP_RIGHT_NO_COLORSCALE,
    top: HEATMAP_PLOT_MARGIN.top,
    bottom: HEATMAP_PLOT_MARGIN.bottom,
  };
}

/** CSS px from canvas right edge to colorbar strip left (flush after plot). */
export function stripOffsetForMargin(marginRight: number): number {
  return Math.max(
    HEATMAP_COLORBAR.stripWidth +
      HEATMAP_COLORBAR.labelGap +
      HEATMAP_COLORBAR.labelColumn,
    marginRight - HEATMAP_COLORBAR.plotGap,
  );
}
