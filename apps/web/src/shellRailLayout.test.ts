/**
 * Bot-B shell rail 4K thresholds vs desktop enforceLayout @17471a6 (no PASS).
 * GAP_QUALITY_7f7aead Q7-01/02: physical 4K never auto-collapses.
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
  isPhysical4K,
} from './shellRailLayout';
import {
  SHELL_NAV_DEFAULT_PX,
  SHELL_AUX_DEFAULT_PX,
  SHELL_SPLIT_HANDLE_PX,
  SHELL_SCOPE_BAR_PX,
  SHELL_BOTTOM_DEFAULT_PX,
  auxDefaultForHeight,
} from './shellMidLayout';

describe('shellRailLayout enforceLayout@17471a6', () => {
  it('exposes desktop threshold constants', () => {
    expect(SHELL_LEFT_HIDE_MAX).toBe(990);
    expect(SHELL_RIGHT_HIDE_MAX).toBe(1150);
    expect(SHELL_LEFT_COMPACT_MAX).toBe(1490);
    expect(SHELL_RAIL_COLLAPSED_PX).toBe(38);
    expect(SHELL_LEFT_DEFAULT).toBe(278);
    expect(SHELL_RIGHT_DEFAULT).toBe(390);
  });

  it('hides both rails at very narrow widths (w <= 990) when not physical 4K', () => {
    const r = computeShellRailWidths({
      windowWidth: 900,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
      physical4k: false,
    });
    expect(r.hideLeft).toBe(true);
    expect(r.hideRight).toBe(true);
    expect(r.leftPx).toBe(38);
    expect(r.rightPx).toBe(38);
  });

  it('hides right only in mid band (990 < w <= 1150) and uses left tight 194', () => {
    const r = computeShellRailWidths({
      windowWidth: 1100,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
      physical4k: false,
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
      physical4k: false,
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
      physical4k: false,
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
      physical4k: true,
    });
    expect(r.hideLeft).toBe(true);
    expect(r.hideRight).toBe(true);
    expect(r.leftPx).toBe(38);
    expect(r.rightPx).toBe(38);
  });

  it('physical 4K never auto-hides or compacts even if CSS width is mid-band', () => {
    const r = computeShellRailWidths({
      windowWidth: 1280,
      leftPreferred: 278,
      rightPreferred: 390,
      leftUserCollapsed: false,
      rightUserCollapsed: false,
      physical4k: true,
    });
    expect(r.physical4k).toBe(true);
    expect(r.hideLeft).toBe(false);
    expect(r.hideRight).toBe(false);
    expect(r.leftPx).toBe(278);
    expect(r.rightPx).toBe(390);
    expect(r.leftTier).toBe('preferred');
  });

  it('detects physical 4K from screen or viewport', () => {
    expect(isPhysical4K({ screenWidth: 3840, screenHeight: 2160 })).toBe(true);
    expect(isPhysical4K({ windowWidth: 3840 })).toBe(true);
    expect(
      isPhysical4K({
        screenWidth: 1920,
        screenHeight: 1080,
        devicePixelRatio: 2,
      }),
    ).toBe(true);
    expect(
      isPhysical4K({
        screenWidth: 1920,
        screenHeight: 1080,
        devicePixelRatio: 1,
        windowWidth: 1280,
      }),
    ).toBe(false);
  });
});

describe('shellMidLayout enforceLayout mid panes', () => {
  it('matches desktop nav/aux/handle/scope/bottom defaults', () => {
    expect(SHELL_NAV_DEFAULT_PX).toBe(82);
    expect(SHELL_AUX_DEFAULT_PX).toBe(205);
    expect(SHELL_SPLIT_HANDLE_PX).toBe(10);
    expect(SHELL_SCOPE_BAR_PX).toBe(35);
    expect(SHELL_BOTTOM_DEFAULT_PX).toBe(260);
  });

  it('picks short aux under 900px height', () => {
    expect(auxDefaultForHeight(800)).toBe(176);
    expect(auxDefaultForHeight(1200)).toBe(205);
  });
});
