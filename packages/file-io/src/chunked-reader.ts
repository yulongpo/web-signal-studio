import {
  type AvailablePrefix,
  type ChunkReadRequest,
  type ChunkReadResponse,
  type SampleFormatDescriptor,
  type SampleIndex,
  DEFAULT_CHUNK_BYTES,
  abortSignalToCancelToken,
  sampleIndexToDecimal,
} from '@wss/contracts';
import { type SampleRange, clampSampleRange, makeSampleRange, sampleRangeLength } from '@wss/domain';

export interface ChunkedReader {
  readonly id: string;
  readonly format: SampleFormatDescriptor;
  availablePrefix(): AvailablePrefix;
  read(request: ChunkReadRequest): Promise<ChunkReadResponse>;
}

export interface RawFormatDescriptor {
  kind: 'raw';
  format: SampleFormatDescriptor;
  /** Bytes per complex (or real) sample frame. */
  bytesPerFrame: number;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
}

export function bytesPerComponent(format: SampleFormatDescriptor): number {
  switch (format.componentEncoding) {
    case 'int8':
    case 'uint8':
      return 1;
    case 'int16':
      return 2;
    case 'int32':
    case 'float32':
      return 4;
    case 'float64':
      return 8;
    default:
      throw new Error(`unknown encoding`);
  }
}

export function bytesPerFrame(format: SampleFormatDescriptor): number {
  const comp = bytesPerComponent(format);
  const compsPerSample = format.structure === 'complex_iq' ? 2 : 1;
  return comp * compsPerSample * format.channels;
}

/**
 * In-memory / ArrayBuffer-backed ranged reader.
 * For tests and Worker shims — label buffers as synthetic when not from disk.
 */
export class ArrayBufferChunkedReader implements ChunkedReader {
  readonly id: string;
  readonly format: SampleFormatDescriptor;
  private readonly bytes: ArrayBuffer;
  private readonly bytesPer: number;
  private readonly totalSamples: SampleIndex;
  private available: SampleIndex;
  private generation = 0n;
  private readonly label: string;

  constructor(options: {
    id: string;
    format: SampleFormatDescriptor;
    buffer: ArrayBuffer;
    /** How many samples are currently in the available-prefix. Defaults to full buffer. */
    availableSamples?: SampleIndex;
    /** Must say "synthetic" when buffer is not a real file mapping. */
    label: string;
  }) {
    this.id = options.id;
    this.format = options.format;
    this.bytes = options.buffer;
    this.bytesPer = bytesPerFrame(options.format);
    if (this.bytesPer <= 0) throw new Error('invalid bytesPerFrame');
    const total = BigInt(Math.floor(options.buffer.byteLength / this.bytesPer));
    this.totalSamples = total;
    this.available = options.availableSamples ?? total;
    if (this.available > this.totalSamples) {
      throw new RangeError('availableSamples exceeds buffer capacity');
    }
    this.label = options.label;
  }

  get sourceLabel(): string {
    return this.label;
  }

  setAvailableSamples(count: SampleIndex): void {
    if (count < 0n || count > this.totalSamples) {
      throw new RangeError('availableSamples out of range');
    }
    this.available = count;
    this.generation += 1n;
  }

  availablePrefix(): AvailablePrefix {
    const status =
      this.available === 0n
        ? 'failed'
        : this.available < this.totalSamples
          ? 'partial'
          : 'ready';
    return {
      availableSamples: this.available,
      totalSamples: this.totalSamples,
      status,
      generation: sampleIndexToDecimal(this.generation),
    };
  }

  async read(request: ChunkReadRequest): Promise<ChunkReadResponse> {
    const cancel = abortSignalToCancelToken(request.signal);
    cancel.throwIfCancelled();

    if (request.end < request.begin) {
      throw new RangeError('ChunkReadRequest end < begin');
    }

    const maxBytes = request.maxBytes ?? DEFAULT_CHUNK_BYTES;
    const maxSamplesByBudget = BigInt(Math.max(1, Math.floor(maxBytes / this.bytesPer)));

    const wanted = makeSampleRange(request.begin, request.end);
    const availableBounds = makeSampleRange(0n, this.available);
    const clipped = clampSampleRange(wanted, availableBounds);
    const truncatedToAvailable = clipped.end < wanted.end || clipped.begin > wanted.begin;

    let end = clipped.end;
    if (sampleRangeLength({ begin: clipped.begin, end }) > maxSamplesByBudget) {
      end = clipped.begin + maxSamplesByBudget;
    }

    cancel.throwIfCancelled();

    if (end <= clipped.begin) {
      return {
        begin: clipped.begin,
        end: clipped.begin,
        samples: new Float32Array(0),
        truncatedToAvailable,
        bytesRead: 0,
      };
    }

    const sampleCount = Number(end - clipped.begin);
    if (!Number.isSafeInteger(sampleCount)) {
      throw new RangeError('single chunk sample count exceeds Number.MAX_SAFE_INTEGER');
    }

    const byteOffset = Number(clipped.begin) * this.bytesPer;
    const byteLength = sampleCount * this.bytesPer;
    const view = new DataView(this.bytes, byteOffset, byteLength);
    const out = decodeToFloat32Iq(view, this.format, sampleCount);

    cancel.throwIfCancelled();

    return {
      begin: clipped.begin,
      end,
      samples: out,
      truncatedToAvailable: truncatedToAvailable || end < clipped.end,
      bytesRead: byteLength,
    };
  }
}

function decodeToFloat32Iq(view: DataView, format: SampleFormatDescriptor, sampleCount: number): Float32Array {
  const complex = format.structure === 'complex_iq';
  const out = new Float32Array(sampleCount * (complex ? 2 : 1));
  const little = format.byteOrder !== 'be';
  const enc = format.componentEncoding;
  let o = 0;
  for (let i = 0; i < sampleCount; i++) {
    const base = i * (complex ? 2 : 1) * bytesPerComponent(format);
    const readComp = (offset: number): number => {
      switch (enc) {
        case 'int8':
          return view.getInt8(offset) / 128;
        case 'uint8':
          return (view.getUint8(offset) - 128) / 128;
        case 'int16':
          return view.getInt16(offset, little) / 32768;
        case 'int32':
          return view.getInt32(offset, little) / 2147483648;
        case 'float32':
          return view.getFloat32(offset, little);
        case 'float64':
          return view.getFloat64(offset, little);
        default:
          throw new Error('unsupported encoding');
      }
    };
    const step = bytesPerComponent(format);
    if (complex) {
      let iVal = readComp(base);
      let qVal = readComp(base + step);
      if (format.iqLayout === 'qi') {
        const tmp = iVal;
        iVal = qVal;
        qVal = tmp;
      }
      out[o++] = iVal;
      out[o++] = qVal;
    } else {
      out[o++] = readComp(base);
    }
  }
  return out;
}

export type { SampleRange };
