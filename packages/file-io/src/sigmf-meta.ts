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
  [key: string]: unknown;
}

export interface SigmfCaptureMeta {
  'core:sample_start'?: number;
  'core:frequency'?: number;
  'core:datetime'?: string;
  [key: string]: unknown;
}

export interface SigmfDocument {
  global?: SigmfGlobalMeta;
  captures?: SigmfCaptureMeta[];
  annotations?: unknown[];
}

export interface ParsedSigmfMeta {
  format: SampleFormatDescriptor;
  sampleRateHz: number | undefined;
  centerFrequencyHz: number | undefined;
  /** Byte offset into the dataset file before first sample (core:offset). */
  datasetOffsetBytes: string;
  datatype: string;
  raw: SigmfDocument;
}

const DATATYPE_RE =
  /^(c|r)(i8|u8|i16|u16|i32|u32|f32|f64)(_(le|be))?$/i;

/**
 * Map a SigMF core:datatype string (e.g. ci16_le, cf32_le, ri16_le) into
 * SampleFormatDescriptor fields. Tolerates missing endian suffix (defaults LE
 * for multi-byte types; n/a for 8-bit).
 */
export function datatypeToSampleFormat(datatype: string): SampleFormatDescriptor {
  const trimmed = datatype.trim().toLowerCase();
  const m = DATATYPE_RE.exec(trimmed);
  if (!m) {
    throw new Error(`Unsupported SigMF core:datatype: ${JSON.stringify(datatype)}`);
  }
  const structure =
    m[1] === 'c' ? SampleStructure.ComplexIQ : SampleStructure.Real;
  const encKey = m[2]!;
  const endianTok = m[4];

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
    case 'u16':
      // No UInt16 in contracts yet — treat as Int16 with note via normalize path.
      // Callers needing true u16 should extend contracts (Bot-F). Fallback: int16.
      componentEncoding = ComponentEncoding.Int16;
      break;
    case 'i32':
      componentEncoding = ComponentEncoding.Int32;
      break;
    case 'u32':
      componentEncoding = ComponentEncoding.Int32;
      break;
    case 'f32':
      componentEncoding = ComponentEncoding.Float32;
      break;
    case 'f64':
      componentEncoding = ComponentEncoding.Float64;
      break;
    default:
      throw new Error(`Unhandled SigMF encoding token: ${encKey}`);
  }

  const is8 = encKey === 'i8' || encKey === 'u8';
  let byteOrder: ByteOrder;
  if (is8) {
    byteOrder = ByteOrder.NotApplicable;
  } else if (endianTok === 'be') {
    byteOrder = ByteOrder.Big;
  } else {
    byteOrder = ByteOrder.Little;
  }

  const iqLayout =
    structure === SampleStructure.ComplexIQ
      ? IqLayout.IqInterleaved
      : IqLayout.NotApplicable;

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

/**
 * Parse a SigMF JSON metadata object (or JSON string) into SampleFormatDescriptor
 * plus sample_rate / frequency / dataset offset.
 */
export function parseSigmfMeta(input: string | SigmfDocument | unknown): ParsedSigmfMeta {
  let doc: SigmfDocument;
  if (typeof input === 'string') {
    doc = JSON.parse(input) as SigmfDocument;
  } else if (input && typeof input === 'object') {
    doc = input as SigmfDocument;
  } else {
    throw new TypeError('parseSigmfMeta expects JSON string or object');
  }

  const global = doc.global ?? {};
  const datatype = String(global['core:datatype'] ?? 'ci16_le');
  const format = datatypeToSampleFormat(datatype);

  const offsetNum = Number(global['core:offset'] ?? 0);
  if (!Number.isFinite(offsetNum) || offsetNum < 0 || !Number.isInteger(offsetNum)) {
    throw new RangeError(`Invalid core:offset: ${String(global['core:offset'])}`);
  }
  format.headerBytes = sampleIndexToDecimal(BigInt(offsetNum));

  const trailing = Number(global['core:trailing_bytes'] ?? 0);
  if (!Number.isFinite(trailing) || trailing < 0 || !Number.isInteger(trailing)) {
    throw new RangeError(`Invalid core:trailing_bytes: ${String(global['core:trailing_bytes'])}`);
  }
  format.trailerBytes = sampleIndexToDecimal(BigInt(trailing));

  const sampleRateRaw = global['core:sample_rate'];
  const sampleRateHz =
    typeof sampleRateRaw === 'number' && Number.isFinite(sampleRateRaw)
      ? sampleRateRaw
      : undefined;

  const captures = Array.isArray(doc.captures) ? doc.captures : [];
  const firstCapture = captures[0];
  const freqRaw = firstCapture?.['core:frequency'];
  const centerFrequencyHz =
    typeof freqRaw === 'number' && Number.isFinite(freqRaw) ? freqRaw : undefined;

  return {
    format,
    sampleRateHz,
    centerFrequencyHz,
    datasetOffsetBytes: format.headerBytes,
    datatype,
    raw: doc,
  };
}

/** Minimal synthetic SigMF meta helper for tests (labeled synthetic). */
export function makeSyntheticSigmfMeta(options: {
  datatype?: string;
  sampleRateHz: number;
  frequencyHz?: number;
  offsetBytes?: number;
  trailingBytes?: number;
  description?: string;
}): SigmfDocument {
  return {
    global: {
      'core:datatype': options.datatype ?? 'ci16_le',
      'core:sample_rate': options.sampleRateHz,
      'core:version': '1.0.0',
      'core:description': options.description ?? 'SYNTHETIC fixture — not a real capture',
      'core:offset': options.offsetBytes ?? 0,
      'core:trailing_bytes': options.trailingBytes ?? 0,
    },
    captures: [
      {
        'core:sample_start': 0,
        'core:frequency': options.frequencyHz ?? 0,
      },
    ],
    annotations: [],
  };
}

export { DEFAULT_CI16_LE_IQ };
