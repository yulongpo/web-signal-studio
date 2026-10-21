/**
 * Bot-D: narrowband observe DDC from sigmf_data_demo (chunked + Worker DDC).
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { accessSync } from 'node:fs';
import {
  createDspWorkerClient,
  InProcessAsyncBackend,
  type DspWorkerClient,
} from '@wss/dsp-wasm';
import {
  DEFAULT_SIGMF_DATA_DEMO_DIR,
  SIGMF_DATA_DEMO_STEM,
  clearDemoSigmfCache,
  ensureDemoSigmfReader,
} from './auxWaveRawIq';
import {
  buildFramePsdFromStft,
  buildStatisticalPsd,
  computeNarrowbandObserveDdc,
  deriveDecimation,
  deriveLoOffsetHz,
  deriveSampleWindow,
  NB_OBSERVE_MAX_INPUT_SAMPLES,
  selectNarrowbandPsdSeries,
  plotYForNarrowbandPsdMode,
} from './narrowbandObserveDdc';

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

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});



describe('G18 narrowband PSD mode helpers', () => {
  it('frame STFT dwell differs from Welch/mean statistical series', () => {
    const binCount = 8;
    const frameCount = 3;
    // Three distinct frames so last-frame != mean.
    const stft = new Float32Array(binCount * frameCount);
    for (let f = 0; f < frameCount; f++) {
      for (let k = 0; k < binCount; k++) {
        stft[f * binCount + k] = (f + 1) * (k + 1) * 1e-3;
      }
    }
    const welch = new Float32Array(binCount);
    for (let k = 0; k < binCount; k++) welch[k] = (k + 1) * 2e-3;

    const frameDb = buildFramePsdFromStft(stft, binCount, frameCount);
    const statisticalDb = buildStatisticalPsd(welch, stft, binCount, frameCount);
    expect(frameDb.length).toBe(binCount);
    expect(statisticalDb.length).toBe(binCount);

    let differ = false;
    for (let i = 0; i < binCount; i++) {
      if (Math.abs(frameDb[i]! - statisticalDb[i]!) > 1e-9) {
        differ = true;
        break;
      }
    }
    expect(differ).toBe(true);

    const frameSel = selectNarrowbandPsdSeries({
      mode: 'frame',
      frameDb,
      statisticalDb,
    });
    const statSel = selectNarrowbandPsdSeries({
      mode: 'statistical',
      frameDb,
      statisticalDb,
    });
    expect(frameSel.kind).toBe('frame-stft');
    expect(statSel.kind).toBe('welch-statistical');
    expect(frameSel.y).toBe(frameDb);
    expect(statSel.y).toBe(statisticalDb);
  });
});

describeDemo('narrowbandObserveDdc · sigmf_data_demo', () => {
  beforeEach(() => clearDemoSigmfCache());
  afterEach(() => clearDemoSigmfCache());

  it('derive LO / decimation / window from first annotation', async () => {
    const handle = await ensureDemoSigmfReader();
    expect(handle.annotations.length).toBeGreaterThan(0);
    const ann = handle.annotations[0]!;
    const lo = deriveLoOffsetHz(handle, ann);
    expect(lo).toBeGreaterThan(1e6);
    expect(lo).toBeLessThan(handle.sampleRateHz / 2);
    const dec = deriveDecimation(handle, ann);
    expect(dec).toBeGreaterThanOrEqual(2);
    expect(dec).toBeLessThanOrEqual(64);
    const { begin, end } = deriveSampleWindow(
      handle,
      ann,
      NB_OBSERVE_MAX_INPUT_SAMPLES,
    );
    expect(end).toBeGreaterThan(begin);
    expect(end - begin).toBeLessThanOrEqual(BigInt(NB_OBSERVE_MAX_INPUT_SAMPLES));
  });

  it('DDC → waveform + PSD + STFT (not empty / not synthetic label)', async () => {
    const client = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
    });
    clients.push(client);

    const result = await computeNarrowbandObserveDdc({
      client,
      waveformMode: 'rms',
      psdFftSize: 512,
      stftFftSize: 256,
      maxWavePoints: 128,
      maxInputSamples: 8192,
    });

    expect(result.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(result.sourceLabel.toLowerCase()).not.toMatch(/synthetic/);
    expect(result.pipelineLabel).toMatch(/DDC/);
    expect(result.pipelineLabel.toLowerCase()).toMatch(/not demod/);
    expect(result.samplesRead).toBeGreaterThan(0n);
    expect(result.outputSampleRateHz).toBe(
      result.inputSampleRateHz / result.decimation,
    );
    expect(result.waveform.y.length).toBe(128);
    let peak = 0;
    for (let i = 0; i < result.waveform.y.length; i++) {
      const v = Math.abs(result.waveform.y[i]!);
      expect(Number.isFinite(v)).toBe(true);
      if (v > peak) peak = v;
    }
    expect(peak).toBeGreaterThan(0);
    expect(result.psd.y.length).toBeGreaterThan(0);
    expect(result.stft.frameCount).toBeGreaterThan(0);
    expect(result.stft.binCount).toBeGreaterThan(0);
    expect(result.stft.power.length).toBe(
      result.stft.frameCount * result.stft.binCount,
    );
  });

  

  it('G18 store mode alone swaps selected plot y (no pinned dwell bleed)', () => {
    const frameDb = new Float32Array([1, 2, 3, 4]);
    const statisticalDb = new Float32Array([10, 20, 30, 40]);

    const asFrame = plotYForNarrowbandPsdMode('frame', frameDb, statisticalDb);
    const asStat = plotYForNarrowbandPsdMode(
      'statistical',
      frameDb,
      statisticalDb,
    );

    expect(asFrame.kind).toBe('frame-stft');
    expect(asStat.kind).toBe('welch-statistical');
    expect(Array.from(asFrame.y)).toEqual(Array.from(frameDb));
    expect(Array.from(asStat.y)).toEqual(Array.from(statisticalDb));
    // Mode flip must change which y-array is selected.
    expect(Array.from(asFrame.y)).not.toEqual(Array.from(asStat.y));
  });

  it('G18 mode switch replaces plotted PSD arrays (frame != statistical)', async () => {
    const client = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
    });
    clients.push(client);

    const common = {
      client,
      waveformMode: 'rms' as const,
      psdFftSize: 512,
      stftFftSize: 256,
      maxWavePoints: 64,
      maxInputSamples: 8192,
    };

    const frame = await computeNarrowbandObserveDdc({
      ...common,
      psdMode: 'frame',
    });
    const statistical = await computeNarrowbandObserveDdc({
      ...common,
      psdMode: 'statistical',
    });

    expect(frame.psdMode).toBe('frame');
    expect(statistical.psdMode).toBe('statistical');
    expect(frame.psdSeriesKind).toBe('frame-stft');
    expect(statistical.psdSeriesKind).toBe('welch-statistical');
    expect(frame.psd.y.length).toBeGreaterThan(0);
    expect(statistical.psd.y.length).toBeGreaterThan(0);
    expect(frame.psdFrame.length).toBeGreaterThan(0);
    expect(frame.psdStatistical.length).toBeGreaterThan(0);

    // Plotted series must follow mode.
    expect(Array.from(frame.psd.y)).toEqual(Array.from(frame.psdFrame));
    expect(Array.from(statistical.psd.y)).toEqual(
      Array.from(statistical.psdStatistical),
    );

    // Mode switch must truly change PSD data (length and/or values).
    const sameLength = frame.psd.y.length === statistical.psd.y.length;
    let sameValues = sameLength;
    if (sameLength) {
      sameValues = true;
      for (let i = 0; i < frame.psd.y.length; i++) {
        if (Math.abs(frame.psd.y[i]! - statistical.psd.y[i]!) > 1e-6) {
          sameValues = false;
          break;
        }
      }
    }
    expect(sameValues).toBe(false);
  });

  it('respects AbortSignal', async () => {
    const client = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
    });
    clients.push(client);
    const ac = new AbortController();
    ac.abort();
    await expect(
      computeNarrowbandObserveDdc({ client, signal: ac.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
