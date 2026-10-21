/**
 * Open restricted IQ WAV as ChunkedReader over ArrayBuffer or Blob/File.
 * Payload-only reads: header is skipped via dataOffset (blob.slice / buffer slice).
 */
import type { SampleIndex } from '@wss/contracts';
import { DEFAULT_CI16_LE_IQ, sampleIndexToDecimal } from '@wss/contracts';
import { ArrayBufferChunkedReader, type ChunkedReader } from './chunked-reader.js';
import { BlobChunkedReader } from './blob-chunked-reader.js';
import { describeWav, type WavDescriptor } from './wav-meta.js';

export interface IqWavOpenResult {
  reader: ChunkedReader;
  descriptor: WavDescriptor;
}

function payloadFormat() {
  return {
    ...DEFAULT_CI16_LE_IQ,
    // Payload view has no header/trailer; offsets already applied by slice.
    headerBytes: '0',
    trailerBytes: '0',
  };
}

function assertSafeSpan(offset: SampleIndex, length: SampleIndex, label: string): {
  offset: number;
  length: number;
} {
  const o = Number(offset);
  const n = Number(length);
  if (!Number.isSafeInteger(o) || !Number.isSafeInteger(n)) {
    throw new RangeError(label + ' span exceeds Number.MAX_SAFE_INTEGER');
  }
  return { offset: o, length: n };
}

/**
 * Describe + open an in-memory WAV buffer as a ChunkedReader over the data payload only.
 */
export function openIqWavFromArrayBuffer(options: {
  id: string;
  buffer: ArrayBuffer | Uint8Array;
  label: string;
  availableSamples?: SampleIndex;
}): IqWavOpenResult {
  const bytes =
    options.buffer instanceof Uint8Array
      ? options.buffer
      : new Uint8Array(options.buffer);
  const descriptor = describeWav(bytes);
  const { offset, length } = assertSafeSpan(
    descriptor.dataOffset,
    descriptor.dataBytes,
    'WAV data',
  );
  const payload = bytes.buffer.slice(
    bytes.byteOffset + offset,
    bytes.byteOffset + offset + length,
  ) as ArrayBuffer;
  const reader = new ArrayBufferChunkedReader({
    id: options.id,
    format: payloadFormat(),
    buffer: payload,
    availableSamples: options.availableSamples,
    label: options.label,
  });
  return { reader, descriptor };
}

/**
 * Describe + open a Blob/File WAV. Reads the full blob once to validate RIFF,
 * then ranges over a payload-only sub-blob for chunked IQ reads.
 *
 * For very large files a future path could parse headers with partial reads;
 * this drop validates the full RIFF layout (Qt parity) before publishing.
 */
export async function openIqWavFromBlob(options: {
  id: string;
  blob: Blob;
  label: string;
  availableSamples?: SampleIndex;
  signal?: AbortSignal;
}): Promise<IqWavOpenResult> {
  if (options.signal?.aborted) {
    const reason = options.signal.reason;
    throw reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
  }
  const buffer = await options.blob.arrayBuffer();
  if (options.signal?.aborted) {
    const reason = options.signal.reason;
    throw reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
  }
  const descriptor = describeWav(buffer);
  const { offset, length } = assertSafeSpan(
    descriptor.dataOffset,
    descriptor.dataBytes,
    'WAV data',
  );
  const payloadBlob = options.blob.slice(offset, offset + length);
  const reader = new BlobChunkedReader({
    id: options.id,
    format: payloadFormat(),
    blob: payloadBlob,
    availableSamples: options.availableSamples,
    label: options.label,
  });
  return { reader, descriptor };
}

export { describeWav, sampleIndexToDecimal };
export type { WavDescriptor };
