const fs = require('fs');
const path = require('path');

function write(rel, content) {
  const abs = path.join(process.cwd(), rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content.replace(/\r?\n/g, '\n'), { encoding: 'utf8' });
  console.log('wrote', rel);
}

write('package.json', `{
  "name": "web-signal-studio",
  "private": true,
  "version": "0.0.0",
  "description": "Web Signal Studio monorepo (Bot-D DSP / file-io scaffold)",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^3.2.4",
    "@types/node": "^22.18.6"
  },
  "engines": {
    "node": ">=20"
  }
}
`);

write('tsconfig.base.json', `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": false,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
`);

write('vitest.config.ts', `import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    include: ['packages/**/src/**/*.test.ts', 'packages/**/tests/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      '@wss/contracts': path.resolve(__dirname, 'packages/contracts/src/index.ts'),
      '@wss/domain': path.resolve(__dirname, 'packages/domain/src/index.ts'),
      '@wss/file-io': path.resolve(__dirname, 'packages/file-io/src/index.ts'),
      '@wss/dsp-wasm': path.resolve(__dirname, 'packages/dsp-wasm/src/index.ts'),
    },
  },
});
`);

write('packages/contracts/package.json', `{
  "name": "@wss/contracts",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "test": "vitest run --root ../.."
  }
}
`);

write('packages/contracts/tsconfig.json', `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "composite": true
  },
  "include": ["src/**/*.ts"]
}
`);

write('packages/contracts/src/sample-index.ts', `/**
 * Sample indices for multi-hour IQ must never go through Number.
 * Use bigint in-process; use decimal strings across JSON / Workers / WASM boundaries.
 */

export type SampleIndex = bigint;

const DECIMAL_RE = /^-?(?:0|[1-9]\\d*)$/;

export function sampleIndexFromDecimal(text: string): SampleIndex {
  const trimmed = text.trim();
  if (!DECIMAL_RE.test(trimmed)) {
    throw new RangeError(\`SampleIndex decimal string rejected: \${JSON.stringify(text)}\`);
  }
  return BigInt(trimmed);
}

export function sampleIndexToDecimal(index: SampleIndex): string {
  return index.toString(10);
}

export function assertSampleIndex(value: unknown, label = 'SampleIndex'): SampleIndex {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'string') return sampleIndexFromDecimal(value);
  throw new TypeError(\`\${label} must be bigint or decimal string, got \${typeof value}\`);
}

export function compareSampleIndex(a: SampleIndex, b: SampleIndex): -1 | 0 | 1 {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function clampSampleIndex(value: SampleIndex, min: SampleIndex, max: SampleIndex): SampleIndex {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}
`);

write('packages/contracts/src/formats.ts', `/** File / sample format enums shared by file-io and dsp-wasm. */

export enum FileFormatKind {
  Raw = 'raw',
  SigMF = 'sigmf',
  Wav = 'wav',
}

export enum SampleStructure {
  ComplexIQ = 'complex_iq',
  Real = 'real',
}

export enum ComponentEncoding {
  Int8 = 'int8',
  UInt8 = 'uint8',
  Int16 = 'int16',
  Int32 = 'int32',
  Float32 = 'float32',
  Float64 = 'float64',
}

export enum ByteOrder {
  NotApplicable = 'n/a',
  Little = 'le',
  Big = 'be',
}

export enum IqLayout {
  NotApplicable = 'n/a',
  IqInterleaved = 'iq',
  QiInterleaved = 'qi',
  PlanarIq = 'planar_iq',
}

export interface SampleFormatDescriptor {
  structure: SampleStructure;
  componentEncoding: ComponentEncoding;
  byteOrder: ByteOrder;
  iqLayout: IqLayout;
  channels: number;
  selectedChannel: number;
  headerBytes: string; // decimal SampleIndex-sized offsets as strings for JSON safety
  trailerBytes: string;
  normalizeIntegerAdc: boolean;
}

export const DEFAULT_CI16_LE_IQ: SampleFormatDescriptor = {
  structure: SampleStructure.ComplexIQ,
  componentEncoding: ComponentEncoding.Int16,
  byteOrder: ByteOrder.Little,
  iqLayout: IqLayout.IqInterleaved,
  channels: 1,
  selectedChannel: 0,
  headerBytes: '0',
  trailerBytes: '0',
  normalizeIntegerAdc: true,
};

/** Canonical Bot-D chunk size target (~4 MiB). */
export const DEFAULT_CHUNK_BYTES = 4 * 1024 * 1024;
`);

write('packages/contracts/src/chunk.ts', `import type { SampleIndex } from './sample-index.js';
import { DEFAULT_CHUNK_BYTES } from './formats.js';

export { DEFAULT_CHUNK_BYTES };

export interface ChunkReadRequest {
  /** Inclusive begin sample index. */
  begin: SampleIndex;
  /** Exclusive end sample index. */
  end: SampleIndex;
  /** Soft byte budget; readers should not exceed this by much. Default ~4 MiB. */
  maxBytes?: number;
  /** AbortSignal for cancel. */
  signal?: AbortSignal;
}

export interface ChunkReadResponse {
  begin: SampleIndex;
  end: SampleIndex;
  /** Interleaved IQ as Float32 (I0,Q0,I1,Q1,...) or Real as Float32. */
  samples: Float32Array;
  /** True when response was truncated to available-prefix. */
  truncatedToAvailable: boolean;
  bytesRead: number;
}

export interface AvailablePrefix {
  /** Contiguous readable prefix length in samples (0..total). */
  availableSamples: SampleIndex;
  totalSamples: SampleIndex;
  status: 'ready' | 'loading' | 'partial' | 'failed';
  generation: string; // decimal
  fingerprint?: string;
  error?: string;
}

export interface CancelToken {
  readonly cancelled: boolean;
  throwIfCancelled(): void;
}

export function abortSignalToCancelToken(signal?: AbortSignal): CancelToken {
  return {
    get cancelled() {
      return signal?.aborted === true;
    },
    throwIfCancelled() {
      if (signal?.aborted) {
        const reason = signal.reason;
        throw reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
      }
    },
  };
}
`);

write('packages/contracts/src/spectral.ts', `import type { SampleIndex } from './sample-index.js';

export type SpectralWindowName =
  | 'rectangular'
  | 'hann'
  | 'hamming'
  | 'blackman'
  | 'blackman_harris'
  | 'flat_top'
  | 'kaiser';

export interface PsdRequest {
  begin: SampleIndex;
  end: SampleIndex;
  fftSize: number;
  window: SpectralWindowName;
  overlap: number;
  sampleRateHz: number;
  signal?: AbortSignal;
}

export interface PsdResult {
  /** Frequency axis in Hz (baseband), length = fftSize (complex) or fftSize/2+1 (real). */
  frequenciesHz: Float64Array;
  /** Linear power spectral density (not dB). */
  linearPower: Float32Array;
  fftSize: number;
  sampleRateHz: number;
}

export interface StftRequest {
  begin: SampleIndex;
  end: SampleIndex;
  fftSize: number;
  hopSize: number;
  window: SpectralWindowName;
  sampleRateHz: number;
  signal?: AbortSignal;
}

export interface StftResult {
  frequenciesHz: Float64Array;
  /** Frame centers as sample indices (decimal strings for boundary safety). */
  frameCenters: string[];
  /** Row-major frames * bins linear power. */
  linearPower: Float32Array;
  frameCount: number;
  binCount: number;
}

export interface DdcRequest {
  begin: SampleIndex;
  end: SampleIndex;
  /** LO shift in Hz (baseband). */
  loHz: number;
  sampleRateHz: number;
  /** Rational resample: outputRate = sampleRate * interpolation / decimation */
  interpolation: number;
  decimation: number;
  firTaps?: Float64Array;
  signal?: AbortSignal;
}

export interface DdcResult {
  begin: SampleIndex;
  end: SampleIndex;
  outputSampleRateHz: number;
  samples: Float32Array; // interleaved IQ
}
`);

write('packages/contracts/src/index.ts', `export * from './sample-index.js';
export * from './formats.js';
export * from './chunk.js';
export * from './spectral.js';
`);

console.log('contracts done');
