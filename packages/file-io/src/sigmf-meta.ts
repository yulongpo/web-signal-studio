import {
  type SampleFormatDescriptor,
  SampleStructure,
  ComponentEncoding,
  ByteOrder,
  IqLayout,
  DEFAULT_CI16_LE_IQ,
  sampleIndexToDecimal,
} from '@wss/contracts';

/** Subset of SigMF global metadata we consume for reading. */
export interface SigmfGlobalMeta {
  'core:datatype'?: string;
  'core:sample_rate'?: number;
  'core:version'?: string;
  'core:description'?: string;
  'core:author'?: string;
  'core:recorder'?: string;
  'core:license'?: string;
  'core:hw'?: string;
  'core:offset'?: number;
  'core:trailing_bytes'?: number;
  'core:num_channels'?: number;
  'core:dataset'?: string;
  'core:extensions'?: unknown;
  [key: string]: unknown;
}

export interface SigmfCaptureMeta {
  'core:sample_start'?: number;
  'core:frequency'?: number;
  'core:datetime'?: string;
  'core:header_bytes'?: number;
  [key: string]: unknown;
}

export interface SigmfDocument {
  global?: SigmfGlobalMeta;
  captures?: SigmfCaptureMeta[];
  annotations?: unknown[];
}

/**
 * Parsed SigMF meta aligned to desktop `readSigmfMetadata` field semantics
 * (signal_studio_rebuild/infrastructure/sigmf_metadata.cpp).
 *
 * Important desktop parity:
 * - `core:offset` is an *external sample index*, NOT a disk byte offset.
 * - Disk header comes from first capture `core:header_bytes` only.
 * - Trailer from `core:trailing_bytes`.
 * - Datatype set matches desktop (no u16/u32 guess).
 */
export interface ParsedSigmfMeta {
  format: SampleFormatDescriptor;
  sampleRateHz: number | undefined;
  centerFrequencyHz: number | undefined;
  /**
   * `core:offset` as decimal string (external sample numbering).
   * NOT applied as `format.headerBytes` — desktop ImportController warning.
   */
  datasetOffsetBytes: string;
  /** Alias of datasetOffsetBytes for clearer naming in Add-signal UI. */
  externalSampleOffset: string;
  datatype: string;
  version?: string;
  provenance: string;
  warnings: string[];
  raw: SigmfDocument;
}

const VERSION_RE = /^1\.[0-9]+\.[0-9]+$/;
/** Desktop-supported datatype tokens only (sigmf_metadata.cpp). */
const DATATYPE_RE = /^(c|r)(i8|u8|i16|i32|f32|f64)(?:_(le|be))?$/i;

const SUPPORTED_GLOBAL_KEYS = new Set([
  'core:datatype',
  'core:version',
  'core:sample_rate',
  'core:num_channels',
  'core:dataset',
  'core:trailing_bytes',
  'core:offset',
  'core:extensions',
]);

export class SigmfMetaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SigmfMetaError';
  }
}

/**
 * Map a SigMF core:datatype string into SampleFormatDescriptor fields.
 * Desktop parity: reject u16/u32; require endian for multi-byte; forbid endian for 8-bit.
 */
export function datatypeToSampleFormat(datatype: string): SampleFormatDescriptor {
  const trimmed = datatype.trim().toLowerCase();
  const m = DATATYPE_RE.exec(trimmed);
  if (!m) {
    throw new SigmfMetaError(
      `Unsupported SigMF core:datatype: ${JSON.stringify(datatype)} (desktop: no CI16 guess)`,
    );
  }
  const structure = m[1] === 'c' ? SampleStructure.ComplexIQ : SampleStructure.Real;
  const encKey = m[2]!;
  const endianTok = m[3];

  let componentEncoding: ComponentEncoding;
  switch (encKey) {
    case 'i8':
      componentEncoding = ComponentEncoding.Int8;
      break;
    case 'u8':
      componentEncoding = ComponentEncoding.UInt8;
      break;
    case 'i16':
      componentEncoding = ComponentEncoding.Int16;
      break;
    case 'i32':
      componentEncoding = ComponentEncoding.Int32;
      break;
    case 'f32':
      componentEncoding = ComponentEncoding.Float32;
      break;
    case 'f64':
      componentEncoding = ComponentEncoding.Float64;
      break;
    default:
      throw new SigmfMetaError(`Unhandled SigMF encoding token: ${encKey}`);
  }

  const is8 = encKey === 'i8' || encKey === 'u8';
  if (is8 && endianTok) {
    throw new SigmfMetaError(`datatype endian not allowed for 8-bit: ${datatype}`);
  }
  if (!is8 && !endianTok) {
    throw new SigmfMetaError(`datatype endian required for multi-byte: ${datatype}`);
  }

  let byteOrder: ByteOrder;
  if (is8) {
    byteOrder = ByteOrder.NotApplicable;
  } else if (endianTok === 'be') {
    byteOrder = ByteOrder.Big;
  } else {
    byteOrder = ByteOrder.Little;
  }

  const iqLayout =
    structure === SampleStructure.ComplexIQ ? IqLayout.IqInterleaved : IqLayout.NotApplicable;

  const normalizeIntegerAdc =
    componentEncoding !== ComponentEncoding.Float32 &&
    componentEncoding !== ComponentEncoding.Float64;

  return {
    structure,
    componentEncoding,
    byteOrder,
    iqLayout,
    channels: 1,
    selectedChannel: 0,
    headerBytes: '0',
    trailerBytes: '0',
    normalizeIntegerAdc,
  };
}

function requireNonNegInt(value: unknown, label: string): bigint {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new SigmfMetaError(`Invalid ${label}: ${String(value)}`);
  }
  return BigInt(value);
}

/**
 * Parse SigMF JSON with desktop `readSigmfMetadata` field / error semantics.
 * Soft structural checks throw SigmfMetaError (callers map to ImportRow.error).
 */
export function parseSigmfMeta(input: string | SigmfDocument | unknown): ParsedSigmfMeta {
  let doc: SigmfDocument;
  if (typeof input === 'string') {
    try {
      doc = JSON.parse(input) as SigmfDocument;
    } catch (err) {
      throw new SigmfMetaError(
        `SigMF JSON invalid: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else if (input && typeof input === 'object') {
    doc = input as SigmfDocument;
  } else {
    throw new TypeError('parseSigmfMeta expects JSON string or object');
  }

  const warnings: string[] = [];

  if (!doc.global || typeof doc.global !== 'object') {
    throw new SigmfMetaError('SigMF requires global object');
  }
  if (!Array.isArray(doc.captures)) {
    throw new SigmfMetaError('SigMF requires captures array');
  }
  if (!Array.isArray(doc.annotations)) {
    throw new SigmfMetaError('SigMF requires annotations array');
  }

  const global = doc.global;
  const version = typeof global['core:version'] === 'string' ? global['core:version'] : '';
  if (!VERSION_RE.test(version)) {
    throw new SigmfMetaError('SigMF version missing or not supported 1.x');
  }

  const datatype = String(global['core:datatype'] ?? '');
  if (!datatype) {
    throw new SigmfMetaError('SigMF core:datatype missing');
  }
  const format = datatypeToSampleFormat(datatype);

  if (global['core:num_channels'] !== undefined) {
    const ch = requireNonNegInt(global['core:num_channels'], 'core:num_channels');
    if (ch < 1n || ch > 128n) {
      throw new SigmfMetaError('SigMF channels must be in 1..128');
    }
    format.channels = Number(ch);
  }

  const sampleRateRaw = global['core:sample_rate'];
  let sampleRateHz: number | undefined;
  if (sampleRateRaw !== undefined) {
    if (
      typeof sampleRateRaw !== 'number' ||
      !Number.isFinite(sampleRateRaw) ||
      sampleRateRaw <= 0 ||
      sampleRateRaw > 1e12
    ) {
      throw new SigmfMetaError('SigMF sample_rate invalid');
    }
    sampleRateHz = sampleRateRaw;
  }

  if (global['core:trailing_bytes'] !== undefined) {
    format.trailerBytes = sampleIndexToDecimal(
      requireNonNegInt(global['core:trailing_bytes'], 'core:trailing_bytes'),
    );
  }

  // Desktop: core:offset is external sample numbering — do NOT map to disk header.
  let externalSampleOffset = '0';
  if (global['core:offset'] !== undefined) {
    const offset = requireNonNegInt(global['core:offset'], 'core:offset');
    externalSampleOffset = sampleIndexToDecimal(offset);
    if (offset !== 0n) {
      warnings.push(
        'offset是外部样本编号，不作为磁盘字节偏移；工程使用本文档起始样本索引。',
      );
    }
  }

  if (typeof global['core:dataset'] === 'string') {
    const dataset = global['core:dataset'];
    if (
      !dataset ||
      dataset.includes('/') ||
      dataset.includes('\\') ||
      dataset.includes(':') ||
      dataset === '.' ||
      dataset === '..'
    ) {
      throw new SigmfMetaError('SigMF rejects cross-directory dataset path');
    }
  } else if (global['core:dataset'] !== undefined) {
    throw new SigmfMetaError('SigMF dataset must be same-directory filename string');
  }

  const captures = doc.captures;
  let previousStart = -1n;
  let centerFrequencyHz: number | undefined;
  let firstHadFrequency: boolean | undefined;

  for (let i = 0; i < captures.length; i++) {
    const capture = captures[i];
    if (!capture || typeof capture !== 'object') {
      throw new SigmfMetaError('SigMF capture must be object');
    }
    if (capture['core:sample_start'] === undefined) {
      throw new SigmfMetaError('SigMF capture missing core:sample_start');
    }
    const begin = requireNonNegInt(capture['core:sample_start'], 'core:sample_start');
    if (i === 0 && begin !== 0n) {
      throw new SigmfMetaError('SigMF first capture sample_start must be 0');
    }
    if (i > 0 && begin <= previousStart) {
      throw new SigmfMetaError('SigMF captures must be strictly increasing from 0');
    }
    previousStart = begin;

    const hasFreq = capture['core:frequency'] !== undefined;
    if (i === 0) firstHadFrequency = hasFreq;
    else if (firstHadFrequency !== hasFreq) {
      throw new SigmfMetaError('SigMF capture frequency fields inconsistent across captures');
    }
    if (hasFreq) {
      const fc = capture['core:frequency'];
      if (typeof fc !== 'number' || !Number.isFinite(fc) || fc < 0 || fc > 1e12) {
        throw new SigmfMetaError('SigMF frequency out of non-negative range');
      }
      if (centerFrequencyHz !== undefined && centerFrequencyHz !== fc) {
        throw new SigmfMetaError('SigMF segmented frequency hopping not supported as single RF');
      }
      centerFrequencyHz = fc;
    }

    if (capture['core:header_bytes'] !== undefined) {
      const header = requireNonNegInt(capture['core:header_bytes'], 'core:header_bytes');
      if (i > 0 && header !== 0n) {
        throw new SigmfMetaError('SigMF mid-segment non-sample header not supported');
      }
      if (i === 0) {
        format.headerBytes = sampleIndexToDecimal(header);
      }
    }

    if (typeof capture['core:datetime'] === 'string') {
      warnings.push(`采集时间：${capture['core:datetime'].slice(0, 80)}。`);
    }
  }

  const extensions = global['core:extensions'];
  if (Array.isArray(extensions)) {
    for (const ext of extensions) {
      if (!ext || typeof ext !== 'object') continue;
      const e = ext as { optional?: unknown; name?: unknown };
      if (e.optional !== true) {
        throw new SigmfMetaError(
          `SigMF required extension not supported: ${typeof e.name === 'string' ? e.name : '?'}`,
        );
      }
      if (typeof e.name === 'string') {
        warnings.push(`忽略可选扩展：${e.name.slice(0, 80)}。`);
      }
    }
  }

  const ignored: string[] = [];
  for (const key of Object.keys(global)) {
    if (!SUPPORTED_GLOBAL_KEYS.has(key)) ignored.push(key);
  }
  if (ignored.length > 0) {
    warnings.push(`未用于解码的字段：${ignored.join(', ')}。`);
  }
  if (doc.annotations.length > 0) {
    warnings.push(
      'annotations不自动转为工程标记（project-io importSigmfStream 可显式映射为 ImportedLabel）。',
    );
  }

  return {
    format,
    sampleRateHz,
    centerFrequencyHz,
    datasetOffsetBytes: externalSampleOffset,
    externalSampleOffset,
    datatype: datatype.toLowerCase(),
    version,
    provenance: `SigMF ${version}`,
    warnings,
    raw: doc,
  };
}

/**
 * Minimal synthetic SigMF meta helper for tests (labeled synthetic).
 * `headerBytes` → first capture `core:header_bytes` (disk).
 * `offsetBytes` → `core:offset` (external sample index; not disk header).
 */
export function makeSyntheticSigmfMeta(options: {
  datatype?: string;
  sampleRateHz: number;
  frequencyHz?: number;
  /** External sample offset (core:offset) — NOT disk header. */
  offsetBytes?: number;
  /** Disk byte header on first capture (core:header_bytes). */
  headerBytes?: number;
  trailingBytes?: number;
  description?: string;
  version?: string;
  annotations?: unknown[];
}): SigmfDocument {
  return {
    global: {
      'core:datatype': options.datatype ?? 'ci16_le',
      'core:sample_rate': options.sampleRateHz,
      'core:version': options.version ?? '1.0.0',
      'core:description': options.description ?? 'SYNTHETIC fixture — not a real capture',
      'core:offset': options.offsetBytes ?? 0,
      'core:trailing_bytes': options.trailingBytes ?? 0,
    },
    captures: [
      {
        'core:sample_start': 0,
        'core:frequency': options.frequencyHz ?? 0,
        ...(options.headerBytes !== undefined
          ? { 'core:header_bytes': options.headerBytes }
          : {}),
      },
    ],
    annotations: options.annotations ?? [],
  };
}

export { DEFAULT_CI16_LE_IQ };
