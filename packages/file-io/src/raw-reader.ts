import {
  type SampleFormatDescriptor,
  type SampleIndex,
  DEFAULT_CI16_LE_IQ,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
} from '@wss/contracts';
import {
  ArrayBufferChunkedReader,
  bytesPerFrame,
  type ChunkedReader,
  type RawFormatDescriptor,
} from './chunked-reader.js';

export interface RawDescribeOptions {
  /** Total file/buffer byte length. */
  byteLength: number;
  format?: SampleFormatDescriptor;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
}

export interface RawOpenOptions {
  id: string;
  buffer: ArrayBuffer;
  format?: SampleFormatDescriptor;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  /**
   * Must include the word "synthetic" when the buffer is not a real disk mapping.
   */
  label: string;
  availableSamples?: SampleIndex;
}

/**
 * Describe a RAW IQ/real buffer: apply header/trailer byte offsets (decimal strings)
 * and compute total sample frames from the remaining payload.
 */
export function describeRaw(options: RawDescribeOptions): RawFormatDescriptor & {
  payloadByteOffset: SampleIndex;
  payloadByteLength: SampleIndex;
  totalSamples: SampleIndex;
} {
  const format: SampleFormatDescriptor = {
    ...(options.format ?? DEFAULT_CI16_LE_IQ),
  };
  const header = sampleIndexFromDecimal(format.headerBytes);
  const trailer = sampleIndexFromDecimal(format.trailerBytes);
  const totalBytes = BigInt(options.byteLength);
  if (header + trailer > totalBytes) {
    throw new RangeError(
      `RAW header (${format.headerBytes}) + trailer (${format.trailerBytes}) exceed byteLength ${options.byteLength}`,
    );
  }
  const payloadByteOffset = header;
  const payloadByteLength = totalBytes - header - trailer;
  const bpf = BigInt(bytesPerFrame(format));
  if (bpf <= 0n) throw new Error('invalid bytesPerFrame');
  const totalSamples = payloadByteLength / bpf;

  return {
    kind: 'raw',
    format,
    bytesPerFrame: Number(bpf),
    sampleRateHz: options.sampleRateHz,
    centerFrequencyHz: options.centerFrequencyHz,
    payloadByteOffset,
    payloadByteLength,
    totalSamples,
  };
}

/**
 * Open an in-memory RAW buffer as a ChunkedReader.
 * Payload excludes headerBytes / trailerBytes from the SampleFormatDescriptor.
 */
export function openRawArrayBuffer(options: RawOpenOptions): ChunkedReader {
  const described = describeRaw({
    byteLength: options.buffer.byteLength,
    format: options.format,
    sampleRateHz: options.sampleRateHz,
    centerFrequencyHz: options.centerFrequencyHz,
  });
  const header = Number(described.payloadByteOffset);
  const payloadLen = Number(described.payloadByteLength);
  if (!Number.isSafeInteger(header) || !Number.isSafeInteger(payloadLen)) {
    throw new RangeError('RAW payload span exceeds Number.MAX_SAFE_INTEGER for ArrayBuffer slice');
  }
  // Slice payload region so the reader sees only sample bytes.
  const payload = options.buffer.slice(header, header + payloadLen);
  const formatWithoutOffsets: SampleFormatDescriptor = {
    ...described.format,
    headerBytes: '0',
    trailerBytes: '0',
  };
  return new ArrayBufferChunkedReader({
    id: options.id,
    format: formatWithoutOffsets,
    buffer: payload,
    availableSamples: options.availableSamples,
    label: options.label,
  });
}

/** Convenience: CI16 LE interleaved IQ default. */
export function openRawCi16LeIq(options: {
  id: string;
  buffer: ArrayBuffer;
  label: string;
  headerBytes?: string;
  trailerBytes?: string;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  availableSamples?: SampleIndex;
}): ChunkedReader {
  const format: SampleFormatDescriptor = {
    ...DEFAULT_CI16_LE_IQ,
    headerBytes: options.headerBytes ?? '0',
    trailerBytes: options.trailerBytes ?? '0',
  };
  return openRawArrayBuffer({
    id: options.id,
    buffer: options.buffer,
    format,
    label: options.label,
    sampleRateHz: options.sampleRateHz,
    centerFrequencyHz: options.centerFrequencyHz,
    availableSamples: options.availableSamples,
  });
}

export function rawPayloadSampleCount(
  byteLength: number,
  format: SampleFormatDescriptor,
): SampleIndex {
  return describeRaw({ byteLength, format }).totalSamples;
}

export { sampleIndexToDecimal };
