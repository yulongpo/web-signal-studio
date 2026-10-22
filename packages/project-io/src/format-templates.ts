/**
 * Format templates aligned to desktop FormatTemplateStore
 * (signal_studio_rebuild/infrastructure/format_template_store.cpp).
 *
 * Builtins (ids builtin-0..4):
 *   通用 CI16 / 通用 CF32 / 通用 CI8 / 通用 CU8 / 实数 Int16 ADC
 *
 * Wire JSON format: { format: "signal-studio-format-templates", version: 1, templates: [...] }
 * sampleFormat uses desktop encodeSampleFormat keys for round-trip with desktop exports.
 */

import {
  ByteOrder,
  ComponentEncoding,
  IqLayout,
  SampleStructure,
  type SampleFormatDescriptor,
} from '@wss/contracts';
import { ProjectIoError } from './load-project.js';

export const FORMAT_TEMPLATES_FORMAT = 'signal-studio-format-templates' as const;
export const FORMAT_TEMPLATES_VERSION = 1 as const;

export interface FormatTemplate {
  id: string;
  name: string;
  sampleFormat: SampleFormatDescriptor;
  builtin: boolean;
}

/** Desktop-compatible sampleFormat object inside template JSON. */
export interface DesktopSampleFormatJson {
  structure: 'complex' | 'real';
  encoding: 'I8' | 'U8' | 'I16' | 'I32' | 'F32' | 'F64';
  byteOrder: 'na' | 'le' | 'be';
  iqLayout: 'na' | 'iq' | 'qi' | 'planar';
  channels: number;
  selectedChannel: number;
  channelLayout: 'interleaved' | 'planar';
  headerBytes: string;
  trailerBytes: string;
  normalizeIntegerAdc: boolean;
}

export interface FormatTemplatesDocumentJson {
  format: typeof FORMAT_TEMPLATES_FORMAT;
  version: typeof FORMAT_TEMPLATES_VERSION;
  templates: Array<{
    id: string;
    name: string;
    sampleFormat: DesktopSampleFormatJson;
  }>;
}

function baseComplex(encoding: ComponentEncoding, byteOrder: ByteOrder): SampleFormatDescriptor {
  const is8 =
    encoding === ComponentEncoding.Int8 || encoding === ComponentEncoding.UInt8;
  const isFloat =
    encoding === ComponentEncoding.Float32 || encoding === ComponentEncoding.Float64;
  return {
    structure: SampleStructure.ComplexIQ,
    componentEncoding: encoding,
    byteOrder: is8 ? ByteOrder.NotApplicable : byteOrder,
    iqLayout: IqLayout.IqInterleaved,
    channels: 1,
    selectedChannel: 0,
    headerBytes: '0',
    trailerBytes: '0',
    normalizeIntegerAdc: !isFloat,
  };
}

/** Five desktop builtins — order and ids stable for Add-signal UI. */
export function listBuiltinFormatTemplates(): FormatTemplate[] {
  return [
    {
      id: 'builtin-0',
      name: '通用 CI16',
      sampleFormat: baseComplex(ComponentEncoding.Int16, ByteOrder.Little),
      builtin: true,
    },
    {
      id: 'builtin-1',
      name: '通用 CF32',
      sampleFormat: baseComplex(ComponentEncoding.Float32, ByteOrder.Little),
      builtin: true,
    },
    {
      id: 'builtin-2',
      name: '通用 CI8',
      sampleFormat: baseComplex(ComponentEncoding.Int8, ByteOrder.NotApplicable),
      builtin: true,
    },
    {
      id: 'builtin-3',
      name: '通用 CU8',
      sampleFormat: baseComplex(ComponentEncoding.UInt8, ByteOrder.NotApplicable),
      builtin: true,
    },
    {
      id: 'builtin-4',
      name: '实数 Int16 ADC',
      sampleFormat: {
        structure: SampleStructure.Real,
        componentEncoding: ComponentEncoding.Int16,
        byteOrder: ByteOrder.Little,
        iqLayout: IqLayout.NotApplicable,
        channels: 1,
        selectedChannel: 0,
        headerBytes: '0',
        trailerBytes: '0',
        normalizeIntegerAdc: true,
      },
      builtin: true,
    },
  ];
}

export function getFormatTemplateById(
  id: string,
  userTemplates: FormatTemplate[] = [],
): FormatTemplate | undefined {
  return [...listBuiltinFormatTemplates(), ...userTemplates].find((t) => t.id === id);
}

const ENC_TO_DESKTOP: Record<ComponentEncoding, DesktopSampleFormatJson['encoding']> = {
  [ComponentEncoding.Int8]: 'I8',
  [ComponentEncoding.UInt8]: 'U8',
  [ComponentEncoding.Int16]: 'I16',
  [ComponentEncoding.Int32]: 'I32',
  [ComponentEncoding.Float32]: 'F32',
  [ComponentEncoding.Float64]: 'F64',
};

const DESKTOP_TO_ENC: Record<DesktopSampleFormatJson['encoding'], ComponentEncoding> = {
  I8: ComponentEncoding.Int8,
  U8: ComponentEncoding.UInt8,
  I16: ComponentEncoding.Int16,
  I32: ComponentEncoding.Int32,
  F32: ComponentEncoding.Float32,
  F64: ComponentEncoding.Float64,
};

export function encodeSampleFormatDesktop(
  f: SampleFormatDescriptor,
  channelLayout: DesktopSampleFormatJson['channelLayout'] = 'interleaved',
): DesktopSampleFormatJson {
  return {
    structure: f.structure === SampleStructure.Real ? 'real' : 'complex',
    encoding: ENC_TO_DESKTOP[f.componentEncoding],
    byteOrder:
      f.byteOrder === ByteOrder.NotApplicable
        ? 'na'
        : f.byteOrder === ByteOrder.Big
          ? 'be'
          : 'le',
    iqLayout:
      f.iqLayout === IqLayout.NotApplicable
        ? 'na'
        : f.iqLayout === IqLayout.QiInterleaved
          ? 'qi'
          : f.iqLayout === IqLayout.PlanarIq
            ? 'planar'
            : 'iq',
    channels: f.channels,
    selectedChannel: f.selectedChannel,
    channelLayout,
    headerBytes: f.headerBytes,
    trailerBytes: f.trailerBytes,
    normalizeIntegerAdc: f.normalizeIntegerAdc,
  };
}

export function decodeSampleFormatDesktop(o: DesktopSampleFormatJson): SampleFormatDescriptor {
  if (!o || typeof o !== 'object') {
    throw new ProjectIoError('无效的样本格式 JSON');
  }
  const structure =
    o.structure === 'real'
      ? SampleStructure.Real
      : o.structure === 'complex'
        ? SampleStructure.ComplexIQ
        : (() => {
            throw new ProjectIoError('无效的样本格式 JSON structure');
          })();
  const encoding = DESKTOP_TO_ENC[o.encoding];
  if (!encoding) throw new ProjectIoError('无效的样本格式 JSON encoding');

  const byteOrder =
    o.byteOrder === 'na'
      ? ByteOrder.NotApplicable
      : o.byteOrder === 'le'
        ? ByteOrder.Little
        : o.byteOrder === 'be'
          ? ByteOrder.Big
          : (() => {
              throw new ProjectIoError('无效的样本格式 JSON byteOrder');
            })();

  const iqLayout =
    o.iqLayout === 'na'
      ? IqLayout.NotApplicable
      : o.iqLayout === 'iq'
        ? IqLayout.IqInterleaved
        : o.iqLayout === 'qi'
          ? IqLayout.QiInterleaved
          : o.iqLayout === 'planar'
            ? IqLayout.PlanarIq
            : (() => {
                throw new ProjectIoError('无效的样本格式 JSON iqLayout');
              })();

  if (
    typeof o.channels !== 'number' ||
    !Number.isInteger(o.channels) ||
    o.channels < 1 ||
    o.channels > 128
  ) {
    throw new ProjectIoError('无效的样本格式 JSON channels');
  }
  if (
    typeof o.selectedChannel !== 'number' ||
    !Number.isInteger(o.selectedChannel) ||
    o.selectedChannel < 0 ||
    o.selectedChannel > 127
  ) {
    throw new ProjectIoError('无效的样本格式 JSON selectedChannel');
  }
  if (typeof o.headerBytes !== 'string' || typeof o.trailerBytes !== 'string') {
    throw new ProjectIoError('无效的样本格式 JSON header/trailer');
  }
  if (typeof o.normalizeIntegerAdc !== 'boolean') {
    throw new ProjectIoError('无效的样本格式 JSON normalizeIntegerAdc');
  }

  return {
    structure,
    componentEncoding: encoding,
    byteOrder,
    iqLayout,
    channels: o.channels,
    selectedChannel: o.selectedChannel,
    headerBytes: o.headerBytes,
    trailerBytes: o.trailerBytes,
    normalizeIntegerAdc: o.normalizeIntegerAdc,
  };
}

/** Encode user (non-builtin) templates for desktop-compatible export. */
export function encodeFormatTemplatesJson(userTemplates: FormatTemplate[]): string {
  const doc: FormatTemplatesDocumentJson = {
    format: FORMAT_TEMPLATES_FORMAT,
    version: FORMAT_TEMPLATES_VERSION,
    templates: userTemplates
      .filter((t) => !t.builtin)
      .map((t) => ({
        id: t.id,
        name: t.name,
        sampleFormat: encodeSampleFormatDesktop(t.sampleFormat),
      })),
  };
  return JSON.stringify(doc);
}

/** Decode desktop / web format-templates JSON (user templates only). */
export function decodeFormatTemplatesJson(text: string): FormatTemplate[] {
  let root: unknown;
  try {
    root = JSON.parse(text);
  } catch (err) {
    throw new ProjectIoError(
      `模板 JSON 解析失败: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!root || typeof root !== 'object') {
    throw new ProjectIoError('不是版本1的原生格式模板；原型JSON不能作为工程/模板直接导入');
  }
  const doc = root as Record<string, unknown>;
  if (doc.format !== FORMAT_TEMPLATES_FORMAT || doc.version !== 1 || !Array.isArray(doc.templates)) {
    throw new ProjectIoError('不是版本1的原生格式模板；原型JSON不能作为工程/模板直接导入');
  }
  if (doc.templates.length > 128) {
    throw new ProjectIoError('最多128个用户模板');
  }
  const out: FormatTemplate[] = [];
  const ids = new Set<string>();
  for (const item of doc.templates) {
    if (!item || typeof item !== 'object') {
      throw new ProjectIoError('模板名称/ID/格式无效或重复');
    }
    const t = item as Record<string, unknown>;
    const id = typeof t.id === 'string' ? t.id : '';
    const name = typeof t.name === 'string' ? t.name.trim() : '';
    if (
      !id ||
      id.length > 80 ||
      id.startsWith('builtin-') ||
      ids.has(id) ||
      !name ||
      name.length > 40 ||
      !t.sampleFormat ||
      typeof t.sampleFormat !== 'object'
    ) {
      throw new ProjectIoError('模板名称/ID/格式无效或重复');
    }
    ids.add(id);
    out.push({
      id,
      name,
      sampleFormat: decodeSampleFormatDesktop(t.sampleFormat as DesktopSampleFormatJson),
      builtin: false,
    });
  }
  return out;
}

/** In-memory store helper for Add-signal (no QSettings — B/host persists). */
export class FormatTemplateStore {
  private user: FormatTemplate[] = [];
  private recentIds: string[] = [];

  constructor(userTemplates: FormatTemplate[] = []) {
    this.user = [...userTemplates];
  }

  templates(): FormatTemplate[] {
    return [...listBuiltinFormatTemplates(), ...this.user];
  }

  recent(): string[] {
    return [...this.recentIds];
  }

  add(name: string, format: SampleFormatDescriptor): FormatTemplate {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 40 || this.user.length >= 128) {
      throw new ProjectIoError('模板名称1–40字，最多128个用户模板');
    }
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const t: FormatTemplate = { id, name: trimmed, sampleFormat: { ...format }, builtin: false };
    this.user.push(t);
    return t;
  }

  used(id: string): void {
    this.recentIds = [id, ...this.recentIds.filter((x) => x !== id)].slice(0, 8);
  }

  importJson(text: string): void {
    const staged = decodeFormatTemplatesJson(text);
    const byId = new Map(this.user.map((t) => [t.id, t]));
    for (const t of staged) byId.set(t.id, t);
    const merged = [...byId.values()];
    if (merged.length > 128) throw new ProjectIoError('用户模板超过128个');
    this.user = merged;
  }

  exportJson(): string {
    return encodeFormatTemplatesJson(this.user);
  }
}
