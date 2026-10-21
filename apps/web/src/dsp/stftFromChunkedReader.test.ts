import { describe, expect, it, afterEach } from 'vitest';
import {
  buildPcm16LeStereoIqWav,
  openIqWavFromArrayBuffer,
} from '@wss/file-io';
import { createDspWorkerClient, InProcessAsyncBackend, type DspWorkerClient } from '@wss/dsp-wasm';
import { stftFromChunkedReader } from './stftFromChunkedReader';

function makeFixtureToneWav(sampleCount: number, sampleRateHz: number, fHz: number): ArrayBuffer {
  const iq = new Int16Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    const p = (2 * Math.PI * fHz * n) / sampleRateHz;
    iq[n * 2] = Math.round(16000 * Math.cos(p));
    iq[n * 2 + 1] = Math.round(16000 * Math.sin(p));
  }
  return buildPcm16LeStereoIqWav({ sampleRateHz, iqInt16: iq });
}

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('stftFromChunkedReader', () => {
  it('loops chunked WAV reads into cancelable STFT with finite power', async () => {
    const fftSize = 256;
    const hopSize = 64;
    const sampleRateHz = 1_000_000;
    const sampleCount = fftSize + 15 * hopSize;
    const buf = makeFixtureToneWav(sampleCount, sampleRateHz, 100_000);
    const { reader } = openIqWavFromArrayBuffer({
      id: 'web-fixture-wav',
      buffer: buf,
      label: 'synthetic fixture: web STFT from WAV',
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const result = await stftFromChunkedReader({
      reader,
      client,
      sampleRateHz,
      fftSize,
      hopSize,
      maxBytes: 4096, // force multiple chunk reads
      sourceLabel: 'synthetic fixture: web STFT from WAV',
    });

    expect(result.samplesRead).toBe(BigInt(sampleCount));
    expect(result.sourceLabel).toContain('synthetic fixture');
    expect(result.stft.frameCount).toBeGreaterThan(0);
    for (let i = 0; i < result.stft.linearPower.length; i++) {
      expect(Number.isFinite(result.stft.linearPower[i]!)).toBe(true);
    }
  });

  it('rejects AbortError when aborted mid-loop', async () => {
    const sampleRateHz = 1_000_000;
    const sampleCount = 8192;
    const buf = makeFixtureToneWav(sampleCount, sampleRateHz, 50_000);
    const { reader } = openIqWavFromArrayBuffer({
      id: 'web-fixture-abort',
      buffer: buf,
      label: 'synthetic fixture: abort STFT loop',
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const ac = new AbortController();
    ac.abort();
    await expect(
      stftFromChunkedReader({
        reader,
        client,
        sampleRateHz,
        sourceLabel: 'synthetic fixture: abort STFT loop',
        signal: ac.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});
