/**
 * RAW IQ import stream: confirm a describeRaw / template row into a native
 * project document + engineering tree (desktop ImportController.sources()
 * → commitSource → markCommitted analogue).
 *
 * IQ bytes stay outside project-io; callers pass dataByteLength (+ optional
 * open via @wss/file-io openRawArrayBuffer for charting). No SourceLoader
 * poll yet — Ready means metadata+sampleCount validated, not envelope load.
 *
 * Pair with describeRawIqWithTemplate (preview) then this commit on confirm.
 */

import {
  ANNOTATIONS_EXPORT_SCHEMA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  SampleStructure,
  sampleIndexToDecimal,
  type AnnotationsDocumentJson,
  type ProjectDocumentJson,
  type ProjectFileJson,
  type SampleFormatDescriptor,
} from '@wss/contracts';
import { bytesPerFrame, describeRaw } from '@wss/file-io';
import { engineeringTreeFromProject, type EngineeringTreeNode } from './engineering-tree.js';
import { getFormatTemplateById, type FormatTemplate } from './format-templates.js';
import {
  type ImportStreamMode,
  type ImportStreamRow,
  type ImportStreamStatus,
} from './import-sigmf-stream.js';
import { ProjectIoError } from './load-project.js';

export type { ImportStreamMode, ImportStreamRow, ImportStreamStatus };

export interface ImportRawStreamInput {
  path: string;
  dataByteLength: number;
  sampleFormat: SampleFormatDescriptor;
  sampleRateHz: number;
  centerFrequencyHz: number;
  declaredBandwidthHz?: number;
  displayName?: string;
  templateId?: string;
  /** Must be true (desktop ImportController confirmed gate). */
  confirmed?: boolean;
  project?: ProjectDocumentJson;
  mode?: ImportStreamMode;
  fileId?: string;
}

export interface ImportRawStreamResult {
  project: ProjectDocumentJson;
  annotations: AnnotationsDocumentJson;
  tree: EngineeringTreeNode[];
  row: ImportStreamRow;
  warnings: string[];
}

function emptyProject(name = 'imported'): ProjectDocumentJson {
  return {
    schema: PROJECT_SCHEMA,
    version: PROJECT_WRITE_VERSION,
    name,
    files: [],
  };
}

function emptyAnnotations(fileId: string): AnnotationsDocumentJson {
  return {
    schema: ANNOTATIONS_EXPORT_SCHEMA,
    fileId,
    sourceSets: [],
    annotations: [],
  };
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/** Rough datatype label for ImportRow UI (not SigMF wire). */
export function sampleFormatToDatatypeLabel(format: SampleFormatDescriptor): string {
  const struct = format.structure === SampleStructure.Real ? 'r' : 'c';
  const encMap: Record<string, string> = {
    int8: 'i8',
    uint8: 'u8',
    int16: 'i16',
    int32: 'i32',
    float32: 'f32',
    float64: 'f64',
  };
  const enc = encMap[format.componentEncoding] ?? format.componentEncoding;
  const endian =
    format.byteOrder === 'n/a' || format.byteOrder === 'le'
      ? format.byteOrder === 'n/a'
        ? ''
        : '_le'
      : '_be';
  return `${struct}${enc}${endian}`;
}

/**
 * Desktop describeRawFile acquisition bounds (fs/fc/bw/duration).
 * Does not touch the filesystem — caller supplies dataByteLength.
 */
export function validateRawAcquisition(input: {
  sampleFormat: SampleFormatDescriptor;
  sampleRateHz: number;
  centerFrequencyHz: number;
  declaredBandwidthHz?: number;
  sampleCount: bigint;
}): string | undefined {
  const fs = input.sampleRateHz;
  const fc = input.centerFrequencyHz;
  const bw = input.declaredBandwidthHz ?? 0;
  const nyquist =
    fs / (input.sampleFormat.structure === SampleStructure.Real ? 2 : 1);

  if (!Number.isFinite(fs) || fs <= 0 || fs > 1e12) {
    return '采样率、频率、时长或有效带宽无效';
  }
  const duration = Number(input.sampleCount) / fs;
  if (!Number.isFinite(duration)) {
    return '采样率、频率、时长或有效带宽无效';
  }
  if (!Number.isFinite(fc) || fc < 0 || fc > 1e12) {
    return '采样率、频率、时长或有效带宽无效';
  }
  if (!Number.isFinite(bw) || bw < 0 || bw > nyquist) {
    return '采样率、频率、时长或有效带宽无效';
  }
  return undefined;
}

/**
 * Import confirmed RAW IQ metadata into a v6 project document and engineering
 * tree. Desktop analogue: describeRawFile + ImportController Ready row →
 * sources() → commitSource.
 */
export function importRawStream(input: ImportRawStreamInput): ImportRawStreamResult {
  if (!input.path) {
    throw new ProjectIoError('importRawStream requires path');
  }
  if (input.confirmed !== true) {
    throw new ProjectIoError('请确认采样结构、编码及缺失的采集参数');
  }

  const warnings: string[] = [];
  let described;
  try {
    if (
      !Number.isFinite(input.dataByteLength) ||
      input.dataByteLength < 0 ||
      !Number.isInteger(input.dataByteLength)
    ) {
      throw new ProjectIoError(`Invalid dataByteLength: ${input.dataByteLength}`);
    }
    const bpf = bytesPerFrame(input.sampleFormat);
    if (bpf <= 0) throw new ProjectIoError(`Invalid bytesPerFrame: ${bpf}`);
    described = describeRaw({
      byteLength: input.dataByteLength,
      format: input.sampleFormat,
      sampleRateHz: input.sampleRateHz,
      centerFrequencyHz: input.centerFrequencyHz,
    });
  } catch (err) {
    throw new ProjectIoError(
      err instanceof Error ? err.message : `RAW describe failed: ${String(err)}`,
    );
  }

  const sampleCountBi = described.totalSamples;
  const sampleCount = sampleIndexToDecimal(sampleCountBi);
  const acqErr = validateRawAcquisition({
    sampleFormat: input.sampleFormat,
    sampleRateHz: input.sampleRateHz,
    centerFrequencyHz: input.centerFrequencyHz,
    declaredBandwidthHz: input.declaredBandwidthHz,
    sampleCount: sampleCountBi,
  });
  if (acqErr) {
    throw new ProjectIoError(acqErr);
  }

  // Remainder bytes not forming a full frame — describeRaw truncates via BigInt div.
  const bpf = BigInt(bytesPerFrame(input.sampleFormat));
  const header = BigInt(input.sampleFormat.headerBytes || '0');
  const trailer = BigInt(input.sampleFormat.trailerBytes || '0');
  const usable = BigInt(input.dataByteLength) - header - trailer;
  if (usable > 0n && bpf > 0n && usable % bpf !== 0n) {
    warnings.push(
      `数据长度 ${usable} 不能整除帧字节 ${bpf}；样本数按整帧截断为 ${sampleCount}。`,
    );
  }

  const fileId = input.fileId ?? `file-raw-${Date.now().toString(36)}`;
  const displayName = input.displayName ?? basename(input.path);
  const sampleRateHz = input.sampleRateHz;
  const centerFrequencyHz = input.centerFrequencyHz;
  const declaredBandwidthHz = input.declaredBandwidthHz ?? 0;
  const nyquist =
    sampleRateHz / (input.sampleFormat.structure === SampleStructure.Real ? 2 : 1);
  const effectiveBandwidthHz =
    declaredBandwidthHz > 0 ? declaredBandwidthHz : nyquist;
  const datatype = sampleFormatToDatatypeLabel(input.sampleFormat);

  const fileEntry: ProjectFileJson = {
    metadata: {
      id: fileId,
      name: displayName,
      path: input.path,
      sampleRateHz,
      centerFrequencyHz,
      sampleCount,
      availableSamples: sampleCount,
      sampleFormat: input.sampleFormat,
      declaredBandwidthHz,
      effectiveBandwidthHz,
      sourceFingerprint: `raw:${datatype}:${sampleCount}:${input.sampleFormat.headerBytes}:${input.sampleFormat.trailerBytes}`,
      demo: false,
    },
    view: {
      time: { begin: '0', end: sampleCount },
      frequency: {
        lowerHz: centerFrequencyHz - sampleRateHz / 2,
        upperHz: centerFrequencyHz + sampleRateHz / 2,
      },
    },
    channels: [],
  };

  const mode: ImportStreamMode = input.mode ?? 'append';
  let project: ProjectDocumentJson;
  if (mode === 'replace' || !input.project) {
    project = emptyProject(fileEntry.metadata.name);
    project.files = [fileEntry];
  } else {
    project = {
      ...input.project,
      schema: PROJECT_SCHEMA,
      version: PROJECT_WRITE_VERSION,
      files: [...input.project.files, fileEntry],
    };
  }
  project.activeFileId = fileId;

  const annotations = emptyAnnotations(fileId);
  const acquisitionKnown =
    sampleRateHz > 0 && Number.isFinite(centerFrequencyHz);

  const provenanceParts = [
    input.templateId ? `template:${input.templateId}` : 'manual sample format',
    'RAW commit stream (no SourceLoader envelope)',
  ];

  const row: ImportStreamRow = {
    id: fileId,
    displayName: fileEntry.metadata.name,
    path: input.path,
    format: 'raw',
    status: 'Ready',
    sampleRateHz,
    centerFrequencyHz,
    sampleCount,
    datatype,
    sampleFormat: input.sampleFormat,
    provenance: provenanceParts.join(' · '),
    warnings: warnings.join(''),
    confirmed: true,
    selected: true,
    acquisitionKnown,
    committed: true,
  };

  return {
    project,
    annotations,
    tree: engineeringTreeFromProject(project),
    row,
    warnings,
  };
}

/**
 * Template id → sampleFormat → importRawStream (Bot-B Add-signal confirm).
 */
export function importRawWithTemplate(
  input: Omit<ImportRawStreamInput, 'sampleFormat' | 'templateId'> & {
    templateId: string;
    userTemplates?: FormatTemplate[];
    headerBytes?: string;
    trailerBytes?: string;
  },
): ImportRawStreamResult {
  const tmpl = getFormatTemplateById(input.templateId, input.userTemplates ?? []);
  if (!tmpl) {
    throw new ProjectIoError(`未知格式模板: ${input.templateId}`);
  }
  const sampleFormat: SampleFormatDescriptor = {
    ...tmpl.sampleFormat,
    headerBytes: input.headerBytes ?? tmpl.sampleFormat.headerBytes,
    trailerBytes: input.trailerBytes ?? tmpl.sampleFormat.trailerBytes,
  };
  return importRawStream({
    ...input,
    sampleFormat,
    templateId: tmpl.id,
  });
}
