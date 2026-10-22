/**
 * QUALITY demo IQ → main-chart session + engineering project tree (allowlisted path only).
 * Requires D:\project\signal_studio_rebuild\resources\sigmf_data_demo on disk.
 * matrix_pass_claimed: false
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
import { useUiStore } from '../store/uiStore';

const meta = `${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${SIGMF_DATA_DEMO_STEM}.sigmf-meta`;
const data = `${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${SIGMF_DATA_DEMO_STEM}.sigmf-data`;
const demoPresent = existsSync(meta) && existsSync(data);
const describeDemo = demoPresent ? describe : describe.skip;

afterEach(() => {
  clearOpenedIq();
  clearDemoSigmfCache();
  useUiStore.getState().clearProject();
});

describeDemo('openDemoIqForMainChart · sigmf_data_demo (QUALITY tree)', () => {
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

  it('commits demo SigMF into projectDocument so tree is not empty shell', async () => {
    useUiStore.getState().clearProject();
    expect(useUiStore.getState().projectDocument).toBeNull();
    const outcome = await openDemoIqForMainChart();
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    const st = useUiStore.getState();
    expect(st.projectDocument).not.toBeNull();
    expect(st.projectSource).toBe('json');
    expect(st.projectSummary).not.toBeNull();
    expect(st.projectDocument?.files.length ?? 0).toBeGreaterThan(0);
    expect(st.statusFileLabel).toMatch(/0000000|sigmf/i);
  });
});
