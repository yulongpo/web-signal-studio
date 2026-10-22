/**
 * Bot-B shell L/R rail layout vs desktop MainWindow::enforceLayout @17471a6.
 * Chart-area BB/NB XOR partition is Bot-C (data-chart-partition) — do not reimplement here.
 * matrix_pass_claimed: false
 */
export const SHELL_LEFT_HIDE_MAX = 990;
export const SHELL_RIGHT_HIDE_MAX = 1150;
export const SHELL_LEFT_COMPACT_MAX = 1490;
/** When visible and w <= 1150 (and w > 990). */
export const SHELL_LEFT_COMPACT_TIGHT = 194;
/** When visible and 1150 < w <= 1490. */
export const SHELL_LEFT_COMPACT = 218;
/** Desktop resources_/properties_ collapsed / auto-hide width. */
export const SHELL_RAIL_COLLAPSED_PX = 38;
export const SHELL_LEFT_DEFAULT = 278;
export const SHELL_RIGHT_DEFAULT = 390;
export const SHELL_LEFT_MIN = 190;
export const SHELL_LEFT_MAX = 450;
export const SHELL_RIGHT_MIN = 320;
export const SHELL_RIGHT_MAX = 650;

export type ShellRailWidths = {
  leftPx: number;
  rightPx: number;
  hideLeft: boolean;
  hideRight: boolean;
  leftResizeVisible: boolean;
  rightResizeVisible: boolean;
  /** Compact tier applied when left visible under 1490. */
  leftTier: 'collapsed' | 'tight-194' | 'compact-218' | 'preferred';
};

/**
 * Mirrors enforceLayout side-rail width rules (not chart pane mins — those stay C).
 * hideResources = userCollapsed || w <= 990 → 38
 * hideProperties = userCollapsed || w <= 1150 → 38
 * else left: w<=1490 ? (w<=1150 ? 194 : 218) : preferred
 * else right: preferred
 */
export function computeShellRailWidths(opts: {
  windowWidth: number;
  leftPreferred: number;
  rightPreferred: number;
  leftUserCollapsed: boolean;
  rightUserCollapsed: boolean;
}): ShellRailWidths {
  const w = Math.max(0, opts.windowWidth);
  const hideLeft = opts.leftUserCollapsed || w <= SHELL_LEFT_HIDE_MAX;
  const hideRight = opts.rightUserCollapsed || w <= SHELL_RIGHT_HIDE_MAX;
  let leftPx: number;
  let leftTier: ShellRailWidths['leftTier'];
  if (hideLeft) {
    leftPx = SHELL_RAIL_COLLAPSED_PX;
    leftTier = 'collapsed';
  } else if (w <= SHELL_LEFT_COMPACT_MAX) {
    if (w <= SHELL_RIGHT_HIDE_MAX) {
      leftPx = SHELL_LEFT_COMPACT_TIGHT;
      leftTier = 'tight-194';
    } else {
      leftPx = SHELL_LEFT_COMPACT;
      leftTier = 'compact-218';
    }
  } else {
    leftPx = Math.min(
      SHELL_LEFT_MAX,
      Math.max(SHELL_LEFT_MIN, opts.leftPreferred),
    );
    leftTier = 'preferred';
  }
  const rightPx = hideRight
    ? SHELL_RAIL_COLLAPSED_PX
    : Math.min(SHELL_RIGHT_MAX, Math.max(SHELL_RIGHT_MIN, opts.rightPreferred));
  return {
    leftPx,
    rightPx,
    hideLeft,
    hideRight,
    leftResizeVisible: !hideLeft,
    rightResizeVisible: !hideRight,
    leftTier,
  };
}
