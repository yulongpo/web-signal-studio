/**
 * Bot-D: demod DDC → AM envelope preview from sigmf_data_demo.
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
import { computeNarrowbandDemodDdc } from './narrowbandDemodDdc';

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

describeDemo('narrowbandDemodDdc · sigmf_data_demo', () => {
  beforeEach(() => clearDemoSigmfCache());
  afterEach(() => clearDemoSigmfCache());

  it('DDC → AM envelope preview; bitstream BLOCKED', async () => {
    const client = createDspWorkerClient({
      backend: new InProcessAsyncBackend(),
    });
    clients.push(client);

    const result = await computeNarrowbandDemodDdc({
      client,
      mode: 'am_envelope',
      maxWavePoints: 256,
    });

    expect(result.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(result.waveform.y.length).toBe(256);
    expect(result.waveform.y.some((v) => v > 0)).toBe(true);
    expect(result.bitstream.status).toBe('BLOCKED');
    expect(result.bitstream.bits.byteLength).toBe(0);
    expect(result.pipelineLabel).toMatch(/not bitstream/);
  });
});
