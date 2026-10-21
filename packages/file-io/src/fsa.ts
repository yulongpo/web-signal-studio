/**
 * Browser File System Access helpers.
 * Feature-detect showOpenFilePicker / FileSystemFileHandle; never crash when missing —
 * expose a capability flag or throw a typed error.
 */
import type { SampleIndex } from '@wss/contracts';
import { openIqWavFromBlob, type IqWavOpenResult } from './wav-reader.js';
import { BlobChunkedReader } from './blob-chunked-reader.js';
import type { ChunkedReader } from './chunked-reader.js';
import type { SampleFormatDescriptor } from '@wss/contracts';
import { DEFAULT_CI16_LE_IQ } from '@wss/contracts';

export class FsaUnsupportedError extends Error {
  readonly code = 'FSA_UNSUPPORTED' as const;
  constructor(message = 'File System Access API is not available in this environment') {
    super(message);
    this.name = 'FsaUnsupportedError';
  }
}

export interface FsaCapabilities {
  showOpenFilePicker: boolean;
  fileSystemFileHandle: boolean;
  /** True when both picker and handle surfaces look usable. */
  openLocalFile: boolean;
}

export function detectFsaCapabilities(
  globalObj: typeof globalThis = globalThis,
): FsaCapabilities {
  const g = globalObj as typeof globalThis & {
    showOpenFilePicker?: unknown;
    FileSystemFileHandle?: unknown;
  };
  const showOpenFilePicker = typeof g.showOpenFilePicker === 'function';
  const fileSystemFileHandle = typeof g.FileSystemFileHandle === 'function';
  return {
    showOpenFilePicker,
    fileSystemFileHandle,
    openLocalFile: showOpenFilePicker && fileSystemFileHandle,
  };
}

/** Minimal structural type so tests can inject a fake handle without DOM libs. */
export interface FileSystemFileHandleLike {
  getFile(): Promise<File>;
  readonly name?: string;
}

export interface OpenFromFileHandleOptions {
  id?: string;
  handle: FileSystemFileHandleLike;
  /** Override label; default uses handle.name when present. */
  label?: string;
  availableSamples?: SampleIndex;
  signal?: AbortSignal;
  /**
   * When true (default), parse as restricted IQ WAV.
   * When false, treat the whole file as RAW CI16 LE IQ payload (tests / advanced).
   */
  asIqWav?: boolean;
  rawFormat?: SampleFormatDescriptor;
}

/**
 * Open via FileSystemFileHandle.getFile() → Blob/File ChunkedReader.
 * Throws FsaUnsupportedError only when the caller required FSA and it is missing;
 * this helper itself only needs getFile() on the provided handle.
 */
export async function openFromFileSystemFileHandle(
  options: OpenFromFileHandleOptions,
): Promise<IqWavOpenResult | { reader: ChunkedReader; descriptor?: undefined }> {
  const file = await options.handle.getFile();
  if (options.signal?.aborted) {
    const reason = options.signal.reason;
    throw reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
  }
  const fallbackName = options.handle.name ?? file.name ?? 'file';
  const id = options.id ?? ('fsa:' + fallbackName);
  const label =
    options.label ?? ('user-picked file: ' + (options.handle.name ?? file.name ?? 'unnamed'));

  if (options.asIqWav === false) {
    const reader = new BlobChunkedReader({
      id,
      format: options.rawFormat ?? DEFAULT_CI16_LE_IQ,
      blob: file,
      availableSamples: options.availableSamples,
      label,
    });
    return { reader };
  }

  return openIqWavFromBlob({
    id,
    blob: file,
    label,
    availableSamples: options.availableSamples,
    signal: options.signal,
  });
}

export type ShowOpenFilePickerLike = (options?: {
  multiple?: boolean;
  types?: Array<{ description?: string; accept: Record<string, string[]> }>;
}) => Promise<FileSystemFileHandleLike[]>;

/**
 * Prompt the user (when FSA is available) and open the first picked file as IQ WAV.
 * Throws FsaUnsupportedError when showOpenFilePicker is missing.
 */
export async function pickAndOpenIqWav(options: {
  id?: string;
  label?: string;
  signal?: AbortSignal;
  picker?: ShowOpenFilePickerLike;
  globalObj?: typeof globalThis;
}): Promise<IqWavOpenResult> {
  const caps = detectFsaCapabilities(options.globalObj);
  const picker =
    options.picker ??
    ((options.globalObj ?? globalThis) as typeof globalThis & {
      showOpenFilePicker?: ShowOpenFilePickerLike;
    }).showOpenFilePicker;

  if (typeof picker !== 'function') {
    throw new FsaUnsupportedError(
      caps.openLocalFile
        ? 'showOpenFilePicker is not a function'
        : 'File System Access API is not available in this environment',
    );
  }

  const handles = await picker({
    multiple: false,
    types: [
      {
        description: 'IQ WAV (PCM16 LE stereo)',
        accept: { 'audio/wav': ['.wav'], 'audio/x-wav': ['.wav'] },
      },
    ],
  });
  const handle = handles[0];
  if (!handle) throw new Error('No file selected');
  const opened = await openFromFileSystemFileHandle({
    id: options.id,
    handle,
    label: options.label,
    signal: options.signal,
    asIqWav: true,
  });
  if (!('descriptor' in opened) || !opened.descriptor) {
    throw new Error('expected IQ WAV descriptor');
  }
  return opened as IqWavOpenResult;
}
