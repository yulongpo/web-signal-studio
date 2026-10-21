/**
 * M-02 assist: open the same e2e fixtures Playwright uses (WAV / RAW / SigMF)
 * through openIqFromFiles → @wss/file-io chunked readers. Sample counts as
 * decimal strings. Does not claim ACCEPTANCE_MATRIX PASS.
 */
import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleIndexToDecimal } from '@wss/contracts';
import {
  clearOpenedIq,
  openIqFromFiles,
  DEFAULT_RAW_SAMPLE_RATE_HZ,
} from './openIqForMainChart';
import { clearIqFileSession, getIqFileSession } from './iqFileSession';

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../e2e/fixtures',
);

function loadFixture(name: string): Blob {
  const buf = fs.readFileSync(path.join(fixturesDir, name));
  return new Blob([buf]);
}

afterEach(() => {
  clearIqFileSession();
  clearOpenedIq();
});

describe('M-02 e2e fixtures via openIqFromFiles', () => {
  it('opens tiny-iq.wav (256 samples, format wav)', async () => {
    const outcome = await openIqFromFiles([
      { file: loadFixture('tiny-iq.wav'), name: 'tiny-iq.wav' },
    ]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.format).toBe('wav');
    expect(outcome.fileName).toBe('tiny-iq.wav');
    expect(outcome.sourceLabel).toMatch(/WAV/i);
    expect(outcome.sourceLabel.toLowerCase()).not.toContain('synthetic');
    const session = getIqFileSession();
    expect(session?.format).toBe('wav');
    const prefix = session!.reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe('256');
  });

  it('opens tiny-iq.raw (256 samples, format raw, default rate)', async () => {
    const outcome = await openIqFromFiles([
      { file: loadFixture('tiny-iq.raw'), name: 'tiny-iq.raw' },
    ]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.format).toBe('raw');
    expect(outcome.sampleRateHz).toBe(DEFAULT_RAW_SAMPLE_RATE_HZ);
    expect(outcome.sourceLabel).toMatch(/RAW/i);
    const session = getIqFileSession();
    expect(session?.format).toBe('raw');
    const prefix = session!.reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe('256');
  });

  it('opens tiny.sigmf-meta + tiny.sigmf-data (128 samples)', async () => {
    const outcome = await openIqFromFiles([
      { file: loadFixture('tiny.sigmf-meta'), name: 'tiny.sigmf-meta' },
      { file: loadFixture('tiny.sigmf-data'), name: 'tiny.sigmf-data' },
    ]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.format).toBe('sigmf');
    expect(outcome.sampleRateHz).toBe(1_000_000);
    expect(outcome.sourceLabel).toMatch(/SigMF/i);
    expect(outcome.fileName).toBe('tiny');
    const session = getIqFileSession();
    expect(session?.format).toBe('sigmf');
    const prefix = session!.reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe('128');
  });
});
