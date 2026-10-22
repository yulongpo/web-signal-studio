/**
 * Add-signal / ImportController preview surface (Bot-F).
 *
 * Desktop analogues:
 * - SourceSuggestions / suggestSourceMetadata / readSigmfMetadata
 * - describeRawFile (sampleCount from format + byte length)
 * - ImportRow preview fields before commit
 *
 * Bot-B wires file pickers / UI chrome; call these helpers for parse + preview.
 */

import {
  ByteOrder,
  ComponentEncoding,
  IqLayout,
  SampleStructure,
  sampleIndexToDecimal,
  type SampleFormatDescriptor,
} from '@wss/contracts';
import { bytesPerFrame, describeRaw, parseSigmfMeta, SigmfMetaError } from '@wss/file-io';
import {
  getFormatTemplateById,
  type FormatTemplate,
} from './format-templates.js';
import { ProjectIoError } from './load-project.js';

/** Desktop ImportStatus subset used before SourceLoader poll. */
export type ImportPreviewStatus =
  | 'Pending'
  | 'Reading'
  | 'Ready'
  | 'Partial'
  | 'Failed'
  | 'Cancelled';

/** Desktop SourceSuggestions analogue (JSON-friendly). */
export interface SourceSuggestionsJson {
  dataPath: string;
  provenance: string;
  error: string;
  conflicts: string;
  warnings: string;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  bandwidthHz?: number;
  format?: SampleFormatDescriptor;
  /** Decimal sample count string when known from container / data length. */
  sampleCount?: string;
  formatLocked: boolean;
  sampleRateLocked: boolean;
  datatype?: string;
  externalSampleOffset?: string;
}

/** Desktop ImportRow-ish preview for Add-signal form. */
export interface ImportPreviewRow {
  id: string;
  displayName: string;
  path: string;
  /** Detected / selected format kind for UI. */
  formatKind: 'sigmf' | 'raw' | 'wav' | 'unknown';
  status: ImportPreviewStatus;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  declaredBandwidthHz?: number;
  sampleCount?: string;
  datatype?: string;
  sampleFormat?: SampleFormatDescriptor;
  error?: string;
  metadataError?: string;
  provenance: string;
  warnings: string;
  conflicts: string;
  confirmed: boolean;
  selected: boolean;
  acquisitionKnown: boolean;
  committed: boolean;
  templateId?: string;
}

export interface DescribeRawIqInput {
  /** Absolute or display path (recorded only). */
  path: string;
  dataByteLength: number;
  sampleFormat: SampleFormatDescriptor;
  sampleRateHz: number;
  centerFrequencyHz: number;
  declaredBandwidthHz?: number;
  displayName?: string;
  templateId?: string;
  fileId?: string;
  /** When true, require fs/fc confirmed (desktop ImportController.confirmed). */
  confirmed?: boolean;
}

export interface PreviewSigmfInput {
  metaText: string;
  /** Optional .sigmf-data byte length → sampleCount. */
  dataByteLength?: number;
  path: string;
  displayName?: string;
  fileId?: string;
  companionJsonText?: string;
}

function emptySuggestions(path: string): SourceSuggestionsJson {
  return {
    dataPath: path,
    provenance: '',
    error: '',
    conflicts: '',
    warnings: '',
    formatLocked: false,
    sampleRateLocked: false,
  };
}

function basename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

/**
 * Filename hints: FS / FC / BW + (C|R)(I8|U8|I16|I32|F32|F64) — desktop suggestSourceMetadata.
 */
export function suggestFromFilename(path: string): SourceSuggestionsJson {
  const s = emptySuggestions(path);
  const name = basename(path);

  const value = (key: string): number | undefined => {
    const re = new RegExp(`(?:^|_)${key}([0-9]+(?:\\.[0-9]+)?)([kmg]?(?:sps|hz))`, 'i');
    const m = re.exec(name);
    if (!m) return undefined;
    let v = Number(m[1]);
    if (!Number.isFinite(v) || v < 0) return undefined;
    const unit = m[2]!.toLowerCase();
    if (unit.startsWith('k')) v *= 1e3;
    else if (unit.startsWith('m')) v *= 1e6;
    else if (unit.startsWith('g')) v *= 1e9;
    return v;
  };

  s.sampleRateHz = value('FS');
  s.centerFrequencyHz = value('FC');
  s.bandwidthHz = value('BW');

  const fmt = /(?:^|[_.])(C|R)(I8|U8|I16|I32|F32|F64)(?:[_.]|$)/i.exec(name);
  if (fmt) {
    const structure =
      fmt[1]!.toUpperCase() === 'R' ? SampleStructure.Real : SampleStructure.ComplexIQ;
    const encMap: Record<string, ComponentEncoding> = {
      I8: ComponentEncoding.Int8,
      U8: ComponentEncoding.UInt8,
      I16: ComponentEncoding.Int16,
      I32: ComponentEncoding.Int32,
      F32: ComponentEncoding.Float32,
      F64: ComponentEncoding.Float64,
    };
    const componentEncoding = encMap[fmt[2]!.toUpperCase()]!;
    const is8 =
      componentEncoding === ComponentEncoding.Int8 ||
      componentEncoding === ComponentEncoding.UInt8;
    const isFloat =
      componentEncoding === ComponentEncoding.Float32 ||
      componentEncoding === ComponentEncoding.Float64;
    s.format = {
      structure,
      componentEncoding,
      byteOrder: is8 ? ByteOrder.NotApplicable : ByteOrder.Little,
      iqLayout:
        structure === SampleStructure.Real ? IqLayout.NotApplicable : IqLayout.IqInterleaved,
      channels: 1,
      selectedChannel: 0,
      headerBytes: '0',
      trailerBytes: '0',
      normalizeIntegerAdc: !isFloat,
    };
  }

  s.provenance = `Fs：${s.sampleRateHz !== undefined ? '文件名' : '需手动确认'} · Fc：${
    s.centerFrequencyHz !== undefined ? '文件名' : '需手动确认'
  } · 格式：${s.format ? '文件名建议' : '未识别，需确认'}`;
  return s;
}

/**
 * Parse SigMF meta text into SourceSuggestions (desktop readSigmfMetadata fields).
 * Does not read the filesystem — caller supplies metaText (+ optional data length).
 */
export function suggestFromSigmfMeta(input: {
  path: string;
  metaText: string;
  dataByteLength?: number;
}): SourceSuggestionsJson {
  const s = emptySuggestions(input.path);
  try {
    const parsed = parseSigmfMeta(input.metaText);
    s.format = parsed.format;
    s.sampleRateHz = parsed.sampleRateHz;
    s.centerFrequencyHz = parsed.centerFrequencyHz;
    s.datatype = parsed.datatype;
    s.externalSampleOffset = parsed.externalSampleOffset;
    s.provenance = parsed.provenance;
    s.warnings = parsed.warnings.join('');
    s.formatLocked = true;
    if (parsed.sampleRateHz !== undefined) s.sampleRateLocked = true;

    if (input.dataByteLength !== undefined) {
      try {
        const described = describeRaw({
          byteLength: input.dataByteLength,
          format: parsed.format,
          sampleRateHz: parsed.sampleRateHz,
          centerFrequencyHz: parsed.centerFrequencyHz,
        });
        s.sampleCount = sampleIndexToDecimal(described.totalSamples);
      } catch (err) {
        s.error =
          err instanceof Error ? err.message : `data length / format mismatch: ${String(err)}`;
      }
    }
  } catch (err) {
    const msg =
      err instanceof SigmfMetaError || err instanceof Error ? err.message : String(err);
    s.error = msg.startsWith('SigMF') ? msg : `SigMF：${msg}`;
    s.format = undefined;
    s.sampleRateHz = undefined;
    s.centerFrequencyHz = undefined;
  }
  return s;
}

/**
 * Merge filename hints + SigMF meta (desktop suggestSourceMetadata SigMF branch).
 */
export function suggestSourceMetadata(input: {
  path: string;
  metaText?: string;
  dataByteLength?: number;
}): SourceSuggestionsJson {
  const fromName = suggestFromFilename(input.path);
  const lower = input.path.toLowerCase();
  if (
    (lower.endsWith('.sigmf-meta') || lower.endsWith('.sigmf-data')) &&
    input.metaText !== undefined
  ) {
    const meta = suggestFromSigmfMeta({
      path: input.path,
      metaText: input.metaText,
      dataByteLength: input.dataByteLength,
    });
    if (meta.error) {
      return {
        ...fromName,
        dataPath: meta.dataPath,
        error: meta.error,
        warnings: meta.warnings,
        format: undefined,
        sampleRateHz: undefined,
        centerFrequencyHz: undefined,
        sampleCount: undefined,
      };
    }
    const conflict = (key: string, before?: number | SampleFormatDescriptor, after?: number | SampleFormatDescriptor) => {
      if (before !== undefined && after !== undefined && JSON.stringify(before) !== JSON.stringify(after)) {
        meta.conflicts += `${key}与文件名冲突；采用SigMF（可手动覆盖）。`;
      }
    };
    conflict('Fs', fromName.sampleRateHz, meta.sampleRateHz);
    conflict('Fc', fromName.centerFrequencyHz, meta.centerFrequencyHz);
    conflict('格式', fromName.format, meta.format);
    meta.bandwidthHz = fromName.bandwidthHz;
    meta.provenance = `${meta.provenance}优先 · ${fromName.provenance}`;
    return meta;
  }
  return fromName;
}

/**
 * describeRawFile analogue: compute sampleCount + ImportPreviewRow from template/format.
 */
export function describeRawIqForImport(input: DescribeRawIqInput): ImportPreviewRow {
  const id = input.fileId ?? `file-raw-${Date.now().toString(36)}`;
  const displayName = input.displayName ?? basename(input.path);
  const confirmed = input.confirmed === true;

  const row: ImportPreviewRow = {
    id,
    displayName,
    path: input.path,
    formatKind: 'raw',
    status: 'Pending',
    sampleRateHz: input.sampleRateHz,
    centerFrequencyHz: input.centerFrequencyHz,
    declaredBandwidthHz: input.declaredBandwidthHz ?? 0,
    sampleFormat: input.sampleFormat,
    provenance: input.templateId
      ? `template:${input.templateId}`
      : 'manual sample format',
    warnings: '',
    conflicts: '',
    confirmed,
    selected: true,
    acquisitionKnown:
      Number.isFinite(input.sampleRateHz) &&
      input.sampleRateHz > 0 &&
      Number.isFinite(input.centerFrequencyHz),
    committed: false,
    templateId: input.templateId,
  };

  if (!confirmed) {
    row.status = 'Failed';
    row.error = '请确认采样结构、编码及缺失的采集参数';
    row.metadataError = row.error;
    return row;
  }

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
    const described = describeRaw({
      byteLength: input.dataByteLength,
      format: input.sampleFormat,
      sampleRateHz: input.sampleRateHz,
      centerFrequencyHz: input.centerFrequencyHz,
    });
    row.sampleCount = sampleIndexToDecimal(described.totalSamples);
    row.status = 'Ready';
  } catch (err) {
    row.status = 'Failed';
    row.error = err instanceof Error ? err.message : String(err);
    row.metadataError = row.error;
  }
  return row;
}

/**
 * Apply a builtin/user template id onto a describeRawIqForImport call.
 */
export function describeRawIqWithTemplate(
  input: Omit<DescribeRawIqInput, 'sampleFormat' | 'templateId'> & {
    templateId: string;
    userTemplates?: FormatTemplate[];
    /** Optional overrides (header/trailer) after template. */
    headerBytes?: string;
    trailerBytes?: string;
  },
): ImportPreviewRow {
  const tmpl = getFormatTemplateById(input.templateId, input.userTemplates ?? []);
  if (!tmpl) {
    return {
      id: input.fileId ?? 'file-raw-missing-template',
      displayName: input.displayName ?? basename(input.path),
      path: input.path,
      formatKind: 'raw',
      status: 'Failed',
      error: `未知格式模板: ${input.templateId}`,
      metadataError: `未知格式模板: ${input.templateId}`,
      provenance: '',
      warnings: '',
      conflicts: '',
      confirmed: false,
      selected: true,
      acquisitionKnown: false,
      committed: false,
      templateId: input.templateId,
    };
  }
  const sampleFormat: SampleFormatDescriptor = {
    ...tmpl.sampleFormat,
    headerBytes: input.headerBytes ?? tmpl.sampleFormat.headerBytes,
    trailerBytes: input.trailerBytes ?? tmpl.sampleFormat.trailerBytes,
  };
  return describeRawIqForImport({
    ...input,
    sampleFormat,
    templateId: tmpl.id,
  });
}

/**
 * SigMF parse preview → ImportPreviewRow (no project mutation).
 * Bot-B Add-signal: show fields, then call importSigmfStream on confirm.
 */
export function previewSigmfImport(input: PreviewSigmfInput): {
  suggestions: SourceSuggestionsJson;
  row: ImportPreviewRow;
} {
  const suggestions = suggestFromSigmfMeta({
    path: input.path,
    metaText: input.metaText,
    dataByteLength: input.dataByteLength,
  });

  const id = input.fileId ?? `file-sigmf-${Date.now().toString(36)}`;
  const displayName = input.displayName ?? basename(input.path);

  if (suggestions.error) {
    return {
      suggestions,
      row: {
        id,
        displayName,
        path: input.path,
        formatKind: 'sigmf',
        status: 'Failed',
        error: suggestions.error,
        metadataError: suggestions.error,
        provenance: suggestions.provenance,
        warnings: suggestions.warnings,
        conflicts: suggestions.conflicts,
        confirmed: false,
        selected: true,
        acquisitionKnown: false,
        committed: false,
        datatype: suggestions.datatype,
      },
    };
  }

  let companionNote = '';
  if (input.companionJsonText) {
    try {
      const companion = JSON.parse(input.companionJsonText) as {
        schema?: unknown;
        capture_samples?: unknown;
      };
      if (typeof companion.schema === 'string') {
        companionNote = ` companion:${companion.schema}`;
      }
      if (
        typeof companion.capture_samples === 'number' &&
        suggestions.sampleCount !== undefined
      ) {
        const expected = String(Math.trunc(companion.capture_samples));
        if (expected !== suggestions.sampleCount) {
          return {
            suggestions: {
              ...suggestions,
              error: `companion capture_samples ${expected} != data-derived sampleCount ${suggestions.sampleCount}`,
            },
            row: {
              id,
              displayName,
              path: input.path,
              formatKind: 'sigmf',
              status: 'Failed',
              error: `companion capture_samples ${expected} != data-derived sampleCount ${suggestions.sampleCount}`,
              metadataError: `companion capture_samples mismatch`,
              provenance: suggestions.provenance + companionNote,
              warnings: suggestions.warnings,
              conflicts: suggestions.conflicts,
              confirmed: false,
              selected: true,
              acquisitionKnown: false,
              committed: false,
              datatype: suggestions.datatype,
              sampleFormat: suggestions.format,
              sampleRateHz: suggestions.sampleRateHz,
              centerFrequencyHz: suggestions.centerFrequencyHz,
              sampleCount: suggestions.sampleCount,
            },
          };
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        suggestions: { ...suggestions, error: `companion JSON parse failed: ${msg}` },
        row: {
          id,
          displayName,
          path: input.path,
          formatKind: 'sigmf',
          status: 'Failed',
          error: `companion JSON parse failed: ${msg}`,
          metadataError: msg,
          provenance: suggestions.provenance,
          warnings: suggestions.warnings,
          conflicts: suggestions.conflicts,
          confirmed: false,
          selected: true,
          acquisitionKnown: false,
          committed: false,
        },
      };
    }
  }

  const acquisitionKnown =
    suggestions.sampleRateHz !== undefined &&
    suggestions.sampleRateHz > 0 &&
    suggestions.centerFrequencyHz !== undefined;

  const row: ImportPreviewRow = {
    id,
    displayName,
    path: input.path,
    formatKind: 'sigmf',
    status: suggestions.sampleCount !== undefined ? 'Ready' : 'Pending',
    sampleRateHz: suggestions.sampleRateHz,
    centerFrequencyHz: suggestions.centerFrequencyHz,
    sampleCount: suggestions.sampleCount,
    datatype: suggestions.datatype,
    sampleFormat: suggestions.format,
    provenance: suggestions.provenance + companionNote,
    warnings: suggestions.warnings,
    conflicts: suggestions.conflicts,
    confirmed: acquisitionKnown,
    selected: true,
    acquisitionKnown,
    committed: false,
  };
  return { suggestions, row };
}
