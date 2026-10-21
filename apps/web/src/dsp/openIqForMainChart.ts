/**
 * Open IQ WAV for the main chart: FSA picker when available, else <input type=file> Blob path.
 * Never labels a user file as synthetic; never invents capture/live claims.
 */
import {
  detectFsaCapabilities,
  pickAndOpenIqWav,
  openIqWavFromBlob,
  FsaUnsupportedError,
  type IqWavOpenResult,
} from '@wss/file-io';
import {
  clearIqFileSession,
  setIqFileSession,
  type IqOpenVia,
} from './iqFileSession';

export type OpenIqOutcome =
  | { ok: true; via: IqOpenVia; fileName: string; sourceLabel: string; sampleRateHz: number }
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'error'; message: string };

function fileSourceLabel(fileName: string, via: IqOpenVia): string {
  return via === 'fsa'
    ? 'user-picked IQ WAV (FSA): ' + fileName
    : 'user-picked IQ WAV (file input): ' + fileName;
}

function guessFileName(opened: IqWavOpenResult): string {
  const id = opened.reader.id ?? '';
  if (id.startsWith('fsa:')) return id.slice(4) || 'iq.wav';
  if (id.startsWith('input:')) return id.slice(6) || 'iq.wav';
  const maybe = opened.reader as { sourceLabel?: string };
  if (typeof maybe.sourceLabel === 'string') {
    return maybe.sourceLabel.replace(/^user-picked file:\s*/i, '') || 'iq.wav';
  }
  return 'iq.wav';
}

function publish(opened: IqWavOpenResult, fileName: string, via: IqOpenVia) {
  const sourceLabel = fileSourceLabel(fileName, via);
  setIqFileSession({
    reader: opened.reader,
    sampleRateHz: opened.descriptor.sampleRateHz,
    sourceLabel,
    fileName,
    via,
  });
  return {
    ok: true as const,
    via,
    fileName,
    sourceLabel,
    sampleRateHz: opened.descriptor.sampleRateHz,
  };
}

/** Prefer FSA; on unsupported return so UI can fall back to <input type=file>. */
export async function openIqViaFsa(options: {
  signal?: AbortSignal;
} = {}): Promise<OpenIqOutcome> {
  const caps = detectFsaCapabilities();
  if (!caps.openLocalFile) {
    return { ok: false, reason: 'unsupported', message: 'File System Access API unavailable' };
  }
  try {
    const opened = await pickAndOpenIqWav({ signal: options.signal });
    const fileName = guessFileName(opened);
    return publish(opened, fileName, 'fsa');
  } catch (err: unknown) {
    if (err instanceof FsaUnsupportedError) {
      return { ok: false, reason: 'unsupported', message: err.message };
    }
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, reason: 'cancelled', message: 'Aborted' };
    }
    const name = err instanceof Error ? err.name : '';
    const msg = err instanceof Error ? err.message : String(err);
    if (name === 'AbortError' || /abort|cancel/i.test(msg)) {
      return { ok: false, reason: 'cancelled', message: msg || 'Cancelled' };
    }
    return { ok: false, reason: 'error', message: msg || 'Open failed' };
  }
}

/** Open from a File / Blob chosen via <input type=file> (or tests). */
export async function openIqFromFileBlob(
  file: File | Blob,
  options: { fileName?: string; signal?: AbortSignal } = {},
): Promise<OpenIqOutcome> {
  const fileName =
    options.fileName ??
    (file instanceof File && file.name ? file.name : 'iq.wav');
  try {
    const opened = await openIqWavFromBlob({
      id: 'input:' + fileName,
      blob: file,
      label: 'user-picked file: ' + fileName,
      signal: options.signal,
    });
    return publish(opened, fileName, 'input');
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, reason: 'cancelled', message: 'Aborted' };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: 'error', message: msg || 'Open failed' };
  }
}

export function clearOpenedIq(): void {
  clearIqFileSession();
}

export { detectFsaCapabilities };
