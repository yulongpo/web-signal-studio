/**
 * File IQ ChunkedReader → STFT spectrogram (parallel to synthetic fixture).
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildPcm16LeStereoIqWav,
  openIqWavFromArrayBuffer,
} from '@wss/file-io';
import {
  createDspWorkerClient,
  InProcessAsyncBackend,
  type DspWorkerClient,
} from '@wss/dsp-wasm';
import { computeFileSpectrogram } from './computeFileSpectrogram';
import {
  clearIqFileSession,
  getIqFileEpoch,
  getIqFileSession,
  setIqFileSession,
  subscribeIqFileSession,
} from './iqFileSession';
import {
  clearOpenedIq,
  openIqFromFileBlob,
  openIqFromFiles,
  classifyIqFileName,
  DEFAULT_RAW_SAMPLE_RATE_HZ,
} from './openIqForMainChart';
import { makeSyntheticSigmfMeta } from '@wss/file-io';

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
  clearIqFileSession();
  clearOpenedIq();
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('computeFileSpectrogram', () => {
  it('STFTs opened WAV with explicit non-synthetic sourceLabel', async () => {
    const fftSize = 256;
    const hopSize = 64;
    const sampleRateHz = 1_000_000;
    const sampleCount = fftSize + 15 * hopSize;
    const buf = makeFixtureToneWav(sampleCount, sampleRateHz, 100_000);
    const { reader } = openIqWavFromArrayBuffer({
      id: 'input:tone.wav',
      buffer: buf,
      label: 'user-picked file: tone.wav',
    });
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const sourceLabel = 'user-picked IQ WAV (file input): tone.wav';
    const result = await computeFileSpectrogram({
      reader,
      client,
      sampleRateHz,
      sourceLabel,
      fftSize,
      hopSize,
    });

    expect(result.sourceLabel).toBe(sourceLabel);
    expect(result.sourceLabel.toLowerCase()).not.toContain('synthetic');
    expect(result.binCount).toBe(256);
    expect(result.frameCount).toBeGreaterThan(0);
    expect(result.samplesRead).toBe(BigInt(sampleCount));
    expect(result.window).toBe('hann');
    expect(result.fftSize).toBe(fftSize);
    expect(result.hopSize).toBe(hopSize);
    expect(result.overlap).toBeCloseTo(1 - hopSize / fftSize, 10);
    let max = 0;
    for (let i = 0; i < result.power.length; i++) max = Math.max(max, result.power[i]!);
    expect(max).toBeCloseTo(1, 5);
  });
});

describe('openIqForMainChart / iqFileSession', () => {
  it('openIqFromFileBlob publishes session with file-input label', async () => {
    const buf = makeFixtureToneWav(512, 1_000_000, 50_000);
    const blob = new Blob([buf], { type: 'audio/wav' });
    const outcome = await openIqFromFileBlob(blob, { fileName: 'demo-iq.wav' });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.via).toBe('input');
    expect(outcome.fileName).toBe('demo-iq.wav');
    expect(outcome.sourceLabel).toContain('file input');
    expect(outcome.sourceLabel.toLowerCase()).not.toContain('synthetic');
    expect(getIqFileSession()?.fileName).toBe('demo-iq.wav');
  });

  it('setIqFileSession bumps epoch for subscribers', () => {
    const buf = makeFixtureToneWav(256, 1_000_000, 10_000);
    const { reader, descriptor } = openIqWavFromArrayBuffer({
      id: 'input:e.wav',
      buffer: buf,
      label: 'user-picked file: e.wav',
    });
    const before = getIqFileEpoch();
    let notified = 0;
    const unsub = subscribeIqFileSession(() => {
      notified += 1;
    });
    setIqFileSession({
      reader,
      sampleRateHz: descriptor.sampleRateHz,
      sourceLabel: 'user-picked IQ WAV (file input): e.wav',
      fileName: 'e.wav',
      via: 'input',
      format: 'wav',
    });
    expect(getIqFileEpoch()).toBe(before + 1);
    expect(notified).toBe(1);
    unsub();
  });
});

describe('openIq RAW / SigMF dispatch', () => {
  it('classifies extensions', () => {
    expect(classifyIqFileName('a.wav')).toBe('wav');
    expect(classifyIqFileName('x.iq')).toBe('raw');
    expect(classifyIqFileName('x.raw')).toBe('raw');
    expect(classifyIqFileName('x.ci16')).toBe('raw');
    expect(classifyIqFileName('x.sigmf-meta')).toBe('sigmf-meta');
    expect(classifyIqFileName('x.sigmf-data')).toBe('sigmf-data');
  });

  it('opens RAW CI16 blob with explicit raw format label', async () => {
    const sampleCount = 64;
    const buf = new ArrayBuffer(sampleCount * 4);
    const view = new DataView(buf);
    for (let s = 0; s < sampleCount; s++) {
      view.setInt16(s * 4, 100, true);
      view.setInt16(s * 4 + 2, -50, true);
    }
    const blob = new Blob([buf]);
    const outcome = await openIqFromFileBlob(blob, { fileName: 'tone.iq' });
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.format).toBe('raw');
    expect(outcome.sampleRateHz).toBe(DEFAULT_RAW_SAMPLE_RATE_HZ);
    expect(outcome.sourceLabel).toContain('RAW');
    expect(outcome.sourceLabel.toLowerCase()).not.toContain('synthetic');
    expect(getIqFileSession()?.format).toBe('raw');
  });

  it('opens SigMF meta+data pair', async () => {
    const sampleCount = 32;
    const data = new ArrayBuffer(sampleCount * 4);
    const view = new DataView(data);
    for (let s = 0; s < sampleCount; s++) {
      view.setInt16(s * 4, s, true);
      view.setInt16(s * 4 + 2, -s, true);
    }
    const metaDoc = makeSyntheticSigmfMeta({
      datatype: 'ci16_le',
      sampleRateHz: 2_000_000,
      frequencyHz: 100e6,
    });
    const metaBlob = new Blob([JSON.stringify(metaDoc)], { type: 'application/json' });
    const dataBlob = new Blob([data]);
    const outcome = await openIqFromFiles([
      { file: metaBlob, name: 'pair.sigmf-meta' },
      { file: dataBlob, name: 'pair.sigmf-data' },
    ]);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.format).toBe('sigmf');
    expect(outcome.sampleRateHz).toBe(2_000_000);
    expect(outcome.sourceLabel).toContain('SigMF');
    expect(getIqFileSession()?.format).toBe('sigmf');
  });

  it('rejects SigMF meta without data', async () => {
    const metaBlob = new Blob(['{}'], { type: 'application/json' });
    const outcome = await openIqFromFiles([{ file: metaBlob, name: 'only.sigmf-meta' }]);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.message).toMatch(/sigmf-meta and .sigmf-data/i);
  });
});
