/** CSS plot inset shared by HeatmapCanvas and web mark overlays.
 * right reserves desktop colorScale gutter (plot_widget.cpp ~ width-38 strip).
 */
export const HEATMAP_PLOT_MARGIN = {
  left: 52,
  right: 48,
  top: 10,
  bottom: 36,
} as const;

/** Colorbar strip geometry inside the right margin (desktop plot_widget colorScale). */
export const HEATMAP_COLORBAR = {
  /** CSS px from canvas right edge to strip left. */
  stripOffsetFromRight: 38,
  stripWidth: 13,
  labelGap: 4,
} as const;
