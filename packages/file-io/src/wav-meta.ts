/**
 * Restricted IQ WAV profile (mirrors Qt wav_metadata):
 * PCM int16 LE, 2 stored I/Q components as one complex channel.
 * No RF center frequency in this API.
 * Descriptor is published only after the entire RIFF layout is validated.
 */
import {
  type SampleFormatDescriptor,
  type SampleIndex,
  DEFAULT_CI16_LE_IQ,
  sampleIndexToDecimal,
} from '@wss/contracts';

export interface WavDescriptor {
  format: SampleFormatDescriptor;
  sampleRateHz: number;
  sampleCount: SampleIndex;
  dataOffset: SampleIndex;
  dataBytes: SampleIndex;
  fileBytes: SampleIndex;
  metadataBytesRead: SampleIndex;
}

const HEADER_READ_BUDGET = 1024 * 1024;
const CHUNK_BUDGET = 65_536;

function fail(reason: string): never {
  throw new Error('WAV: ' + reason);
}

function readAscii(view: DataView, offset: number, len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(offset + i));
  return s;
}

/**
 * Parse a full RIFF/WAVE buffer for the restricted PCM16 LE stereo IQ profile.
 * Accepts ArrayBuffer or Uint8Array covering the entire file.
 */
export function describeWav(input: ArrayBuffer | Uint8Array): WavDescriptor {
  const bytes =
    input instanceof Uint8Array
      ? input
      : new Uint8Array(input);
  const fileBytes = BigInt(bytes.byteLength);
  if (bytes.byteLength < 12) fail('RIFF header truncated');

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let metadataBytesRead = 0n;

  const charge = (n: number) => {
    metadataBytesRead += BigInt(n);
    if (metadataBytesRead > BigInt(HEADER_READ_BUDGET)) {
      fail('header parse exceeded budget');
    }
  };

  charge(12);
  const riffId = readAscii(view, 0, 4);
  if (riffId === 'RF64') fail('RF64 not supported');
  if (riffId === 'RIFX') fail('only little-endian RIFF WAVE supported');
  if (riffId !== 'RIFF') fail('need RIFF WAVE container');
  const waveId = readAscii(view, 8, 4);
  if (waveId !== 'WAVE') fail('need RIFF WAVE container');

  const riffSize = view.getUint32(4, true);
  const riffEnd = BigInt(riffSize) + 8n;
  if (riffSize < 4) fail('invalid RIFF size');
  if (riffEnd > fileBytes) fail('RIFF declared size exceeds physical file (truncated)');
  if (riffEnd !== fileBytes) fail('RIFF declared size does not match physical file');

  let foundFormat = false;
  let foundData = false;
  let sampleRateHz = 0;
  let dataOffset = 0n;
  let dataBytes = 0n;
  let sampleCount = 0n;
  let position = 12n;
  let chunks = 0;

  while (position < riffEnd) {
    if (++chunks > CHUNK_BUDGET) fail('RIFF chunk count exceeded parse budget');
    if (riffEnd - position < 8n) fail('chunk header truncated');

    const pos = Number(position);
    if (!Number.isSafeInteger(pos)) fail('chunk position exceeds safe integer');
    charge(8);
    const id = readAscii(view, pos, 4);
    const size = view.getUint32(pos + 4, true);
    const begin = position + 8n;
    if (BigInt(size) > riffEnd - begin) fail('chunk size exceeds RIFF (truncated)');
    const end = begin + BigInt(size);
    if ((size & 1) !== 0 && end === riffEnd) fail('odd-sized chunk missing pad byte');
    const next = end + BigInt(size & 1);

    if (id === 'fmt ') {
      if (foundFormat) fail('duplicate fmt chunk');
      foundFormat = true;
      if (size < 16 || size === 17) fail('fmt chunk truncated');
      const fmtOff = Number(begin);
      charge(16);
      const encoding = view.getUint16(fmtOff, true);
      const channels = view.getUint16(fmtOff + 2, true);
      const fs = view.getUint32(fmtOff + 4, true);
      const byteRate = view.getUint32(fmtOff + 8, true);
      const align = view.getUint16(fmtOff + 12, true);
      const bits = view.getUint16(fmtOff + 14, true);

      if (encoding !== 1) {
        fail('only format=1 PCM supported (no float/compressed/extensible)');
      }
      if (channels !== 2 || bits !== 16) {
        fail('only stereo PCM16 supported (I then Q)');
      }
      if (!fs) fail('sample rate must be > 0');
      const expectedByteRate = BigInt(fs) * 4n;
      if (expectedByteRate > 0xffff_ffffn) fail('byteRate overflow for sample rate');
      if (align !== 4 || BigInt(byteRate) !== expectedByteRate) {
        fail('blockAlign / byteRate mismatch for PCM16 I/Q frames');
      }
      if (size >= 18) {
        charge(2);
        const cbSize = view.getUint16(fmtOff + 16, true);
        if (cbSize !== size - 18) fail('fmt extension size mismatch');
      }
      sampleRateHz = fs;
    } else if (id === 'data') {
      if (foundData) fail('duplicate data chunk');
      foundData = true;
      if (!size || size % 4 !== 0) {
        fail('data must contain complete non-empty PCM16 I/Q frames');
      }
      dataOffset = begin;
      dataBytes = BigInt(size);
      sampleCount = dataBytes / 4n;
    }
    // JUNK, LIST, and other chunks are skipped without loading payloads into a separate buffer.
    position = next;
  }

  if (!foundFormat || !foundData) fail('missing fmt or data chunk');

  const trailerBytes = fileBytes - dataOffset - dataBytes;
  const format: SampleFormatDescriptor = {
    ...DEFAULT_CI16_LE_IQ,
    headerBytes: sampleIndexToDecimal(dataOffset),
    trailerBytes: sampleIndexToDecimal(trailerBytes),
  };

  return {
    format,
    sampleRateHz,
    sampleCount,
    dataOffset,
    dataBytes,
    fileBytes,
    metadataBytesRead,
  };
}

/** Build a minimal valid PCM16 LE stereo IQ WAV (format fixture for tests — not live IQ). */
export function buildPcm16LeStereoIqWav(options: {
  sampleRateHz: number;
  /** Interleaved int16 I/Q pairs; length must be even. */
  iqInt16: Int16Array;
  /** Optional LIST/JUNK padding between fmt and data (even byte length). */
  junkBytes?: number;
}): ArrayBuffer {
  const { sampleRateHz, iqInt16 } = options;
  if (iqInt16.length % 2 !== 0) {
    throw new RangeError('iqInt16 length must be even (I/Q pairs)');
  }
  const dataBytes = iqInt16.byteLength;
  const junk = options.junkBytes ?? 0;
  if (junk < 0 || junk % 2 !== 0) throw new RangeError('junkBytes must be even and >= 0');

  const fmtChunkSize = 16;
  // RIFF size = WAVE(4) + fmt(8+16) + optional junk(8+n) + data(8+dataBytes)
  const riffPayload =
    4 +
    (8 + fmtChunkSize) +
    (junk > 0 ? 8 + junk : 0) +
    (8 + dataBytes);
  const fileSize = 8 + riffPayload;
  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);
  let o = 0;
  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o++, s.charCodeAt(i));
  };
  writeStr('RIFF');
  view.setUint32(o, riffPayload, true);
  o += 4;
  writeStr('WAVE');
  writeStr('fmt ');
  view.setUint32(o, fmtChunkSize, true);
  o += 4;
  view.setUint16(o, 1, true); // PCM
  o += 2;
  view.setUint16(o, 2, true); // channels
  o += 2;
  view.setUint32(o, sampleRateHz, true);
  o += 4;
  view.setUint32(o, sampleRateHz * 4, true); // byteRate
  o += 4;
  view.setUint16(o, 4, true); // blockAlign
  o += 2;
  view.setUint16(o, 16, true); // bits
  o += 2;
  if (junk > 0) {
    writeStr('JUNK');
    view.setUint32(o, junk, true);
    o += 4;
    o += junk;
  }
  writeStr('data');
  view.setUint32(o, dataBytes, true);
  o += 4;
  new Uint8Array(buf, o, dataBytes).set(new Uint8Array(iqInt16.buffer, iqInt16.byteOffset, dataBytes));
  return buf;
}
