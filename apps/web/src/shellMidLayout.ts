/**
 * Bot-B mid-column (nav | aux | main) defaults vs desktop enforceLayout @17471a6.
 * Consumed as CSS vars / App defaults so Bot-C VerticalSplitter + hosts keep ownership.
 * GAP_QUALITY_7f7aead Q7-01/02 — ban undersized stack; fill remaining with main 1fr.
 * matrix_pass_claimed: false
 */
/** Desktop reset nav pane height (graphs_->setSizes). */
export const SHELL_NAV_DEFAULT_PX = 82;
/** Desktop reset aux when window height >= 850. */
export const SHELL_AUX_DEFAULT_PX = 205;
/** Desktop reset aux when height() < 850 (web uses < 900). */
export const SHELL_AUX_SHORT_PX = 176;
export const SHELL_SHORT_WINDOW_H = 900;
/** Desktop navMinimum / navMaximum clamps (others-budget). */
export const SHELL_NAV_MIN_PX = 62;
export const SHELL_NAV_MAX_PX = 128;
/** Desktop auxMinimum floor. */
export const SHELL_AUX_MIN_PX = 116;
/** Web aux max (desktop auxMaximum = others - nav; keep generous for 4K). */
export const SHELL_AUX_MAX_PX = 360;
/** Desktop graphs_->setHandleWidth(10). */
export const SHELL_SPLIT_HANDLE_PX = 10;
/** Desktop scopeBar setFixedHeight(35). */
export const SHELL_SCOPE_BAR_PX = 35;
/** Desktop menuBar setFixedHeight(34). */
export const SHELL_MENUBAR_PX = 34;
/** Desktop bottomHeight_ default. */
export const SHELL_BOTTOM_DEFAULT_PX = 260;
/** Desktop status / bottom tabs closed strip. */
export const SHELL_STATUS_PX = 28;

/** CSS custom properties C / shell share for mid-column density. */
export const SHELL_MID_CSS_VARS = {
  '--shell-nav-default': `${SHELL_NAV_DEFAULT_PX}px`,
  '--shell-aux-default': `${SHELL_AUX_DEFAULT_PX}px`,
  '--shell-aux-short': `${SHELL_AUX_SHORT_PX}px`,
  '--shell-nav-min': `${SHELL_NAV_MIN_PX}px`,
  '--shell-nav-max': `${SHELL_NAV_MAX_PX}px`,
  '--shell-aux-min': `${SHELL_AUX_MIN_PX}px`,
  '--shell-aux-max': `${SHELL_AUX_MAX_PX}px`,
  '--shell-split-handle': `${SHELL_SPLIT_HANDLE_PX}px`,
  '--shell-scope-h': `${SHELL_SCOPE_BAR_PX}px`,
  '--shell-menubar-h': `${SHELL_MENUBAR_PX}px`,
  '--shell-bottom-default': `${SHELL_BOTTOM_DEFAULT_PX}px`,
  '--shell-status-h': `${SHELL_STATUS_PX}px`,
} as const;

export function applyShellMidCssVars(target: HTMLElement | CSSStyleDeclaration = document.documentElement.style): void {
  const style =
    target instanceof CSSStyleDeclaration
      ? target
      : (target as HTMLElement).style;
  for (const [k, v] of Object.entries(SHELL_MID_CSS_VARS)) {
    style.setProperty(k, v);
  }
}

export function auxDefaultForHeight(windowHeight: number): number {
  return windowHeight < SHELL_SHORT_WINDOW_H
    ? SHELL_AUX_SHORT_PX
    : SHELL_AUX_DEFAULT_PX;
}
