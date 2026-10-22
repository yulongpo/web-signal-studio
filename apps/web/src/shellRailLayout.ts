/**
 * Bot-B shell L/R rail layout vs desktop MainWindow::enforceLayout @17471a6.
 * Chart-area BB/NB XOR partition is Bot-C (data-chart-partition) — do not reimplement here.
 * GAP_QUALITY_7f7aead Q7-01/02: never auto-collapse/compact on true 4K physical viewport.
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
/** Physical 4K-class short side / long side (CSS screen.width, not layout viewport). */
export const SHELL_PHYSICAL_4K_MIN = 3000;

export type ShellRailWidths = {
  leftPx: number;
  rightPx: number;
  hideLeft: boolean;
  hideRight: boolean;
  leftResizeVisible: boolean;
  rightResizeVisible: boolean;
  /** Compact tier applied when left visible under 1490 (forced preferred on physical 4K). */
  leftTier: 'collapsed' | 'tight-194' | 'compact-218' | 'preferred';
  physical4k: boolean;
};

/** True when the display is 4K-class (GAP Q7-01/02: do not stub rails). */
export function isPhysical4K(opts?: {
  screenWidth?: number;
  screenHeight?: number;
  devicePixelRatio?: number;
  windowWidth?: number;
}): boolean {
  if (typeof window === 'undefined' && opts == null) return false;
  const sw =
    opts?.screenWidth ??
    (typeof window !== 'undefined' ? window.screen?.width ?? 0 : 0);
  const sh =
    opts?.screenHeight ??
    (typeof window !== 'undefined' ? window.screen?.height ?? 0 : 0);
  const dpr =
    opts?.devicePixelRatio ??
    (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
  const ww =
    opts?.windowWidth ??
    (typeof window !== 'undefined' ? window.innerWidth : 0);
  const long = Math.max(sw, sh);
  const short = Math.min(sw, sh);
  // Logical CSS screen already 4K, or physical pixels (CSS * dpr) are.
  if (long >= SHELL_PHYSICAL_4K_MIN) return true;
  if (long * dpr >= SHELL_PHYSICAL_4K_MIN && short * dpr >= 1600) return true;
  // Playwright / QA often sets viewport 3840 without matching screen.*
  if (ww >= SHELL_PHYSICAL_4K_MIN) return true;
  return false;
}

/**
 * Mirrors enforceLayout side-rail width rules (not chart pane mins — those stay C).
 * On physical 4K: always preferred widths unless userCollapsed (GAP Q7-02).
 */
export function computeShellRailWidths(opts: {
  windowWidth: number;
  leftPreferred: number;
  rightPreferred: number;
  leftUserCollapsed: boolean;
  rightUserCollapsed: boolean;
  physical4k?: boolean;
}): ShellRailWidths {
  const physical4k =
    opts.physical4k ??
    isPhysical4K({ windowWidth: opts.windowWidth });
  const w = Math.max(0, opts.windowWidth);
  // 4K guard: never threshold-auto-hide / compact (user collapse still honored).
  const hideLeft =
    opts.leftUserCollapsed || (!physical4k && w <= SHELL_LEFT_HIDE_MAX);
  const hideRight =
    opts.rightUserCollapsed || (!physical4k && w <= SHELL_RIGHT_HIDE_MAX);
  let leftPx: number;
  let leftTier: ShellRailWidths['leftTier'];
  if (hideLeft) {
    leftPx = SHELL_RAIL_COLLAPSED_PX;
    leftTier = 'collapsed';
  } else if (!physical4k && w <= SHELL_LEFT_COMPACT_MAX) {
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
    physical4k,
  };
}
