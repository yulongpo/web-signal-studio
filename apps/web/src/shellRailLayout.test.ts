/**
 * Bot-B shell rail 4K thresholds vs desktop enforceLayout @17471a6 (no PASS).
 * Chart XOR partition remains Bot-C.
 */
import { describe, expect, it } from 'vitest';
import {
  SHELL_LEFT_HIDE_MAX,
  SHELL_RIGHT_HIDE_MAX,
  SHELL_LEFT_COMPACT_MAX,
  SHELL_LEFT_COMPACT_TIGHT,
  SHELL_LEFT_COMPACT,
  SHELL_RAIL_COLLAPSED_PX,
  SHELL_LEFT_DEFAULT,
  SHELL_RIGHT_DEFAULT,
  computeShellRailWidths,
} from './shellRailLayout';

describe('shellRailLayout enforceLayout@17471a6', () => {
  it('exposes desktop threshold constants', () => {
    expect(SHELL_LEFT_HIDE_MAX).toBe(990);
    expect(SHELL_RIGHT_HIDE_MAX).toBe(1150);
    expect(SHELL_LEFT_COMPACT_MAX).toBe(1490);
    expect(SHELL_RAIL_COLLAPSED_PX).toBe(38);
    expect(SHELL_LEFT_DEFAULT).toBe(278);
    expect(SHELL_RIGHT_DEFAULT).toBe(390);
  });

  it('hides both rails at very narrow widths (w <= 990)', () => {
    const r = computeShellRailWidths({
      windowWidth: 900,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
    });
    expect(r.hideLeft).toBe(true);
    expect(r.hideRight).toBe(true);
    expect(r.leftPx).toBe(38);
    expect(r.rightPx).toBe(38);
    expect(r.leftResizeVisible).toBe(false);
    expect(r.rightResizeVisible).toBe(false);
  });

  it('hides right only in mid band (990 < w <= 1150) and uses left tight 194', () => {
    const r = computeShellRailWidths({
      windowWidth: 1100,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
    });
    expect(r.hideLeft).toBe(false);
    expect(r.hideRight).toBe(true);
    expect(r.leftPx).toBe(SHELL_LEFT_COMPACT_TIGHT);
    expect(r.leftTier).toBe('tight-194');
    expect(r.rightPx).toBe(38);
  });

  it('uses left compact 218 when 1150 < w <= 1490', () => {
    const r = computeShellRailWidths({
      windowWidth: 1400,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
    });
    expect(r.hideLeft).toBe(false);
    expect(r.hideRight).toBe(false);
    expect(r.leftPx).toBe(SHELL_LEFT_COMPACT);
    expect(r.leftTier).toBe('compact-218');
    expect(r.rightPx).toBe(390);
  });

  it('uses preferred widths above 1490 (4K / HH-laptop full)', () => {
    const r = computeShellRailWidths({
      windowWidth: 3840,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
    });
    expect(r.hideLeft).toBe(false);
    expect(r.hideRight).toBe(false);
    expect(r.leftPx).toBe(278);
    expect(r.rightPx).toBe(390);
    expect(r.leftTier).toBe('preferred');
  });

  it('honors user collapse even on 4K', () => {
    const r = computeShellRailWidths({
      windowWidth: 3840,
      leftPreferred: 300,
      rightPreferred: 420,
      leftUserCollapsed: true,
      rightUserCollapsed: true,
    });
    expect(r.hideLeft).toBe(true);
    expect(r.hideRight).toBe(true);
    expect(r.leftPx).toBe(38);
    expect(r.rightPx).toBe(38);
  });
});
