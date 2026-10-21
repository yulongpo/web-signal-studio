import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CI16_LE_IQ,
  DEFAULT_CHUNK_BYTES,
  ComponentEncoding,
  SampleStructure,
  sampleIndexToDecimal,
} from '@wss/contracts';
import { ArrayBufferChunkedReader, bytesPerFrame } from './chunked-reader.js';
import { BlobChunkedReader } from './blob-chunked-reader.js';
import { describeRaw, openRawCi16LeIq, openRawArrayBuffer } from './raw-reader.js';
import {
  datatypeToSampleFormat,
  makeSyntheticSigmfMeta,
  parseSigmfMeta,
} from './sigmf-meta.js';
import { openSigmfArrayBuffer } from './sigmf-reader.js';
import { buildPcm16LeStereoIqWav, describeWav } from './wav-meta.js';
import { openIqWavFromArrayBuffer, openIqWavFromBlob } from './wav-reader.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * M-02 acceptance golden: RAW / SigMF / WAV chunked read + boundaries.
 * All fixtures are SYNTHETIC / labeled — not live captures.
 */

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

/** Tiny CI16 LE IQ ramp with optional header/trailer. SYNTHETIC ONLY. */
function makeSyntheticCi16Buffer(
  sampleCount: number,
  headerBytes = 0,
  trailerBytes = 0,
): ArrayBuffer {
  const bpf = 4;
  const total = headerBytes + sampleCount * bpf + trailerBytes;
  const buf = new ArrayBuffer(total);
  const view = new DataView(buf);
  for (let i = 0; i < headerBytes; i++) view.setUint8(i, 0xaa);
  for (let s = 0; s < sampleCount; s++) {
    const off = headerBytes + s * bpf;
    view.setInt16(off, s & 0xffff, true);
    view.setInt16(off + 2, -(s & 0x7fff), true);
  }
  for (let i = 0; i < trailerBytes; i++) {
    view.setUint8(headerBytes + sampleCount * bpf + i, 0xbb);
  }
  return buf;
}

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

describe('M-02 RAW chunked read + boundaries (synthetic)', () => {
  it('describe/open with header/trailer decimal strings', () => {
    const format = {
      ...DEFAULT_CI16_LE_IQ,
      headerBytes: '8',
      trailerBytes: '4',
    };
    const d = describeRaw({ byteLength: 8 + 10 * 4 + 4, format, sampleRateHz: 1e6 });
    expect(d.kind).toBe('raw');
    expect(sampleIndexToDecimal(d.totalSamples)).toBe('10');
    expect(sampleIndexToDecimal(d.payloadByteOffset)).toBe('8');
    expect(d.bytesPerFrame).toBe(4);

    const buf = makeSyntheticCi16Buffer(16, 8, 4);
    const reader = openRawCi16LeIq({
      id: 'm02-raw-hdr',
      buffer: buf,
      label: 'synthetic fixture: M-02 RAW CI16 header/trailer',
      headerBytes: '8',
      trailerBytes: '4',
      sampleRateHz: 2e6,
    });
    expect(sampleIndexToDecimal(reader.availablePrefix().totalSamples)).toBe('16');
  });

  it('chunked ranged read returns correct IQ values', async () => {
    const buf = makeSyntheticCi16Buffer(32, 0, 0);
    const reader = openRawCi16LeIq({
      id: 'm02-raw-range',
      buffer: buf,
      label: 'synthetic fixture: M-02 RAW ranged',
    });
    const chunk = await reader.read({ begin: 4n, end: 7n });
    expect(Number(chunk.begin)).toBe(4);
    expect(Number(chunk.end)).toBe(7);
    expect(chunk.samples.length).toBe(6);
    expect(chunk.samples[0]).toBeCloseTo(4 / 32768, 7);
    expect(chunk.bytesRead).toBe(12);
  });

  it('empty / one-frame / past-EOF / straddle available-prefix', async () => {
    const buf = makeSyntheticCi16Buffer(20, 4, 0);
    const reader = openRawCi16LeIq({
      id: 'm02-raw-bounds',
      buffer: buf,
      label: 'synthetic fixture: M-02 RAW boundaries',
      headerBytes: '4',
      availableSamples: 12n,
    });

    const empty = await reader.read({ begin: 0n, end: 0n });
    expect(empty.samples.length).toBe(0);
    expect(empty.end).toBe(0n);

    const one = await reader.read({ begin: 5n, end: 6n });
    expect(one.samples.length).toBe(2);
    expect(one.end).toBe(6n);

    const past = await reader.read({ begin: 0n, end: 10_000n });
    expect(past.truncatedToAvailable).toBe(true);
    expect(past.end).toBe(12n);
    expect(past.samples.length).toBe(24);

    const prefix = reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.availableSamples)).toBe('12');
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe('20');
    expect(prefix.status).toBe('partial');
  });

  it('honours maxBytes chunk budget (straddle)', async () => {
    const bpf = bytesPerFrame(DEFAULT_CI16_LE_IQ);
    const sampleCount = 100_000;
    const buf = makeSyntheticCi16Buffer(sampleCount);
    const reader = openRawArrayBuffer({
      id: 'm02-raw-budget',
      buffer: buf,
      format: DEFAULT_CI16_LE_IQ,
      label: 'synthetic fixture: M-02 RAW chunk budget',
      availableSamples: 50_000n,
    });
    const maxSamples = Math.floor(DEFAULT_CHUNK_BYTES / bpf);
    const chunk = await reader.read({
      begin: 0n,
      end: 200_000n,
      maxBytes: DEFAULT_CHUNK_BYTES,
    });
    expect(chunk.truncatedToAvailable).toBe(true);
    expect(Number(chunk.end - chunk.begin)).toBeLessThanOrEqual(Math.min(50_000, maxSamples));
    expect(chunk.samples.length).toBe(Number(chunk.end - chunk.begin) * 2);
  });

  it('cancels via AbortSignal', async () => {
    const buf = makeSyntheticCi16Buffer(64);
    const reader = openRawCi16LeIq({
      id: 'm02-raw-cancel',
      buffer: buf,
      label: 'synthetic fixture: M-02 RAW cancel',
    });
    const ac = new AbortController();
    ac.abort();
    await expect(reader.read({ begin: 0n, end: 8n, signal: ac.signal })).rejects.toThrow();
  });

  it('rejects oversized header+trailer', () => {
    expect(() =>
      openRawArrayBuffer({
        id: 'm02-raw-bad',
        buffer: new ArrayBuffer(4),
        format: { ...DEFAULT_CI16_LE_IQ, headerBytes: '8', trailerBytes: '0' },
        label: 'synthetic fixture: M-02 oversized header',
      }),
    ).toThrow(/exceed/);
  });
});

describe('M-02 SigMF meta + chunked data boundaries (synthetic)', () => {
  it('maps datatypes and parses meta with offset/trailer', () => {
    const ci = datatypeToSampleFormat('ci16_le');
    expect(ci.structure).toBe(SampleStructure.ComplexIQ);
    expect(ci.componentEncoding).toBe(ComponentEncoding.Int16);

    const doc = makeSyntheticSigmfMeta({
      datatype: 'ci16_le',
      sampleRateHz: 1_024_000,
      frequencyHz: 915e6,
      offsetBytes: 8,
      trailingBytes: 4,
      description: 'SYNTHETIC fixture M-02 — not a real capture',
    });
    const parsed = parseSigmfMeta(JSON.stringify(doc));
    expect(parsed.datatype).toBe('ci16_le');
    expect(parsed.sampleRateHz).toBe(1_024_000);
    expect(parsed.centerFrequencyHz).toBe(915e6);
    expect(parsed.datasetOffsetBytes).toBe('8');
    expect(parsed.format.trailerBytes).toBe('4');
  });

  it('openSigmfArrayBuffer: empty / one / past-EOF / available-prefix / cancel', async () => {
    const sampleCount = 24;
    const header = 8;
    const data = makeSyntheticCi16Buffer(sampleCount, header, 0);
    const meta = makeSyntheticSigmfMeta({
      datatype: 'ci16_le',
      sampleRateHz: 1e6,
      frequencyHz: 100e6,
      offsetBytes: header,
      description: 'SYNTHETIC fixture M-02 SigMF pair — not a real capture',
    });
    const handle = openSigmfArrayBuffer({
      id: 'm02-sigmf',
      meta,
      data,
      label: 'synthetic fixture: M-02 SigMF CI16 pair',
      dataPathStub: 'synthetic://fixtures/m02.sigmf-data',
      availableSamples: 10n,
    });
    expect(handle.meta.sampleRateHz).toBe(1e6);
    expect(handle.dataPathStub).toContain('synthetic');

    const prefix = handle.reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe(String(sampleCount));
    expect(sampleIndexToDecimal(prefix.availableSamples)).toBe('10');
    expect(prefix.status).toBe('partial');

    const empty = await handle.reader.read({ begin: 0n, end: 0n });
    expect(empty.samples.length).toBe(0);

    const one = await handle.reader.read({ begin: 2n, end: 3n });
    expect(one.samples.length).toBe(2);
    expect(one.end).toBe(3n);

    const past = await handle.reader.read({ begin: 0n, end: 999n });
    expect(past.truncatedToAvailable).toBe(true);
    expect(past.end).toBe(10n);

    const ac = new AbortController();
    ac.abort();
    await expect(
      handle.reader.read({ begin: 0n, end: 4n, signal: ac.signal }),
    ).rejects.toThrow();
  });

  it('loads labeled e2e tiny.sigmf-* fixtures when present', async () => {
    const metaPath = join(REPO_ROOT, 'apps', 'web', 'e2e', 'fixtures', 'tiny.sigmf-meta');
    const dataPath = join(REPO_ROOT, 'apps', 'web', 'e2e', 'fixtures', 'tiny.sigmf-data');
    const metaText = readFileSync(metaPath, 'utf8');
    const data = readFileSync(dataPath);
    const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const handle = openSigmfArrayBuffer({
      id: 'm02-tiny-sigmf',
      meta: metaText,
      data: ab,
      label: 'synthetic fixture: e2e tiny.sigmf pair (labeled, not live)',
      dataPathStub: 'apps/web/e2e/fixtures/tiny.sigmf-data',
    });
    expect(handle.meta.datatype).toBe('ci16_le');
    expect(handle.meta.sampleRateHz).toBe(1_000_000);
    expect(handle.meta.centerFrequencyHz).toBe(915_000_000);
    const total = Number(handle.reader.availablePrefix().totalSamples);
    // 512 bytes / 4 bpf = 128 frames
    expect(total).toBe(128);
    const chunk = await handle.reader.read({ begin: 0n, end: 4n });
    expect(chunk.samples.length).toBe(8);
    const past = await handle.reader.read({ begin: 120n, end: 10_000n });
    expect(past.truncatedToAvailable).toBe(true);
    expect(past.end).toBe(128n);
  });
});

describe('M-02 WAV PCM16 LE stereo IQ + BlobChunkedReader boundaries (synthetic)', () => {
  it('describeWav + empty / one / past-EOF', async () => {
    const buf = makeFixtureToneWav({
      sampleCount: 10,
      sampleRateHz: 48_000,
      fHz: 1000,
      junkBytes: 8,
    });
    const d = describeWav(buf);
    expect(d.sampleRateHz).toBe(48_000);
    expect(sampleIndexToDecimal(d.sampleCount)).toBe('10');

    const { reader } = openIqWavFromArrayBuffer({
      id: 'm02-wav',
      buffer: buf,
      label: 'synthetic fixture: M-02 IQ WAV boundaries',
    });
    const empty = await reader.read({ begin: 0n, end: 0n });
    expect(empty.samples.length).toBe(0);
    const one = await reader.read({ begin: 0n, end: 1n });
    expect(one.samples.length).toBe(2);
    const past = await reader.read({ begin: 0n, end: 10_000n });
    expect(past.truncatedToAvailable).toBe(true);
    expect(past.end).toBe(10n);
  });

  it('BlobChunkedReader ranged reads + abort + available-prefix', async () => {
    const buf = makeFixtureToneWav({
      sampleCount: 32,
      sampleRateHz: 96_000,
      fHz: 12_000,
    });
    const blob = new Blob([buf], { type: 'audio/wav' });
    const opened = await openIqWavFromBlob({
      id: 'm02-blob-wav',
      blob,
      label: 'synthetic fixture: M-02 blob IQ WAV',
      availableSamples: 16n,
    });
    const prefix = opened.reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.availableSamples)).toBe('16');
    expect(prefix.status).toBe('partial');

    const chunk = await opened.reader.read({ begin: 0n, end: 100n });
    expect(chunk.truncatedToAvailable).toBe(true);
    expect(chunk.end).toBe(16n);

    const payload = new BlobChunkedReader({
      id: 'm02-payload-blob',
      format: DEFAULT_CI16_LE_IQ,
      blob: blob.slice(
        Number(opened.descriptor.dataOffset),
        Number(opened.descriptor.dataOffset + opened.descriptor.dataBytes),
      ),
      label: 'synthetic fixture: M-02 payload blob',
      availableSamples: 8n,
    });
    const mid = await payload.read({ begin: 2n, end: 5n });
    expect(mid.samples.length).toBe(6);
    expect(mid.end).toBe(5n);

    const ac = new AbortController();
    ac.abort();
    await expect(payload.read({ begin: 0n, end: 2n, signal: ac.signal })).rejects.toThrow();
  });

  it('ArrayBufferChunkedReader available-prefix + cancel (shared path)', async () => {
    const bpf = bytesPerFrame(DEFAULT_CI16_LE_IQ);
    const buffer = new ArrayBuffer(1024 * bpf);
    const reader = new ArrayBufferChunkedReader({
      id: 'm02-ab-cancel',
      format: DEFAULT_CI16_LE_IQ,
      buffer,
      availableSamples: 100n,
      label: 'synthetic fixture: M-02 ArrayBuffer cancel',
    });
    expect(reader.availablePrefix().status).toBe('partial');
    const ac = new AbortController();
    ac.abort();
    await expect(reader.read({ begin: 0n, end: 10n, signal: ac.signal })).rejects.toThrow();
  });
});
