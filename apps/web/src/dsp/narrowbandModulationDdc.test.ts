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

    const result = await computeNarrowbandModulationDdc({
      client,
      stftFftSize: 256,
      maxConstellationPoints: 512,
    });

    expect(result.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(result.constellation.length).toBeGreaterThan(10);
    expect(result.eye.status).toBe('BLOCKED');
    expect(result.pipelineLabel).toMatch(/not classifier/);
    expect(result.stft.frameCount).toBeGreaterThan(0);
  });
});
