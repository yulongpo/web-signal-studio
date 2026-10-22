/**
 * Bot-D: aux Wave raw IQ — prefer opened iqFileSession; demo fallback for tests.
 * Demo suite requires D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { accessSync } from 'node:fs';
import {
  buildPcm16LeStereoIqWav,
  openIqWavFromArrayBuffer,
} from '@wss/file-io';
import {
  DEFAULT_SIGMF_DATA_DEMO_DIR,
  SIGMF_DATA_DEMO_STEM,
  clearDemoSigmfCache,
  ensureDemoSigmfReader,
  iqRmsOverview,
  readAuxWaveRawIq,
  windowToDemoSampleRange,
} from './auxWaveRawIq';
import {
  clearIqFileSession,
  setIqFileSession,
} from './iqFileSession';

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

describe('auxWaveRawIq · opened iqFileSession', () => {
  beforeEach(() => {
    clearIqFileSession();
    clearDemoSigmfCache();
  });
  afterEach(() => {
    clearIqFileSession();
    clearDemoSigmfCache();
  });

  function publishToneSession(sampleCount = 4096, sampleRateHz = 1_000_000) {
    const iq = new Int16Array(sampleCount * 2);
    for (let n = 0; n < sampleCount; n++) {
      const p = (2 * Math.PI * 50_000 * n) / sampleRateHz;
      iq[n * 2] = Math.round(16000 * Math.cos(p));
      iq[n * 2 + 1] = Math.round(16000 * Math.sin(p));
    }
    const buf = buildPcm16LeStereoIqWav({ sampleRateHz, iqInt16: iq });
    const { reader, descriptor } = openIqWavFromArrayBuffer({
      id: 'input:aux-tone.wav',
      buffer: buf,
      label: 'user-picked file: aux-tone.wav',
    });
    setIqFileSession({
      reader,
      sampleRateHz: descriptor.sampleRateHz,
      sourceLabel: 'user-picked IQ WAV (file input): aux-tone.wav',
      fileName: 'aux-tone.wav',
      via: 'input',
      format: 'wav',
    });
    return { sampleCount, sampleRateHz };
  }

  it('throws without session when demo fallback disabled', async () => {
    await expect(
      readAuxWaveRawIq({
        win: { min: 0, max: 1 },
        fullTime: { min: 0, max: 1 },
        allowDemoFallback: false,
      }),
    ).rejects.toThrow(/no opened IQ session/i);
  });

  it('reads IqRms from opened WAV session (not STFT envelope)', async () => {
    publishToneSession();
    const series = await readAuxWaveRawIq({
      win: { min: 0, max: 1 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 128,
      allowDemoFallback: false,
    });
    expect(series.feed).toBe('opened_iq_session');
    expect(series.format).toBe('wav');
    expect(series.via).toBe('input');
    expect(series.fileName).toBe('aux-tone.wav');
    expect(series.sourceLabel).toMatch(/file input/);
    expect(series.sourceLabel.toLowerCase()).not.toMatch(/synthetic/);
    expect(series.y.length).toBe(128);
    let peak = 0;
    for (let i = 0; i < series.y.length; i++) {
      const v = series.y[i]!;
      expect(Number.isFinite(v)).toBe(true);
      if (v > peak) peak = v;
    }
    expect(peak).toBeGreaterThan(0);
  });

  it('narrower window yields fewer underlying samples on session', async () => {
    publishToneSession(8192);
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
    expect(wide.feed).toBe('opened_iq_session');
  });
});

describeDemo('auxWaveRawIq · sigmf_data_demo', () => {
  beforeEach(() => {
    clearIqFileSession();
    clearDemoSigmfCache();
  });
  afterEach(() => {
    clearIqFileSession();
    clearDemoSigmfCache();
  });

  it('opens demo SigMF via file-io (cf32, 20 MHz)', async () => {
    const handle = await ensureDemoSigmfReader();
    expect(handle.sampleRateHz).toBe(20_000_000);
    expect(handle.totalSamples).toBeGreaterThan(0n);
    expect(handle.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(handle.sourceLabel.toLowerCase()).not.toMatch(/synthetic/);
  });

  it('reads raw IQ wave series for linked window (not STFT envelope)', async () => {
    const series = await readAuxWaveRawIq({
      allowDemoFallback: true,
      win: { min: 0, max: 1 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 128,
    });
    expect(series.feed).toBe('sigmf_data_demo');
    expect(series.y.length).toBe(128);
    expect(series.xDomain.unit).toBe('s');
    expect(series.sampleEnd).toBeGreaterThan(series.sampleBegin);
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
      allowDemoFallback: true,
      win: { min: 0, max: 1 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 64,
    });
    const narrow = await readAuxWaveRawIq({
      allowDemoFallback: true,
      win: { min: 0.1, max: 0.2 },
      fullTime: { min: 0, max: 1 },
      maxPoints: 64,
    });
    expect(narrow.sampleEnd - narrow.sampleBegin).toBeLessThan(
      wide.sampleEnd - wide.sampleBegin,
    );
  });
});
