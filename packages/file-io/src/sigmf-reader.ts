import type { SampleIndex } from '@wss/contracts';
import type { ChunkedReader } from './chunked-reader.js';
import { openRawArrayBuffer } from './raw-reader.js';
import {
  parseSigmfMeta,
  type ParsedSigmfMeta,
  type SigmfDocument,
} from './sigmf-meta.js';

export interface SigmfOpenOptions {
  id: string;
  /** SigMF JSON metadata (string or parsed object). */
  meta: string | SigmfDocument;
  /** Dataset bytes (.sigmf-data). For tests this is a synthetic ArrayBuffer. */
  data: ArrayBuffer;
  /**
   * Must include "synthetic" when data is not a real capture mapping.
   * Path stub is recorded for future disk backends; unused for ArrayBuffer open.
   */
  label: string;
  /** Optional path stub for future file-backed readers (tests may pass a fake path). */
  dataPathStub?: string;
  availableSamples?: SampleIndex;
}

export interface SigmfReaderHandle {
  reader: ChunkedReader;
  meta: ParsedSigmfMeta;
  /** Echo of dataPathStub for callers that wire a real FS later. */
  dataPathStub?: string;
}

/**
 * Pair SigMF metadata with an in-memory dataset buffer and return a ChunkedReader.
 * Dataset offset / trailing bytes from meta become RAW header/trailer.
 */
export function openSigmfArrayBuffer(options: SigmfOpenOptions): SigmfReaderHandle {
  const meta = parseSigmfMeta(options.meta);
  const reader = openRawArrayBuffer({
    id: options.id,
    buffer: options.data,
    format: meta.format,
    sampleRateHz: meta.sampleRateHz,
    centerFrequencyHz: meta.centerFrequencyHz,
    label: options.label,
    availableSamples: options.availableSamples,
  });
  return {
    reader,
    meta,
    dataPathStub: options.dataPathStub,
  };
}
