/**
 * Unit tests for DspWorkerClient (in-process + worker_threads cancel path).
 */

import { describe, expect, it, afterEach } from 'vitest';
import { findPeakBins, frequencyToBin } from '../fft.js';
import {
  createDspWorkerClient,
  createNodeDspWorkerClient,
  DspWorkerClient,
} from './dsp-client.js';
import { InProcessAsyncBackend } from './backends.js';

function synthesizeToneIq(options: {
  sampleCount: number;
  sampleRateHz: number;
  fHz: number;
  amp?: number;
}): Float32Array {
  const { sampleCount, sampleRateHz, fHz } = options;
  const amp = options.amp ?? 1;
  const out = new Float32Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    const p = (2 * Math.PI * fHz * n) / sampleRateHz;
    out[n * 2] = amp * Math.cos(p);
    out[n * 2 + 1] = amp * Math.sin(p);
  }
  return out;
}

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    const c = clients.pop()!;
    await c.close();
  }
});

describe('DspWorkerClient in-process', () => {
  it('analyzes PSD and places peak within ±1 bin', async () => {
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const fftSize = 1024;
    const sampleRateHz = 1_024_000;
    const fHz = 80_000;
    const expected = frequencyToBin(fHz, sampleRateHz, fftSize);
    const sampleCount = fftSize * 4;
    const iq = synthesizeToneIq({ sampleCount, sampleRateHz, fHz });

    const result = await client.analyzePsd(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        window: 'hann',
        overlap: 0.5,
        sampleRateHz,
      },
      iq,
    );

    expect(result.linearPower.length).toBe(fftSize);
    const peaks = findPeakBins(Float64Array.from(result.linearPower), 1, 3);
    expect(Math.abs(peaks[0]! - expected)).toBeLessThanOrEqual(1);
  });

  it('processes DDC via client and returns baseband samples', async () => {
    const client = createDspWorkerClient();
    clients.push(client);

    const sampleRateHz = 1_000_000;
    const fHz = 100_000;
    const sampleCount = 4096;
    const iq = synthesizeToneIq({ sampleCount, sampleRateHz, fHz });

    const out = await client.processDdc(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        loHz: fHz,
        sampleRateHz,
        interpolation: 1,
        decimation: 4,
      },
      iq,
    );

    expect(out.outputSampleRateHz).toBe(sampleRateHz / 4);
    expect(out.samples.length).toBeGreaterThan(0);
    expect(Number(out.end)).toBe(out.samples.length / 2);
  });

  it('rejects with AbortError when signal aborts mid-job', async () => {
    const client = createDspWorkerClient();
    clients.push(client);

    const fftSize = 2048;
    const sampleRateHz = 2_048_000;
    // Many Welch frames so yields have room for abort.
    const sampleCount = fftSize * 64;
    const iq = synthesizeToneIq({ sampleCount, sampleRateHz, fHz: 100_000 });

    const ac = new AbortController();
    const promise = client.analyzePsd(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        window: 'hann',
        overlap: 0.5,
        sampleRateHz,
      },
      iq,
      ac.signal,
    );

    // Abort on next macrotask so the job has started and yielded at least once.
    setTimeout(() => ac.abort(), 0);

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects immediately when signal already aborted', async () => {
    const client = createDspWorkerClient();
    clients.push(client);
    const ac = new AbortController();
    ac.abort();
    const iq = synthesizeToneIq({
      sampleCount: 256,
      sampleRateHz: 1e6,
      fHz: 1e4,
    });
    await expect(
      client.analyzeStft(
        {
          begin: 0n,
          end: 256n,
          fftSize: 128,
          hopSize: 64,
          window: 'hann',
          sampleRateHz: 1e6,
        },
        iq,
        ac.signal,
      ),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('DspWorkerClient worker_threads', () => {
  it('runs PSD on a real worker thread and supports cancel', async () => {
    const client = await createNodeDspWorkerClient();
    clients.push(client);

    const fftSize = 1024;
    const sampleRateHz = 1_024_000;
    const fHz = 50_000;
    const expected = frequencyToBin(fHz, sampleRateHz, fftSize);
    const sampleCount = fftSize * 8;
    const iq = synthesizeToneIq({ sampleCount, sampleRateHz, fHz });

    const result = await client.analyzePsd(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        window: 'rectangular',
        overlap: 0,
        sampleRateHz,
      },
      iq,
    );
    const peaks = findPeakBins(Float64Array.from(result.linearPower), 1, 3);
    expect(Math.abs(peaks[0]! - expected)).toBeLessThanOrEqual(1);

    // Cancel path on worker_threads
    const ac = new AbortController();
    const bigCount = fftSize * 128;
    const bigIq = synthesizeToneIq({ sampleCount: bigCount, sampleRateHz, fHz });
    const pending = client.analyzePsd(
      {
        begin: 0n,
        end: BigInt(bigCount),
        fftSize,
        window: 'hann',
        overlap: 0.5,
        sampleRateHz,
      },
      bigIq,
      ac.signal,
    );
    setTimeout(() => ac.abort(), 0);
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  }, 60_000);
});
