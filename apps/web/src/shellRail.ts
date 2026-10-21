/**
 * PROVISIONAL — Bot-B right-rail page contract (ids + labels).
 * Shared by App / RightRail / contract tests / e2e expectations.
 */
export const SHELL_RAIL_PAGES = [
  { id: 'display', label: '显示' },
  { id: 'detect', label: '检测' },
  { id: 'marker', label: '标记' },
  { id: 'channel', label: '通道' },
] as const;

export type ShellRailPageId = (typeof SHELL_RAIL_PAGES)[number]['id'];
