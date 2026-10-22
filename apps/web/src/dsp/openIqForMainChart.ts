/**
 * Open IQ for the main chart: FSA picker when available, else <input type=file>.
 * Formats: WAV (existing), RAW CI16 LE (.iq/.raw/.ci16), SigMF meta+data pair.
 * Uses @wss/file-io readers only — does not rewrite parsers.
 * Never labels a user file as synthetic; never invents capture/live claims.
 */
import {
  detectFsaCapabilities,
  pickAndOpenIqWav,
  openIqWavFromBlob,
  openRawCi16LeIq,
  openSigmfArrayBuffer,
  FsaUnsupportedError,
  type IqWavOpenResult,
  type ChunkedReader,
} from '@wss/file-io';
import {
  clearIqFileSession,
  setIqFileSession,
  type IqOpenVia,
  type IqFileFormat,
} from './iqFileSession';
import {
  DEFAULT_SIGMF_DATA_DEMO_DIR,
  SIGMF_DATA_DEMO_STEM,
  ensureDemoSigmfReader,
} from './auxWaveRawIq';
import { syncDemoSigmfIntoUiProject } from '../projectIo/syncDemoIqProject';
import { SIGMF_DEMO_META_PATH } from '@wss/project-io';

/** Default sample rate when RAW has no sidecar meta (explicit UI default). */
export const DEFAULT_RAW_SAMPLE_RATE_HZ = 1_000_000;

export type OpenIqOutcome =
  | {
      ok: true;
      via: IqOpenVia;
      fileName: string;
      sourceLabel: string;
      sampleRateHz: number;
      format: IqFileFormat;
    }
  | { ok: false; reason: 'cancelled' | 'unsupported' | 'error'; message: string };

function fileSourceLabel(fileName: string, via: IqOpenVia, format: IqFileFormat): string {
  if (via === 'demo') {
    return `sigmf_data_demo disk (${DEFAULT_SIGMF_DATA_DEMO_DIR}\\${fileName})`;
  }
  const viaBit = via === 'fsa' ? 'FSA' : 'file input';
  switch (format) {
    case 'raw':
      return `user-picked IQ RAW (${viaBit}): ${fileName}`;
    case 'sigmf':
      return `user-picked IQ SigMF (${viaBit}): ${fileName}`;
    default:
      return `user-picked IQ WAV (${viaBit}): ${fileName}`;
  }
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

function publish(input: {
  reader: ChunkedReader;
  sampleRateHz: number;
  fileName: string;
  via: IqOpenVia;
  format: IqFileFormat;
  centerFrequencyHz?: number;
}) {
  const sourceLabel = fileSourceLabel(input.fileName, input.via, input.format);
  setIqFileSession({
    reader: input.reader,
    sampleRateHz: input.sampleRateHz,
    sourceLabel,
    fileName: input.fileName,
    via: input.via,
    format: input.format,
    centerFrequencyHz: input.centerFrequencyHz,
  });
  return {
    ok: true as const,
    via: input.via,
    fileName: input.fileName,
    sourceLabel,
    sampleRateHz: input.sampleRateHz,
    format: input.format,
  };
}

function extOf(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.sigmf-meta')) return '.sigmf-meta';
  if (lower.endsWith('.sigmf-data')) return '.sigmf-data';
  const i = lower.lastIndexOf('.');
  return i >= 0 ? lower.slice(i) : '';
}

export function classifyIqFileName(fileName: string): IqFileFormat | 'sigmf-meta' | 'sigmf-data' | 'unknown' {
  const ext = extOf(fileName);
  if (ext === '.wav') return 'wav';
  if (ext === '.iq' || ext === '.raw' || ext === '.ci16') return 'raw';
  if (ext === '.sigmf-meta') return 'sigmf-meta';
  if (ext === '.sigmf-data') return 'sigmf-data';
  return 'unknown';
}

async function blobToArrayBuffer(blob: Blob, signal?: AbortSignal): Promise<ArrayBuffer> {
  if (signal?.aborted) {
    throw signal.reason instanceof Error
      ? signal.reason
      : new DOMException('Aborted', 'AbortError');
  }
  return blob.arrayBuffer();
}

function abortMessage(err: unknown): OpenIqOutcome | null {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return { ok: false, reason: 'cancelled', message: '已取消' };
  }
  const name = err instanceof Error ? err.name : '';
  const msg = err instanceof Error ? err.message : String(err);
  if (name === 'AbortError' || /abort|cancel/i.test(msg)) {
    return { ok: false, reason: 'cancelled', message: msg || '已取消' };
  }
  return null;
}

/** Prefer FSA WAV picker; on unsupported return so UI can fall back to <input type=file>. */
export async function openIqViaFsa(options: {
  signal?: AbortSignal;
} = {}): Promise<OpenIqOutcome> {
  const caps = detectFsaCapabilities();
  if (!caps.openLocalFile) {
    return { ok: false, reason: 'unsupported', message: '无法使用系统文件选择器（浏览器不支持）' };
  }
  try {
    const opened = await pickAndOpenIqWav({ signal: options.signal });
    const fileName = guessFileName(opened);
    return publish({
      reader: opened.reader,
      sampleRateHz: opened.descriptor.sampleRateHz,
      fileName,
      via: 'fsa',
      format: 'wav',
    });
  } catch (err: unknown) {
    if (err instanceof FsaUnsupportedError) {
      return {
        ok: false,
        reason: 'unsupported',
        message: '无法使用系统文件选择器（浏览器不支持）',
      };
    }
    const cancelled = abortMessage(err);
    if (cancelled) return cancelled;
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: 'error', message: msg || '打开失败' };
  }
}

async function openRawFromBlob(
  file: File | Blob,
  fileName: string,
  via: IqOpenVia,
  signal?: AbortSignal,
): Promise<OpenIqOutcome> {
  const buffer = await blobToArrayBuffer(file, signal);
  const reader = openRawCi16LeIq({
    id: `${via}:${fileName}`,
    buffer,
    label: `user-picked file: ${fileName}`,
    sampleRateHz: DEFAULT_RAW_SAMPLE_RATE_HZ,
  });
  return publish({
    reader,
    sampleRateHz: DEFAULT_RAW_SAMPLE_RATE_HZ,
    fileName,
    via,
    format: 'raw',
  });
}

async function openSigmfFromPair(
  metaFile: File | Blob,
  dataFile: File | Blob,
  displayName: string,
  via: IqOpenVia,
  signal?: AbortSignal,
): Promise<OpenIqOutcome> {
  const metaText = await metaFile.text();
  const data = await blobToArrayBuffer(dataFile, signal);
  const handle = openSigmfArrayBuffer({
    id: `${via}:${displayName}`,
    meta: metaText,
    data,
    label: `user-picked file: ${displayName}`,
    dataPathStub:
      dataFile instanceof File && dataFile.name
        ? dataFile.name
        : undefined,
  });
  const sampleRateHz = handle.meta.sampleRateHz ?? DEFAULT_RAW_SAMPLE_RATE_HZ;
  const centerFrequencyHz =
    handle.meta.centerFrequencyHz != null &&
    Number.isFinite(handle.meta.centerFrequencyHz)
      ? handle.meta.centerFrequencyHz
      : undefined;
  return publish({
    reader: handle.reader,
    sampleRateHz,
    fileName: displayName,
    via,
    format: 'sigmf',
    centerFrequencyHz,
  });
}

/**
 * Open from one or more File / Blob entries (file input / tests).
 * SigMF requires both .sigmf-meta and .sigmf-data in the list.
 */
export type NamedIqBlob = { file: File | Blob; name: string };

/** Normalize FileList / File[] / explicit {file,name} entries. */
export function toNamedIqBlobs(
  files: Array<File | Blob | NamedIqBlob>,
): NamedIqBlob[] {
  return files.map((f, i) => {
    if (f && typeof f === 'object' && 'file' in f && 'name' in f) {
      return { file: f.file, name: f.name };
    }
    const blob = f as File | Blob;
    const name =
      blob instanceof File && blob.name
        ? blob.name
        : typeof (blob as { name?: string }).name === 'string'
          ? (blob as { name: string }).name
          : `file-${i}`;
    return { file: blob, name };
  });
}

export async function openIqFromFiles(
  files: Array<File | Blob | NamedIqBlob>,
  options: { signal?: AbortSignal; via?: IqOpenVia } = {},
): Promise<OpenIqOutcome> {
  const via = options.via ?? 'input';
  if (!files.length) {
    return { ok: false, reason: 'error', message: '未选择文件' };
  }

  try {
    const named = toNamedIqBlobs(files);

    const meta = named.find((n) => classifyIqFileName(n.name) === 'sigmf-meta');
    const data = named.find((n) => classifyIqFileName(n.name) === 'sigmf-data');
    if (meta || data) {
      if (!meta || !data) {
        return {
          ok: false,
          reason: 'error',
          message:
            '打开 SigMF 需要同时选择 .sigmf-meta 与 .sigmf-data',
        };
      }
      const displayName = meta.name.replace(/\.sigmf-meta$/i, '');
      return await openSigmfFromPair(meta.file, data.file, displayName || meta.name, via, options.signal);
    }

    const first = named[0]!;
    const kind = classifyIqFileName(first.name);
    if (kind === 'raw') {
      return await openRawFromBlob(first.file, first.name, via, options.signal);
    }
    if (kind === 'wav' || kind === 'unknown') {
      // Unknown: try WAV parse; UI falls back to synthetic on failure.
      const opened = await openIqWavFromBlob({
        id: `${via}:${first.name}`,
        blob: first.file,
        label: `user-picked file: ${first.name}`,
        signal: options.signal,
      });
      return publish({
        reader: opened.reader,
        sampleRateHz: opened.descriptor.sampleRateHz,
        fileName: first.name,
        via,
        format: 'wav',
      });
    }

    return {
      ok: false,
      reason: 'error',
      message: `不支持的 IQ 文件类型：${first.name}`,
    };
  } catch (err: unknown) {
    const cancelled = abortMessage(err);
    if (cancelled) return cancelled;
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: 'error', message: msg || '打开失败' };
  }
}

/** Open from a single File / Blob chosen via <input type=file> (or tests). */
export async function openIqFromFileBlob(
  file: File | Blob,
  options: { fileName?: string; signal?: AbortSignal } = {},
): Promise<OpenIqOutcome> {
  const fileName =
    options.fileName ??
    (file instanceof File && file.name ? file.name : 'iq.wav');
  return openIqFromFiles([{ file, name: fileName }], {
    signal: options.signal,
    via: 'input',
  });
}


/**
 * One-shot load of the allowlisted wideband demo SigMF into the main-chart
 * IQ session (Detect / Main STFT). Path is ONLY
 * D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo\\0000000.*
 * — never invents IQ; uses ensureDemoSigmfReader (Vite /@fs or node:fs).
 */
export async function openDemoIqForMainChart(options: {
  signal?: AbortSignal;
  demoDir?: string | null;
  /** When false, only chart session (legacy). Default true: also commit engineering tree. */
  syncProjectTree?: boolean;
} = {}): Promise<OpenIqOutcome> {
  try {
    const handle = await ensureDemoSigmfReader({
      demoDir: options.demoDir,
      signal: options.signal,
    });
    const fileName = `${SIGMF_DATA_DEMO_STEM}.sigmf-data`;
    const published = publish({
      reader: handle.reader,
      sampleRateHz: handle.sampleRateHz,
      fileName,
      via: 'demo',
      format: 'sigmf',
      centerFrequencyHz: handle.centerFrequencyHz,
    });
    if (options.syncProjectTree !== false) {
      // Demo loader only reads allowlisted sigmf_data_demo; record canonical meta path.
      const synced = syncDemoSigmfIntoUiProject({
        metaText: handle.metaText,
        dataByteLength: handle.dataByteLength,
        path: SIGMF_DEMO_META_PATH,
        displayName: `${handle.stem}.sigmf-meta`,
      });
      if (!synced.ok) {
        return {
          ok: false,
          reason: 'error',
          message:
            synced.message ||
            '\u6f14\u793a IQ \u5df2\u6253\u5f00\u56fe\u8868\uff0c\u4f46\u5199\u5165\u5de5\u7a0b\u6811\u5931\u8d25',
        };
      }
    }
    return published;
  } catch (err: unknown) {
    const cancelled = abortMessage(err);
    if (cancelled) return cancelled;
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      reason: 'error',
      message:
        msg ||
        `\u65e0\u6cd5\u6253\u5f00\u6f14\u793a IQ\uff08\u76ee\u5f55 ${DEFAULT_SIGMF_DATA_DEMO_DIR}\uff09`,
    };
  }
}

export function clearOpenedIq(): void {
  clearIqFileSession();
}

export { detectFsaCapabilities };
