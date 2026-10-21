/**
 * ChunkedReader over Blob/File using ranged blob.slice().arrayBuffer().
 * Honours ChunkReadRequest sample range, DEFAULT_CHUNK_BYTES, AbortSignal,
 * and available-prefix generation bumps.
 */
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
import { clampSampleRange, makeSampleRange, sampleRangeLength } from '@wss/domain';
import {
  bytesPerFrame,
  decodeToFloat32Iq,
  type ChunkedReader,
} from './chunked-reader.js';

export interface BlobChunkedReaderOptions {
  id: string;
  format: SampleFormatDescriptor;
  /** Payload-only blob (header already stripped for WAV/RAW). */
  blob: Blob;
  availableSamples?: SampleIndex;
  /**
   * Must include "synthetic" when the blob is not a real user-picked / disk file.
   */
  label: string;
}

export class BlobChunkedReader implements ChunkedReader {
  readonly id: string;
  readonly format: SampleFormatDescriptor;
  private readonly blob: Blob;
  private readonly bytesPer: number;
  private readonly totalSamples: SampleIndex;
  private available: SampleIndex;
  private generation = 0n;
  private readonly label: string;

  constructor(options: BlobChunkedReaderOptions) {
    this.id = options.id;
    this.format = options.format;
    this.blob = options.blob;
    this.bytesPer = bytesPerFrame(options.format);
    if (this.bytesPer <= 0) throw new Error('invalid bytesPerFrame');
    const total = BigInt(Math.floor(options.blob.size / this.bytesPer));
    this.totalSamples = total;
    this.available = options.availableSamples ?? total;
    if (this.available > this.totalSamples) {
      throw new RangeError('availableSamples exceeds blob capacity');
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
    if (!Number.isSafeInteger(byteOffset) || !Number.isSafeInteger(byteLength)) {
      throw new RangeError('byte span exceeds Number.MAX_SAFE_INTEGER');
    }

    cancel.throwIfCancelled();

    const slice = this.blob.slice(byteOffset, byteOffset + byteLength);
    const buffer = await slice.arrayBuffer();
    cancel.throwIfCancelled();

    if (buffer.byteLength < byteLength) {
      throw new Error(
        'BlobChunkedReader: short read (wanted ' +
          String(byteLength) +
          ', got ' +
          String(buffer.byteLength) +
          ')',
      );
    }

    const view = new DataView(buffer);
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
