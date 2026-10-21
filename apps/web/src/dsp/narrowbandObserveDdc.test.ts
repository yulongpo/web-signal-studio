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
  computeNarrowbandObserveDdc,
  deriveDecimation,
  deriveLoOffsetHz,
  deriveSampleWindow,
  NB_OBSERVE_MAX_INPUT_SAMPLES,
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
