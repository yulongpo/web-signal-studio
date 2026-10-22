/**
 * G19-G20 import stream: add a SigMF source into a native project document
 * (desktop ImportController.add semantics 鈥?append a file row; do not wipe
 * an existing project unless mode is replace).
 *
 * IQ bytes stay outside project-io; callers pass meta text + data byte length
 * (and optionally open via @wss/file-io openSigmfArrayBuffer for charting).
 *
 * PARITY deepen: parse fields follow desktop readSigmfMetadata
 * (offset 鈮?disk header; header_bytes from first capture; warnings/provenance).
 */

import {
  ANNOTATIONS_EXPORT_SCHEMA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  sampleIndexToDecimal,
  type AnnotationJson,
  type AnnotationsDocumentJson,
  type ProjectDocumentJson,
  type ProjectFileJson,
  type SampleFormatDescriptor,
} from '@wss/contracts';
import { bytesPerFrame, parseSigmfMeta } from '@wss/file-io';
import { assertAllowedDemoIqPath, isAllowedDemoIqPath } from './demo-iq-paths.js';
import { engineeringTreeFromProject, type EngineeringTreeNode } from './engineering-tree.js';
import { ProjectIoError } from './load-project.js';

export type ImportStreamMode = 'append' | 'replace';

/** Desktop ImportStatus subset used by the stream (no SourceLoader poll yet). */
export type ImportStreamStatus =
  | 'Pending'
  | 'Reading'
  | 'Ready'
  | 'Partial'
  | 'Failed'
  | 'Cancelled';

export interface ImportStreamRow {
  id: string;
  displayName: string;
  path: string;
  format: 'sigmf' | 'raw';
  status: ImportStreamStatus;
  sampleRateHz: number;
  centerFrequencyHz: number;
  /** Canonical decimal sample count. */
  sampleCount: string;
  datatype: string;
  sampleFormat?: SampleFormatDescriptor;
  /** External core:offset (not disk header). */
  externalSampleOffset?: string;
  error?: string;
  metadataError?: string;
  /** Provenance note (desktop ImportRow.provenance analogue). */
  provenance: string;
  /** Concatenated desktop-style warnings. */
  warnings?: string;
  confirmed?: boolean;
  selected?: boolean;
  acquisitionKnown?: boolean;
  committed?: boolean;
}

export interface ImportSigmfStreamInput {
  /** SigMF .sigmf-meta JSON text. */
  metaText: string;
  /** Byte length of .sigmf-data (used to derive sampleCount). */
  dataByteLength: number;
  /** Optional companion rfbench / desktop .json meta beside the pair. */
  companionJsonText?: string;
  displayName?: string;
  /** Source path recorded on FileMetadata.path 鈥?must be allowlisted when enforceDemoPath. */
  path: string;
  /** Existing project to append into (ignored when mode=replace). */
  project?: ProjectDocumentJson;
  mode?: ImportStreamMode;
  /**
   * When true (default for G19 validation), path must be under the allowed
   * sigmf_data_demo 0000000.* set.
   */
  enforceDemoPath?: boolean;
  fileId?: string;
}

export interface ImportSigmfStreamResult {
  project: ProjectDocumentJson;
  annotations: AnnotationsDocumentJson;
  tree: EngineeringTreeNode[];
  row: ImportStreamRow;
  /** Parsed companion schema if provided (e.g. rfbench-v1). */
  companionSchema?: string;
  /** Desktop-parity parse warnings. */
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
    sourceSets: [
      {
        id: 'ss-sigmf-import',
        fileId,
        sourceKind: 'ImportedLabel',
        formatId: 'sigmf-core-annotations',
      },
    ],
    annotations: [],
  };
}

function sampleCountFromDataBytes(
  dataByteLength: number,
  headerBytes: string,
  trailerBytes: string,
  bpf: number,
): bigint {
  if (!Number.isFinite(dataByteLength) || dataByteLength < 0 || !Number.isInteger(dataByteLength)) {
    throw new ProjectIoError(`Invalid dataByteLength: ${dataByteLength}`);
  }
  const header = BigInt(headerBytes);
  const trailer = BigInt(trailerBytes);
  const usable = BigInt(dataByteLength) - header - trailer;
  if (usable < 0n) {
    throw new ProjectIoError('dataByteLength smaller than SigMF header+trailer');
  }
  if (bpf <= 0) throw new ProjectIoError(`Invalid bytesPerFrame: ${bpf}`);
  if (usable % BigInt(bpf) !== 0n) {
    throw new ProjectIoError(
      `SigMF data length ${usable} not divisible by bytesPerFrame ${bpf}`,
    );
  }
  return usable / BigInt(bpf);
}

function sigmfAnnotationsToMarks(
  _fileId: string,
  rawAnnotations: unknown[],
): AnnotationJson[] {
  const out: AnnotationJson[] = [];
  for (let i = 0; i < rawAnnotations.length; i++) {
    const a = rawAnnotations[i];
    if (!a || typeof a !== 'object') continue;
    const rec = a as Record<string, unknown>;
    const startNum = Number(rec['core:sample_start'] ?? NaN);
    const countNum = Number(rec['core:sample_count'] ?? NaN);
    if (!Number.isFinite(startNum) || !Number.isFinite(countNum) || countNum < 0) continue;
    const start = BigInt(Math.trunc(startNum));
    const end = start + BigInt(Math.trunc(countNum));
    const label = typeof rec['core:label'] === 'string' ? rec['core:label'] : `sigmf-${i}`;
    const lower = Number(rec['core:freq_lower_edge'] ?? 0);
    const upper = Number(rec['core:freq_upper_edge'] ?? 0);
    out.push({
      id: `sigmf-ann-${i}`,
      name: label,
      sourceKind: 'ImportedLabel',
      start: sampleIndexToDecimal(start),
      end: sampleIndexToDecimal(end),
      lowerHz: Number.isFinite(lower) ? lower : 0,
      upperHz: Number.isFinite(upper) ? upper : 0,
    });
  }
  return out;
}

/**
 * Import a SigMF meta(+data length) stream into a v6 project document and
 * build an engineering tree. Desktop analogue: ImportController.add + commit
 * of one Ready row.
 */
export function importSigmfStream(input: ImportSigmfStreamInput): ImportSigmfStreamResult {
  const enforce = input.enforceDemoPath !== false;
  if (enforce) {
    assertAllowedDemoIqPath(input.path);
  } else if (!input.path) {
    throw new ProjectIoError('importSigmfStream requires path');
  }

  const parsed = parseSigmfMeta(input.metaText);
  const bpf = bytesPerFrame(parsed.format);
  const sampleCountBi = sampleCountFromDataBytes(
    input.dataByteLength,
    parsed.format.headerBytes,
    parsed.format.trailerBytes,
    bpf,
  );
  const sampleCount = sampleIndexToDecimal(sampleCountBi);
  const sampleRateHz = parsed.sampleRateHz ?? 0;
  const centerFrequencyHz = parsed.centerFrequencyHz ?? 0;
  const fileId = input.fileId ?? `file-sigmf-${Date.now().toString(36)}`;
  const displayName = input.displayName ?? input.path.split(/\\|\//).pop() ?? 'sigmf';

  let companionSchema: string | undefined;
  if (input.companionJsonText) {
    try {
      const companion = JSON.parse(input.companionJsonText) as {
        schema?: unknown;
        capture_samples?: unknown;
      };
      if (typeof companion.schema === 'string') companionSchema = companion.schema;
      if (typeof companion.capture_samples === 'number') {
        const expected = BigInt(Math.trunc(companion.capture_samples));
        if (expected !== sampleCountBi) {
          throw new ProjectIoError(
            `companion capture_samples ${expected} != data-derived sampleCount ${sampleCount}`,
          );
        }
      }
    } catch (err) {
      if (err instanceof ProjectIoError) throw err;
      throw new ProjectIoError(
        `companion JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  const baseName = displayName.replace(/\.sigmf-meta$/i, '').replace(/\.sigmf-data$/i, '');
  const fileEntry: ProjectFileJson = {
    metadata: {
      id: fileId,
      name: `${baseName}.sigmf`,
      path: input.path,
      sampleRateHz,
      centerFrequencyHz,
      sampleCount,
      availableSamples: sampleCount,
      sampleFormat: parsed.format,
      sourceFingerprint: `sigmf:${parsed.datatype}:${sampleCount}`,
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
  const rawAnn = Array.isArray(parsed.raw.annotations) ? parsed.raw.annotations : [];
  annotations.annotations = sigmfAnnotationsToMarks(fileId, rawAnn);

  const acquisitionKnown = sampleRateHz > 0 && Number.isFinite(centerFrequencyHz);
  const row: ImportStreamRow = {
    id: fileId,
    displayName: fileEntry.metadata.name,
    path: input.path,
    format: 'sigmf',
    status: 'Ready',
    sampleRateHz,
    centerFrequencyHz,
    sampleCount,
    datatype: parsed.datatype,
    sampleFormat: parsed.format,
    externalSampleOffset: parsed.externalSampleOffset,
    provenance:
      (enforce && isAllowedDemoIqPath(input.path)
        ? 'sigmf_data_demo allowlist 路 '
        : 'user-supplied path 路 ') + parsed.provenance,
    warnings: parsed.warnings.join(''),
    confirmed: true,
    selected: true,
    acquisitionKnown,
    committed: false,
  };

  return {
    project,
    annotations,
    tree: engineeringTreeFromProject(project),
    row,
    companionSchema,
    warnings: parsed.warnings,
  };
}
