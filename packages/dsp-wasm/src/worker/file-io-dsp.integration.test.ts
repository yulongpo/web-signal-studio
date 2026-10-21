/**
 * Integration: @wss/file-io chunked reader → DspWorkerClient PSD/DDC.
 * SYNTHETIC fixtures only (labeled).
 */

import { describe, expect, it, afterEach } from 'vitest';
import { DEFAULT_CI16_LE_IQ } from '@wss/contracts';
import { openRawCi16LeIq } from '@wss/file-io';
import { findPeakBins, frequencyToBin } from '../fft.js';
import { createDspWorkerClient, type DspWorkerClient } from './dsp-client.js';

/** SYNTHETIC CI16 LE IQ: single complex tone at exact DFT bin. */
function makeSyntheticCi16Tone(options: {
  sampleCount: number;
  sampleRateHz: number;
  fHz: number;
  ampInt16?: number;
}): ArrayBuffer {
  const { sampleCount, sampleRateHz, fHz } = options;
  const amp = options.ampInt16 ?? 16000;
  const buf = new ArrayBuffer(sampleCount * 4);
  const view = new DataView(buf);
  for (let n = 0; n < sampleCount; n++) {
    const p = (2 * Math.PI * fHz * n) / sampleRateHz;
    view.setInt16(n * 4, Math.round(amp * Math.cos(p)), true);
    view.setInt16(n * 4 + 2, Math.round(amp * Math.sin(p)), true);
  }
  return buf;
}

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('file-io ↔ dsp-wasm worker integration (synthetic)', () => {
  it('reads CI16 chunk then PSD via DspWorkerClient; peak sane', async () => {
    const fftSize = 1024;
    const sampleRateHz = 1_024_000;
    const fHz = 64_000;
    const expected = frequencyToBin(fHz, sampleRateHz, fftSize);
    const sampleCount = fftSize * 4;

    const buffer = makeSyntheticCi16Tone({ sampleCount, sampleRateHz, fHz });
    const reader = openRawCi16LeIq({
      id: 'synthetic-ci16-tone',
      buffer,
      label: 'synthetic fixture: CI16 tone for file-io↔dsp integration',
      sampleRateHz,
    });

    const chunk = await reader.read({ begin: 0n, end: BigInt(sampleCount) });
    expect(chunk.samples.length).toBe(sampleCount * 2);
    expect(reader.format.componentEncoding).toBe(DEFAULT_CI16_LE_IQ.componentEncoding);

    const client = createDspWorkerClient();
    clients.push(client);

    const psd = await client.analyzePsd(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        window: 'hann',
        overlap: 0.5,
        sampleRateHz,
      },
      chunk.samples,
    );

    const peaks = findPeakBins(Float64Array.from(psd.linearPower), 1, 3);
    expect(Math.abs(peaks[0]! - expected)).toBeLessThanOrEqual(1);
  });

  it('chunk → DDC via worker client returns non-empty baseband', async () => {
    const sampleRateHz = 1_000_000;
    const fHz = 125_000;
    const sampleCount = 4096;
    const buffer = makeSyntheticCi16Tone({ sampleCount, sampleRateHz, fHz });
    const reader = openRawCi16LeIq({
      id: 'synthetic-ci16-ddc',
      buffer,
      label: 'synthetic fixture: CI16 for DDC integration',
      sampleRateHz,
    });
    const chunk = await reader.read({ begin: 0n, end: BigInt(sampleCount) });

    const client = createDspWorkerClient();
    clients.push(client);

    const out = await client.processDdc(
      {
        begin: chunk.begin,
        end: chunk.end,
        loHz: fHz,
        sampleRateHz,
        interpolation: 1,
        decimation: 4,
      },
      chunk.samples,
    );

    expect(out.outputSampleRateHz).toBe(250_000);
    expect(out.samples.length).toBeGreaterThan(16);
  });

  it('aborts long PSD after chunk read without hanging', async () => {
    const fftSize = 2048;
    const sampleRateHz = 2_048_000;
    const sampleCount = fftSize * 80;
    const buffer = makeSyntheticCi16Tone({
      sampleCount,
      sampleRateHz,
      fHz: 100_000,
    });
    const reader = openRawCi16LeIq({
      id: 'synthetic-ci16-abort',
      buffer,
      label: 'synthetic fixture: large CI16 for abort integration',
      sampleRateHz,
    });
    const chunk = await reader.read({ begin: 0n, end: BigInt(sampleCount) });

    const client = createDspWorkerClient();
    clients.push(client);

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
      chunk.samples,
      ac.signal,
    );
    setTimeout(() => ac.abort(), 0);

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
