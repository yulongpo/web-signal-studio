/**
 * BROADBAND_GAP #9: one-shot demo IQ → main-chart session (allowlisted path only).
 * Requires D:\project\signal_studio_rebuild\resources\sigmf_data_demo on disk.
 * matrix_pass_claimed: false — GAP prep only.
 */
import { existsSync } from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_SIGMF_DATA_DEMO_DIR,
  SIGMF_DATA_DEMO_STEM,
  clearDemoSigmfCache,
} from './auxWaveRawIq';
import { clearOpenedIq, openDemoIqForMainChart } from './openIqForMainChart';
import { getIqFileSession } from './iqFileSession';

const meta = `${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${SIGMF_DATA_DEMO_STEM}.sigmf-meta`;
const data = `${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${SIGMF_DATA_DEMO_STEM}.sigmf-data`;
const demoPresent = existsSync(meta) && existsSync(data);
const describeDemo = demoPresent ? describe : describe.skip;

afterEach(() => {
  clearOpenedIq();
  clearDemoSigmfCache();
});

describeDemo('openDemoIqForMainChart · sigmf_data_demo (GAP #9)', () => {
  it('publishes demo SigMF into iqFileSession with via=demo', async () => {
    const outcome = await openDemoIqForMainChart();
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.via).toBe('demo');
    expect(outcome.format).toBe('sigmf');
    expect(outcome.sampleRateHz).toBe(20_000_000);
    expect(outcome.fileName).toContain(SIGMF_DATA_DEMO_STEM);
    const session = getIqFileSession();
    expect(session).not.toBeNull();
    expect(session?.via).toBe('demo');
    expect(session?.format).toBe('sigmf');
    expect(session?.sourceLabel).toMatch(/sigmf_data_demo/);
    expect(session?.sourceLabel).toMatch(/signal_studio_rebuild/);
  });
});
