import { describe, expect, it } from 'vitest';
import { DEFAULT_CHUNK_BYTES, sampleIndexToDecimal } from '@wss/contracts';
import { buildPcm16LeStereoIqWav, describeWav } from './wav-meta.js';
import { openIqWavFromArrayBuffer, openIqWavFromBlob } from './wav-reader.js';
import { BlobChunkedReader } from './blob-chunked-reader.js';
import { DEFAULT_CI16_LE_IQ } from '@wss/contracts';
import {
  detectFsaCapabilities,
  FsaUnsupportedError,
  openFromFileSystemFileHandle,
  pickAndOpenIqWav,
} from './fsa.js';

/** Format fixture: PCM16 LE stereo IQ tone — not a live capture. */
function makeFixtureToneWav(options: {
  sampleCount: number;
  sampleRateHz: number;
  fHz: number;
  amp?: number;
  junkBytes?: number;
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
    junkBytes: options.junkBytes,
  });
}

describe('describeWav (restricted PCM16 LE IQ profile)', () => {
  it('parses fixture descriptor fields', () => {
    const buf = makeFixtureToneWav({
      sampleCount: 64,
      sampleRateHz: 1_000_000,
      fHz: 50_000,
      junkBytes: 8,
    });
    const d = describeWav(buf);
    expect(d.sampleRateHz).toBe(1_000_000);
    expect(sampleIndexToDecimal(d.sampleCount)).toBe('64');
    expect(sampleIndexToDecimal(d.fileBytes)).toBe(String(buf.byteLength));
    expect(Number(d.dataBytes)).toBe(64 * 4);
    expect(Number(d.dataOffset)).toBeGreaterThan(12);
    expect(d.format.componentEncoding).toBe('int16');
    expect(d.format.structure).toBe('complex_iq');
  });

  it('rejects float / wrong channel formats', () => {
    // Minimal RIFF with format=3 float would fail encoding check — craft fmt PCM but 1 ch
    const bad = new ArrayBuffer(44);
    const v = new DataView(bad);
    const w = (s: string, o: number) => {
      for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
    };
    w('RIFF', 0);
    v.setUint32(4, 36, true);
    w('WAVE', 8);
    w('fmt ', 12);
    v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);
    v.setUint16(22, 1, true); // mono — unsupported
    v.setUint32(24, 48000, true);
    v.setUint32(28, 96000, true);
    v.setUint16(32, 2, true);
    v.setUint16(34, 16, true);
    w('data', 36);
    v.setUint32(40, 0, true);
    expect(() => describeWav(bad)).toThrow(/stereo PCM16|data must/);
  });

  it('rejects RIFF size mismatch', () => {
    const buf = makeFixtureToneWav({ sampleCount: 8, sampleRateHz: 48_000, fHz: 1000 });
    const copy = buf.slice(0);
    new DataView(copy).setUint32(4, 999999, true);
    expect(() => describeWav(copy)).toThrow(/exceeds physical|does not match/);
  });
});

describe('openIqWavFromArrayBuffer + chunk boundaries', () => {
  it('reads empty / one frame / past EOF', async () => {
    const buf = makeFixtureToneWav({ sampleCount: 10, sampleRateHz: 48_000, fHz: 1000 });
    const { reader, descriptor } = openIqWavFromArrayBuffer({
      id: 'fixture-wav',
      buffer: buf,
      label: 'synthetic fixture: IQ WAV format test',
    });
    expect(sampleIndexToDecimal(descriptor.sampleCount)).toBe('10');

    const empty = await reader.read({ begin: 0n, end: 0n });
    expect(empty.samples.length).toBe(0);
    expect(empty.end).toBe(0n);

    const one = await reader.read({ begin: 0n, end: 1n });
    expect(one.samples.length).toBe(2);
    expect(one.end).toBe(1n);

    const past = await reader.read({ begin: 0n, end: 10_000n });
    expect(past.truncatedToAvailable).toBe(true);
    expect(past.end).toBe(10n);
    expect(past.samples.length).toBe(20);
  });

  it('straddles chunk budget across available-prefix', async () => {
    const sampleCount = 50_000;
    const buf = makeFixtureToneWav({
      sampleCount,
      sampleRateHz: 1_000_000,
      fHz: 10_000,
    });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'fixture-wav-chunk',
      buffer: buf,
      label: 'synthetic fixture: IQ WAV chunk budget',
      availableSamples: 20_000n,
    });
    const bpf = 4;
    const maxSamples = Math.floor(DEFAULT_CHUNK_BYTES / bpf);
    const chunk = await reader.read({
      begin: 0n,
      end: 100_000n,
      maxBytes: DEFAULT_CHUNK_BYTES,
    });
    expect(chunk.truncatedToAvailable).toBe(true);
    expect(Number(chunk.end)).toBeLessThanOrEqual(Math.min(20_000, maxSamples));
    expect(chunk.samples.length).toBe(Number(chunk.end) * 2);
  });

  it('cancels via AbortSignal', async () => {
    const buf = makeFixtureToneWav({ sampleCount: 32, sampleRateHz: 48_000, fHz: 1000 });
    const { reader } = openIqWavFromArrayBuffer({
      id: 'fixture-wav-cancel',
      buffer: buf,
      label: 'synthetic fixture: IQ WAV cancel',
    });
    const ac = new AbortController();
    ac.abort();
    await expect(reader.read({ begin: 0n, end: 8n, signal: ac.signal })).rejects.toThrow();
  });
});

describe('BlobChunkedReader + openIqWavFromBlob', () => {
  it('ranged blob reads match array buffer path', async () => {
    const buf = makeFixtureToneWav({ sampleCount: 16, sampleRateHz: 96_000, fHz: 12_000 });
    const blob = new Blob([buf], { type: 'audio/wav' });
    const opened = await openIqWavFromBlob({
      id: 'fixture-blob-wav',
      blob,
      label: 'synthetic fixture: blob IQ WAV',
    });
    const chunk = await opened.reader.read({ begin: 0n, end: 16n });
    expect(chunk.samples.length).toBe(32);
    expect(opened.descriptor.sampleRateHz).toBe(96_000);

    const direct = new BlobChunkedReader({
      id: 'payload',
      format: DEFAULT_CI16_LE_IQ,
      blob: blob.slice(
        Number(opened.descriptor.dataOffset),
        Number(opened.descriptor.dataOffset + opened.descriptor.dataBytes),
      ),
      label: 'synthetic fixture: payload blob',
    });
    const dChunk = await direct.read({ begin: 2n, end: 4n });
    expect(dChunk.samples.length).toBe(4);
  });

  it('aborts openIqWavFromBlob when signal already aborted', async () => {
    const buf = makeFixtureToneWav({ sampleCount: 4, sampleRateHz: 48_000, fHz: 1000 });
    const ac = new AbortController();
    ac.abort();
    await expect(
      openIqWavFromBlob({
        id: 'abort-open',
        blob: new Blob([buf]),
        label: 'synthetic fixture: abort open',
        signal: ac.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('FSA helpers', () => {
  it('detectFsaCapabilities reports missing APIs without throwing', () => {
    const caps = detectFsaCapabilities({} as typeof globalThis);
    expect(caps.showOpenFilePicker).toBe(false);
    expect(caps.fileSystemFileHandle).toBe(false);
    expect(caps.openLocalFile).toBe(false);
  });

  it('pickAndOpenIqWav throws FsaUnsupportedError when picker missing', async () => {
    await expect(
      pickAndOpenIqWav({ globalObj: {} as typeof globalThis }),
    ).rejects.toBeInstanceOf(FsaUnsupportedError);
  });

  it('openFromFileSystemFileHandle works with fake handle', async () => {
    const buf = makeFixtureToneWav({ sampleCount: 8, sampleRateHz: 48_000, fHz: 2000 });
    const file = new File([buf], 'tone.wav', { type: 'audio/wav' });
    const handle = {
      name: 'tone.wav',
      async getFile() {
        return file;
      },
    };
    const opened = await openFromFileSystemFileHandle({
      handle,
      asIqWav: true,
    });
    expect(opened.descriptor?.sampleRateHz).toBe(48_000);
    const chunk = await opened.reader.read({ begin: 0n, end: 8n });
    expect(chunk.samples.length).toBe(16);
  });
});
