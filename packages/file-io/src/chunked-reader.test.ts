import { describe, expect, it } from 'vitest';
import { DEFAULT_CI16_LE_IQ, DEFAULT_CHUNK_BYTES, sampleIndexToDecimal } from '@wss/contracts';
import { ArrayBufferChunkedReader, bytesPerFrame } from './chunked-reader.js';

describe('ArrayBufferChunkedReader', () => {
  it('honours available-prefix and ~4MiB chunk budget', async () => {
    const bpf = bytesPerFrame(DEFAULT_CI16_LE_IQ);
    const totalSamples = 2_000_000; // 8 bytes? wait CI16 = 4 bytes/frame
    const buffer = new ArrayBuffer(totalSamples * bpf);
    const view = new Int16Array(buffer);
    for (let i = 0; i < view.length; i++) view[i] = (i % 1000) - 500;

    const reader = new ArrayBufferChunkedReader({
      id: 'synthetic-ci16',
      format: DEFAULT_CI16_LE_IQ,
      buffer,
      availableSamples: 100_000n,
      label: 'synthetic fixture: CI16 ramp',
    });

    const prefix = reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.availableSamples)).toBe('100000');
    expect(prefix.status).toBe('partial');

    const huge = await reader.read({
      begin: 0n,
      end: 5_000_000n,
      maxBytes: DEFAULT_CHUNK_BYTES,
    });
    expect(huge.truncatedToAvailable).toBe(true);
    expect(huge.end <= 100_000n).toBe(true);
    const maxSamples = Math.floor(DEFAULT_CHUNK_BYTES / bpf);
    expect(Number(huge.end - huge.begin)).toBeLessThanOrEqual(maxSamples);
    expect(huge.samples.length).toBe(Number(huge.end - huge.begin) * 2);
  });

  it('cancels via AbortSignal', async () => {
    const bpf = bytesPerFrame(DEFAULT_CI16_LE_IQ);
    const buffer = new ArrayBuffer(1024 * bpf);
    const reader = new ArrayBufferChunkedReader({
      id: 'synthetic-cancel',
      format: DEFAULT_CI16_LE_IQ,
      buffer,
      label: 'synthetic fixture: cancel',
    });
    const ac = new AbortController();
    ac.abort();
    await expect(reader.read({ begin: 0n, end: 10n, signal: ac.signal })).rejects.toThrow();
  });
});
