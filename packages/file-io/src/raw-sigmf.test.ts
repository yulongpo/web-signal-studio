import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CI16_LE_IQ,
  ComponentEncoding,
  SampleStructure,
  sampleIndexToDecimal,
} from '@wss/contracts';
import { describeRaw, openRawCi16LeIq, openRawArrayBuffer } from './raw-reader.js';
import {
  datatypeToSampleFormat,
  makeSyntheticSigmfMeta,
  parseSigmfMeta,
  SigmfMetaError,
} from './sigmf-meta.js';
import { openSigmfArrayBuffer } from './sigmf-reader.js';

/** SYNTHETIC ONLY — tiny CI16 LE IQ ramp, not a real capture. */
function makeSyntheticCi16Buffer(sampleCount: number, headerBytes = 0, trailerBytes = 0): ArrayBuffer {
  const bpf = 4; // int16 I + int16 Q
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

describe('RAW reader (synthetic fixtures)', () => {
  it('describes CI16 LE IQ with header/trailer decimal strings', () => {
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
    expect(d.sampleRateHz).toBe(1e6);
  });

  it('openRawCi16LeIq skips header and decodes IQ', async () => {
    const buf = makeSyntheticCi16Buffer(16, 8, 4);
    const reader = openRawCi16LeIq({
      id: 'synthetic-raw-ci16',
      buffer: buf,
      label: 'synthetic fixture: RAW CI16 with header/trailer',
      headerBytes: '8',
      trailerBytes: '4',
      sampleRateHz: 2e6,
    });
    const prefix = reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe('16');
    const chunk = await reader.read({ begin: 0n, end: 2n });
    expect(chunk.samples.length).toBe(4);
    // sample 0: I=0/32768, Q=0/32768
    expect(chunk.samples[0]).toBeCloseTo(0, 5);
    expect(chunk.samples[1]).toBeCloseTo(0, 5);
    // sample 1: I=1/32768
    expect(chunk.samples[2]).toBeCloseTo(1 / 32768, 7);
  });

  it('rejects header+trailer larger than buffer', () => {
    expect(() =>
      openRawArrayBuffer({
        id: 'bad',
        buffer: new ArrayBuffer(4),
        format: { ...DEFAULT_CI16_LE_IQ, headerBytes: '8', trailerBytes: '0' },
        label: 'synthetic fixture: oversized header',
      }),
    ).toThrow(/exceed/);
  });
});

describe('SigMF meta + reader (synthetic fixtures)', () => {
  it('maps common datatypes ci16_le and cf32_le', () => {
    const ci = datatypeToSampleFormat('ci16_le');
    expect(ci.structure).toBe(SampleStructure.ComplexIQ);
    expect(ci.componentEncoding).toBe(ComponentEncoding.Int16);
    expect(ci.byteOrder).toBe('le');

    const cf = datatypeToSampleFormat('cf32_le');
    expect(cf.structure).toBe(SampleStructure.ComplexIQ);
    expect(cf.componentEncoding).toBe(ComponentEncoding.Float32);
  });

  it('rejects desktop-unsupported u16 datatype (no guess)', () => {
    expect(() => datatypeToSampleFormat('cu16_le')).toThrow(SigmfMetaError);
    expect(() => datatypeToSampleFormat('ci16')).toThrow(/endian required/);
  });

  it('parses synthetic SigMF: offset is external, header_bytes is disk', () => {
    const doc = makeSyntheticSigmfMeta({
      datatype: 'ci16_le',
      sampleRateHz: 1_024_000,
      frequencyHz: 915e6,
      offsetBytes: 8,
      headerBytes: 16,
      trailingBytes: 4,
    });
    const parsed = parseSigmfMeta(JSON.stringify(doc));
    expect(parsed.datatype).toBe('ci16_le');
    expect(parsed.sampleRateHz).toBe(1_024_000);
    expect(parsed.centerFrequencyHz).toBe(915e6);
    // Desktop: core:offset ≠ disk header
    expect(parsed.externalSampleOffset).toBe('8');
    expect(parsed.datasetOffsetBytes).toBe('8');
    expect(parsed.format.headerBytes).toBe('16');
    expect(parsed.format.trailerBytes).toBe('4');
    expect(parsed.warnings.some((w) => w.includes('外部样本编号'))).toBe(true);
    expect(parsed.provenance).toMatch(/^SigMF 1\.0\.0$/);
  });

  it('requires version / captures / annotations like desktop', () => {
    expect(() =>
      parseSigmfMeta({
        global: { 'core:datatype': 'ci16_le', 'core:version': '2.0.0' },
        captures: [{ 'core:sample_start': 0 }],
        annotations: [],
      }),
    ).toThrow(/version/);
    expect(() =>
      parseSigmfMeta({
        global: { 'core:datatype': 'ci16_le', 'core:version': '1.0.0' },
        captures: [{ 'core:sample_start': 0 }],
      }),
    ).toThrow(/annotations/);
  });

  it('openSigmfArrayBuffer uses capture header_bytes for disk skip', async () => {
    const sampleCount = 32;
    const header = 8;
    const trailer = 0;
    const data = makeSyntheticCi16Buffer(sampleCount, header, trailer);
    const meta = makeSyntheticSigmfMeta({
      datatype: 'ci16_le',
      sampleRateHz: 1e6,
      frequencyHz: 100e6,
      headerBytes: header,
    });
    const handle = openSigmfArrayBuffer({
      id: 'synthetic-sigmf',
      meta,
      data,
      label: 'synthetic fixture: SigMF CI16 pair',
      dataPathStub: 'synthetic://fixtures/two-tone.sigmf-data',
    });
    expect(handle.meta.sampleRateHz).toBe(1e6);
    expect(handle.meta.format.headerBytes).toBe('8');
    expect(handle.dataPathStub).toContain('synthetic');
    const prefix = handle.reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.totalSamples)).toBe(String(sampleCount));
    const chunk = await handle.reader.read({ begin: 1n, end: 3n });
    expect(Number(chunk.end - chunk.begin)).toBe(2);
    expect(chunk.samples.length).toBe(4);
  });
});
