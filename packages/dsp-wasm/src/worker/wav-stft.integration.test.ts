/**
 * Integration: fixture IQ WAV → chunked read → DspWorkerClient STFT.
 * Format fixture only (labeled synthetic) — not a live capture source.
 */
import { describe, expect, it, afterEach } from 'vitest';
import {
  buildPcm16LeStereoIqWav,
  openIqWavFromArrayBuffer,
} from '@wss/file-io';
import { createDspWorkerClient, type DspWorkerClient } from './dsp-client.js';

function makeFixtureToneWav(options: {
  sampleCount: number;
  sampleRateHz: number;
  fHz: number;
  amp?: number;
}): ArrayBuffer {
  const amp = options.amp ?? 16000;
  const iq = new Int16Array(options.sampleCount * 2);
  for (let n = 0; n < options.sampleCount; n++) {
    const p = (2 * Math.PI * options.fHz * n) / options.sampleRateHz;
    iq[n * 2] = Math.round(amp * Math.cos(p));
    iq[n * 2 + 1] = Math.round(amp * Math.sin(p));
  }
  return buildPcm16LeStereoIqWav({
    sampleRateHz: options.sampleRateHz,
    iqInt16: iq,
  });
}

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('IQ WAV → chunked read → STFT (synthetic fixture)', () => {
  it('returns finite power from fixture WAV', async () => {
    const fftSize = 256;
    const hopSize = 64;
    const sampleRateHz = 1_024_000;
    const sampleCount = fftSize + 31 * hopSize;
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz,
      fHz: 64_000,
    });
    const { reader, descriptor } = openIqWavFromArrayBuffer({
      id: 'fixture-wav-stft',
      buffer: buf,
      label: 'synthetic fixture: IQ WAV for STFT integration',
    });
    expect(descriptor.sampleRateHz).toBe(sampleRateHz);

    const chunk = await reader.read({ begin: 0n, end: BigInt(sampleCount) });
    expect(chunk.samples.length).toBe(sampleCount * 2);

    const client = createDspWorkerClient();
    clients.push(client);

    const stft = await client.analyzeStft(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        hopSize,
        window: 'hann',
        sampleRateHz,
      },
      chunk.samples,
    );

    expect(stft.frameCount).toBeGreaterThan(0);
    expect(stft.binCount).toBe(fftSize);
    expect(stft.linearPower.length).toBe(stft.frameCount * stft.binCount);
    for (let i = 0; i < stft.linearPower.length; i++) {
      expect(Number.isFinite(stft.linearPower[i]!)).toBe(true);
    }
  });

  it('aborts during STFT after WAV chunk read', async () => {
    const fftSize = 512;
    const sampleRateHz = 1_024_000;
    const sampleCount = fftSize * 40;
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz,
      fHz: 80_000,
    });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'fixture-wav-stft-abort',
      buffer: buf,
      label: 'synthetic fixture: IQ WAV STFT abort',
    });
    const chunk = await reader.read({ begin: 0n, end: BigInt(sampleCount) });

    const client = createDspWorkerClient();
    clients.push(client);

    const ac = new AbortController();
    const promise = client.analyzeStft(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        hopSize: 128,
        window: 'hann',
        sampleRateHz,
      },
      chunk.samples,
      ac.signal,
    );
    setTimeout(() => ac.abort(), 0);
    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
