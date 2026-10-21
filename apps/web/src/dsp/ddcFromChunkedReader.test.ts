import { describe, expect, it, afterEach } from 'vitest';
import {
  buildPcm16LeStereoIqWav,
  openIqWavFromArrayBuffer,
} from '@wss/file-io';
import { createDspWorkerClient, InProcessAsyncBackend, type DspWorkerClient } from '@wss/dsp-wasm';
import { ddcFromChunkedReader } from './ddcFromChunkedReader';

/**
 * SYNTHETIC FIXTURE ONLY — labeled PCM16 stereo IQ WAV, not a live capture.
 */
function makeFixtureToneWav(options: {
  sampleCount: number;
  sampleRateHz: number;
  tones: Array<{ freqHz: number; amp?: number }>;
}): ArrayBuffer {
  const ampScale = 16000;
  const iq = new Int16Array(options.sampleCount * 2);
  for (let n = 0; n < options.sampleCount; n++) {
    let re = 0;
    let im = 0;
    for (const t of options.tones) {
      const a = (t.amp ?? 1) * ampScale;
      const p = (2 * Math.PI * t.freqHz * n) / options.sampleRateHz;
      re += a * Math.cos(p);
      im += a * Math.sin(p);
    }
    iq[n * 2] = Math.max(-32768, Math.min(32767, Math.round(re)));
    iq[n * 2 + 1] = Math.max(-32768, Math.min(32767, Math.round(im)));
  }
  return buildPcm16LeStereoIqWav({
    sampleRateHz: options.sampleRateHz,
    iqInt16: iq,
  });
}

function peakBinNearDc(iq: Float32Array, fftSize: number, sampleRateHz: number): {
  peakBin: number;
  peakHz: number;
  dcFraction: number;
} {
  const use = Math.min(iq.length / 2, fftSize);
  const start = Math.max(0, iq.length / 2 - use);
  const frame = new Float64Array(fftSize * 2);
  for (let n = 0; n < use; n++) {
    const src = (start + n) * 2;
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (fftSize - 1)));
    frame[n * 2] = iq[src]! * w;
    frame[n * 2 + 1] = iq[src + 1]! * w;
  }
  const N = fftSize;
  for (let i = 1, j = 0; i < N; i++) {
    let bit = N >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const ai = i * 2;
      const aj = j * 2;
      const tr = frame[ai]!;
      const ti = frame[ai + 1]!;
      frame[ai] = frame[aj]!;
      frame[ai + 1] = frame[aj + 1]!;
      frame[aj] = tr;
      frame[aj + 1] = ti;
    }
  }
  for (let len = 2; len <= N; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < N; i += len) {
      let wr = 1;
      let wi = 0;
      for (let j = 0; j < len / 2; j++) {
        const u = (i + j) * 2;
        const v = (i + j + len / 2) * 2;
        const tr = wr * frame[v]! - wi * frame[v + 1]!;
        const ti = wr * frame[v + 1]! + wi * frame[v]!;
        frame[v] = frame[u]! - tr;
        frame[v + 1] = frame[u + 1]! - ti;
        frame[u] = frame[u]! + tr;
        frame[u + 1] = frame[u + 1]! + ti;
        const nwr = wr * wlenRe - wi * wlenIm;
        wi = wr * wlenIm + wi * wlenRe;
        wr = nwr;
      }
    }
  }
  const power = new Float64Array(N);
  let total = 0;
  let peakBin = 0;
  let peakVal = -1;
  for (let k = 0; k < N; k++) {
    const p = frame[k * 2]! * frame[k * 2]! + frame[k * 2 + 1]! * frame[k * 2 + 1]!;
    power[k] = p;
    total += p;
    if (p > peakVal) {
      peakVal = p;
      peakBin = k;
    }
  }
  let dc = 0;
  for (let k = 0; k <= 2; k++) dc += power[k]!;
  dc += power[N - 1]! + power[N - 2]!;
  const peakHz = peakBin <= N / 2 ? (peakBin * sampleRateHz) / N : ((peakBin - N) * sampleRateHz) / N;
  return { peakBin, peakHz, dcFraction: dc / total };
}

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('ddcFromChunkedReader (synthetic fixture WAV)', () => {
  it('chunked WAV → Worker DDC → energy near DC; output rate/length match', async () => {
    const sampleRateHz = 100_000;
    const f0 = 10_000;
    const decimation = 4;
    const interpolation = 1;
    const sampleCount = 4096;
    const label = 'synthetic fixture: narrowband DDC E2E single-tone WAV';
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: f0, amp: 1 }],
    });
    const { reader, descriptor } = openIqWavFromArrayBuffer({
      id: 'web-fixture-ddc-e2e',
      buffer: buf,
      label,
    });
    expect(descriptor.sampleRateHz).toBe(sampleRateHz);

    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const result = await ddcFromChunkedReader({
      reader,
      client,
      sampleRateHz,
      loOffsetHz: f0,
      interpolation,
      decimation,
      maxBytes: 2048,
      sourceLabel: label,
      basebandStft: { fftSize: 512, hopSize: 128 },
    });

    expect(result.sourceLabel).toBe(label);
    expect(result.samplesRead).toBe(BigInt(sampleCount));
    expect(result.inputSampleRateHz).toBe(sampleRateHz);
    expect(result.outputSampleRateHz).toBe(sampleRateHz / decimation);
    expect(result.ddc.outputSampleRateHz).toBe(25_000);
    const nOut = Number(result.ddc.end - result.ddc.begin);
    expect(nOut).toBe(Math.floor(sampleCount / decimation));
    expect(result.ddc.samples.length).toBe(nOut * 2);

    const { peakBin, dcFraction } = peakBinNearDc(result.ddc.samples, 512, result.outputSampleRateHz);
    const dist = Math.min(peakBin, 512 - peakBin);
    expect(dist).toBeLessThanOrEqual(1);
    expect(dcFraction).toBeGreaterThan(0.8);
    expect(result.basebandStft?.frameCount).toBeGreaterThan(0);
  });

  it('two-tone: LO tone → DC; image/reject tone attenuated', async () => {
    const sampleRateHz = 100_000;
    const fKeep = 10_000;
    const fReject = 30_000;
    const decimation = 4;
    const sampleCount = 8192;
    const label = 'synthetic fixture: narrowband DDC E2E two-tone WAV';
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz,
      tones: [
        { freqHz: fKeep, amp: 1 },
        { freqHz: fReject, amp: 1 },
      ],
    });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'web-fixture-ddc-two-tone',
      buffer: buf,
      label,
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const result = await ddcFromChunkedReader({
      reader,
      client,
      sampleRateHz,
      loOffsetHz: fKeep,
      interpolation: 1,
      decimation,
      maxBytes: 4096,
      sourceLabel: label,
    });

    const fftSize = 512;
    const { peakBin, dcFraction } = peakBinNearDc(result.ddc.samples, fftSize, result.outputSampleRateHz);
    const dist = Math.min(peakBin, fftSize - peakBin);
    expect(dist).toBeLessThanOrEqual(2);
    expect(dcFraction).toBeGreaterThan(0.55);
  });

  it('rejects AbortError when aborted before read', async () => {
    const sampleRateHz = 100_000;
    const sampleCount = 4096;
    const label = 'synthetic fixture: DDC E2E abort';
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz,
      tones: [{ freqHz: 5_000 }],
    });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'web-fixture-ddc-abort',
      buffer: buf,
      label,
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    const ac = new AbortController();
    ac.abort();
    await expect(
      ddcFromChunkedReader({
        reader,
        client,
        sampleRateHz,
        loOffsetHz: 5_000,
        interpolation: 1,
        decimation: 4,
        sourceLabel: label,
        signal: ac.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('rejects when sourceLabel is empty', async () => {
    const sampleRateHz = 100_000;
    const buf = makeFixtureToneWav({
      sampleCount: 256,
      sampleRateHz,
      tones: [{ freqHz: 1_000 }],
    });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'web-fixture-ddc-nolabel',
      buffer: buf,
      label: 'synthetic fixture: missing label guard',
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    await expect(
      ddcFromChunkedReader({
        reader,
        client,
        sampleRateHz,
        loOffsetHz: 1_000,
        interpolation: 1,
        decimation: 2,
        sourceLabel: '   ',
      }),
    ).rejects.toBeInstanceOf(TypeError);
  });
});
