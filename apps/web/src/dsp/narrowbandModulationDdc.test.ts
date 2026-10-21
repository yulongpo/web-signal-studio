/**
 * Bot-D: modulation DDC → constellation from sigmf_data_demo.
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
} from './auxWaveRawIq';
import { computeNarrowbandModulationDdc } from './narrowbandModulationDdc';

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

describeDemo('narrowbandModulationDdc · sigmf_data_demo', () => {
  beforeEach(() => clearDemoSigmfCache());
  afterEach(() => clearDemoSigmfCache());

  it('DDC → non-empty constellation; eye BLOCKED', async () => {
    const client = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
    });
    clients.push(client);

    const stftFftSize = 256;
    const maxPts = 512;
    const result = await computeNarrowbandModulationDdc({
      client,
      stftFftSize,
      maxConstellationPoints: maxPts,
    });

    expect(result.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(result.constellation.length).toBeGreaterThan(10);
    expect(result.constellation.length).toBeLessThanOrEqual(maxPts);
    // Finite I/Q points
    for (const p of result.constellation) {
      expect(Number.isFinite(p.i)).toBe(true);
      expect(Number.isFinite(p.q)).toBe(true);
    }

    expect(result.eye.status).toBe('BLOCKED');
    expect(result.eye.reasonCode).toBe('EYE_TIMING_SYNC_MISSING');
    expect(result.pipelineLabel).toMatch(/not classifier/);

    // STFT geometry used by NarrowbandModulationCharts
    expect(result.stft.frameCount).toBeGreaterThan(0);
    expect(result.stft.binCount).toBe(stftFftSize);
    expect(result.stft.power.length).toBe(
      result.stft.frameCount * result.stft.binCount,
    );
    for (let i = 0; i < result.stft.power.length; i++) {
      const v = result.stft.power[i]!;
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1); // normalizePower01
    }
  });
});
