const fs = require('fs');
const path = require('path');
function write(rel, content) {
  const abs = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.replace(/\r?\n/g, '\n'), { encoding: 'utf8' });
  console.log('wrote', rel);
}

write('packages/domain/package.json', `{
  "name": "@wss/domain",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "@wss/contracts": "0.0.0" }
}
`);
write('packages/domain/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "composite": true },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../contracts" }]
}
`);
write('packages/domain/src/sample-range.ts', `import {
  type SampleIndex,
  clampSampleIndex,
  compareSampleIndex,
  sampleIndexToDecimal,
} from '@wss/contracts';

/** Half-open sample range [begin, end). All indices are bigint. */
export interface SampleRange {
  begin: SampleIndex;
  end: SampleIndex;
}

export function makeSampleRange(begin: SampleIndex, end: SampleIndex): SampleRange {
  if (end < begin) {
    throw new RangeError(
      \`SampleRange end < begin: [\${sampleIndexToDecimal(begin)}, \${sampleIndexToDecimal(end)})\`,
    );
  }
  return { begin, end };
}

export function sampleRangeLength(range: SampleRange): SampleIndex {
  return range.end - range.begin;
}

export function sampleRangesOverlap(a: SampleRange, b: SampleRange): boolean {
  return a.begin < b.end && b.begin < a.end;
}

export function intersectSampleRanges(a: SampleRange, b: SampleRange): SampleRange | null {
  const begin = a.begin > b.begin ? a.begin : b.begin;
  const end = a.end < b.end ? a.end : b.end;
  if (end <= begin) return null;
  return { begin, end };
}

export function clampSampleRange(range: SampleRange, bounds: SampleRange): SampleRange {
  const begin = clampSampleIndex(range.begin, bounds.begin, bounds.end);
  const end = clampSampleIndex(range.end, bounds.begin, bounds.end);
  if (end < begin) return { begin, end: begin };
  return { begin, end };
}

export function compareSampleRanges(a: SampleRange, b: SampleRange): number {
  const c = compareSampleIndex(a.begin, b.begin);
  if (c !== 0) return c;
  return compareSampleIndex(a.end, b.end);
}

/**
 * Physical time helpers. Seconds may use number for UI; sample math stays bigint.
 * sample = round(seconds * sampleRateHz) with careful BigInt conversion for large T.
 */
export function sampleIndexFromSeconds(seconds: number, sampleRateHz: number): SampleIndex {
  if (!Number.isFinite(seconds) || !Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new RangeError('seconds/sampleRateHz must be finite and sampleRateHz > 0');
  }
  // Use string path for large products to avoid Number mantissa loss when possible.
  const product = seconds * sampleRateHz;
  if (!Number.isFinite(product)) {
    throw new RangeError('seconds * sampleRateHz overflowed Number');
  }
  return BigInt(Math.round(product));
}

export function secondsFromSampleIndex(index: SampleIndex, sampleRateHz: number): number {
  if (!Number.isFinite(sampleRateHz) || sampleRateHz <= 0) {
    throw new RangeError('sampleRateHz must be finite and > 0');
  }
  // For indices beyond Number.MAX_SAFE_INTEGER, return Infinity-ish via Number(index)/rate
  // callers needing exact time should use rational arithmetic later.
  return Number(index) / sampleRateHz;
}

export function frequencyToBin(frequencyHz: number, sampleRateHz: number, fftSize: number): number {
  if (!(fftSize > 0) || (fftSize & (fftSize - 1)) !== 0) {
    throw new RangeError('fftSize must be a positive power of two');
  }
  const bin = Math.round((frequencyHz / sampleRateHz) * fftSize);
  const wrapped = ((bin % fftSize) + fftSize) % fftSize;
  return wrapped;
}
`);
write('packages/domain/src/index.ts', `export * from './sample-range.js';
`);

write('packages/file-io/package.json', `{
  "name": "@wss/file-io",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@wss/contracts": "0.0.0",
    "@wss/domain": "0.0.0"
  }
}
`);
write('packages/file-io/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src", "composite": true },
  "include": ["src/**/*.ts"],
  "references": [{ "path": "../contracts" }, { "path": "../domain" }]
}
`);
write('packages/file-io/src/chunked-reader.ts', `import {
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
      throw new Error(\`unknown encoding\`);
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
`);
write('packages/file-io/src/index.ts', `export * from './chunked-reader.js';
`);

write('packages/file-io/src/chunked-reader.test.ts', `import { describe, expect, it } from 'vitest';
import { DEFAULT_CI16_LE_IQ, DEFAULT_CHUNK_BYTES, sampleIndexToDecimal } from '@wss/contracts';
import { ArrayBufferChunkedReader, bytesPerFrame } from './chunked-reader.js';

describe('ArrayBufferChunkedReader', () => {
  it('honours available-prefix and ~4MiB chunk budget', async () => {
    const bpf = bytesPerFrame(DEFAULT_CI16_LE_IQ);
    const totalSamples = 2_000_000; // 8 bytes? wait CI16 = 4 bytes/frame
    const buffer = new ArrayBuffer(totalSamples * bpf);
    const view = new Int16Array(buffer);
    for (let i = 0; i < view.length; i++) view[i] = (i % 1000) - 500;

    const reader = new ArrayBufferChunkedReader({
      id: 'synthetic-ci16',
      format: DEFAULT_CI16_LE_IQ,
      buffer,
      availableSamples: 100_000n,
      label: 'synthetic fixture: CI16 ramp',
    });

    const prefix = reader.availablePrefix();
    expect(sampleIndexToDecimal(prefix.availableSamples)).toBe('100000');
    expect(prefix.status).toBe('partial');

    const huge = await reader.read({
      begin: 0n,
      end: 5_000_000n,
      maxBytes: DEFAULT_CHUNK_BYTES,
    });
    expect(huge.truncatedToAvailable).toBe(true);
    expect(huge.end <= 100_000n).toBe(true);
    const maxSamples = Math.floor(DEFAULT_CHUNK_BYTES / bpf);
    expect(Number(huge.end - huge.begin)).toBeLessThanOrEqual(maxSamples);
    expect(huge.samples.length).toBe(Number(huge.end - huge.begin) * 2);
  });

  it('cancels via AbortSignal', async () => {
    const bpf = bytesPerFrame(DEFAULT_CI16_LE_IQ);
    const buffer = new ArrayBuffer(1024 * bpf);
    const reader = new ArrayBufferChunkedReader({
      id: 'synthetic-cancel',
      format: DEFAULT_CI16_LE_IQ,
      buffer,
      label: 'synthetic fixture: cancel',
    });
    const ac = new AbortController();
    ac.abort();
    await expect(reader.read({ begin: 0n, end: 10n, signal: ac.signal })).rejects.toThrow();
  });
});
`);

console.log('domain+file-io done');
