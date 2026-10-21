/** File / sample format enums shared by file-io and dsp-wasm. */

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
