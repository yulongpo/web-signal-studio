/**
 * Bot-D: aux Wave raw IQ from sigmf_data_demo (chunked @wss/file-io).
 * Requires D:\project\signal_studio_rebuild\resources\sigmf_data_demo on disk.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { accessSync } from 'node:fs';
import {
  DEFAULT_SIGMF_DATA_DEMO_DIR,
  SIGMF_DATA_DEMO_STEM,
  clearDemoSigmfCache,
  ensureDemoSigmfReader,
  iqRmsOverview,
  readAuxWaveRawIq,
  windowToDemoSampleRange,
} from './auxWaveRawIq';

const demoMeta = `${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${SIGMF_DATA_DEMO_STEM}.sigmf-meta`;
const demoData = `${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${SIGMF_DATA_DEMO_STEM}.sigmf-data`;

function demoAvailable(): boolean {
  try {
    accessSync(demoMeta);
    accessSync(demoData);
    return true;
  } catch {
    return false;
  }
}

const describeDemo = demoAvailable() ? describe : describe.skip;

describe('iqRmsOverview', () => {
  it('RMS of constant |z|=1 is ~1', () => {
    const iq = new Float32Array(20);
    for (let i = 0; i < 10; i++) {
      iq[i * 2] = 1;
      iq[i * 2 + 1] = 0;
    }
    const y = iqRmsOverview(iq, 4);
    expect(y).toHaveLength(4);
    for (let i = 0; i < 4; i++) expect(y[i]!).toBeCloseTo(1, 5);
  });
});

describe('windowToDemoSampleRange', () => {
  it('proportional mapping covers full file for full window', () => {
    const { begin, end } = windowToDemoSampleRange(
      { min: 0, max: 1 },
      1000n,
      20e6,
      { min: 0, max: 1 },
    );
    expect(begin).toBe(0n);
    expect(end).toBe(1000n);
  });

  it('proportional half-window maps to first half of samples', () => {
    const { begin, end } = windowToDemoSampleRange(
      { min: 0, max: 0.5 },
      1000n,
      20e6,
      { min: 0, max: 1 },
    );
    expect(begin).toBe(0n);
    expect(end).toBe(500n);
  });
});

describeDemo('auxWaveRawIq · sigmf_data_demo', () => {
  beforeEach(() => clearDemoSigmfCache());
  afterEach(() => clearDemoSigmfCache());

  it('opens demo SigMF via file-io (cf32, 20 MHz)', async () => {
    const handle = await ensureDemoSigmfReader();
    expect(handle.sampleRateHz).toBe(20_000_000);
    expect(handle.totalSamples).toBeGreaterThan(0n);
    expect(handle.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(handle.sourceLabel.toLowerCase()).not.toMatch(/synthetic/);
  });

  it('reads raw IQ wave series for linked window (not STFT envelope)', async () => {
    const series = await readAuxWaveRawIq({
      win: { min: 0, max: 1 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 128,
    });
    expect(series.y.length).toBe(128);
    expect(series.xDomain.unit).toBe('s');
    expect(series.sampleEnd).toBeGreaterThan(series.sampleBegin);
    // Real IQ energy should be finite and non-zero for this capture.
    let peak = 0;
    for (let i = 0; i < series.y.length; i++) {
      const v = series.y[i]!;
      expect(Number.isFinite(v)).toBe(true);
      if (v > peak) peak = v;
    }
    expect(peak).toBeGreaterThan(0);
  });

  it('narrower window yields fewer underlying samples', async () => {
    const wide = await readAuxWaveRawIq({
      win: { min: 0, max: 1 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 64,
    });
    const narrow = await readAuxWaveRawIq({
      win: { min: 0.1, max: 0.2 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 64,
    });
    expect(narrow.sampleEnd - narrow.sampleBegin).toBeLessThan(
      wide.sampleEnd - wide.sampleBegin,
    );
  });
});
