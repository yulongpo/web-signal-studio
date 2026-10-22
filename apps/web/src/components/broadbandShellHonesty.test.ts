/**
 * Soft source-guard for BROADBAND_GAP Bot-B honesty close-outs (G08/G19/G20/G07/strip).
 * No PASS claim — asserts browser-honest stamps and A2 BW copy, not pixel parity.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname);

function src(name: string): string {
  return readFileSync(resolve(root, name), 'utf8');
}

describe('broadband shell honesty (G08 / G19-G20 / G07 / strip)', () => {
  it('MenuBar stamps G08 soft inventory + Open IQ native-qfiledialog=false', () => {
    const t = src('MenuBar.tsx');
    expect(t).toContain('data-g08-soft="broadband-gap"');
    expect(t).toContain('data-g08-accel-inventory=');
    expect(t).toContain('data-testid="menu-open-iq" data-native-qfiledialog="false"');
    expect(t).toContain('data-testid="menubar-input-iq" data-native-qfiledialog="false"');
  });

  it('SpectrumToolbar + ChartParamStrip Open IQ are browser-honest (not QFileDialog)', () => {
    const toolbar = src('SpectrumToolbar.tsx');
    const strip = src('ChartParamStrip.tsx');
    expect(toolbar).toContain('data-native-qfiledialog="false"');
    expect(strip).toContain('data-native-qfiledialog="false"');
    expect(strip).not.toContain('bandwidth=fs');
    expect(strip).toContain('visibleBandwidthHz');
    expect(strip).toContain('data-strip-bw-honesty="a2-visibleBandwidthHz"');
  });

  it('BottomPanel LocalCompute inspector keeps native-worker=false + created/updated/feed', () => {
    const t = src('BottomPanel.tsx');
    expect(t).toContain('data-g07-soft="broadband-gap"');
    expect(t).toContain('data-native-worker="false"');
    expect(t).toContain('bottom-detect-inspector-created');
    expect(t).toContain('bottom-detect-inspector-updated');
    expect(t).toContain('bottom-detect-inspector-feed-size');
  });

  it('MainChartHost keeps Esc soft stamp (context menu / ROI)', () => {
    const t = src('MainChartHost.tsx');
    expect(t).toContain('data-g10-soft="esc-context-menu-roi"');
    expect(t).toContain("e.key === 'Escape'");
  });
});
