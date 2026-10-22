import { describe, expect, it } from 'vitest';
import {
  ComponentEncoding,
  SampleStructure,
  ByteOrder,
  IqLayout,
} from '@wss/contracts';
import {
  FormatTemplateStore,
  decodeFormatTemplatesJson,
  encodeFormatTemplatesJson,
  encodeSampleFormatDesktop,
  getFormatTemplateById,
  listBuiltinFormatTemplates,
} from './format-templates.js';

describe('format templates (desktop FormatTemplateStore parity)', () => {
  it('lists five builtins with stable ids/names', () => {
    const builtins = listBuiltinFormatTemplates();
    expect(builtins).toHaveLength(5);
    expect(builtins.map((t) => t.id)).toEqual([
      'builtin-0',
      'builtin-1',
      'builtin-2',
      'builtin-3',
      'builtin-4',
    ]);
    expect(builtins.map((t) => t.name)).toEqual([
      '通用 CI16',
      '通用 CF32',
      '通用 CI8',
      '通用 CU8',
      '实数 Int16 ADC',
    ]);
    expect(builtins[0]?.sampleFormat.componentEncoding).toBe(ComponentEncoding.Int16);
    expect(builtins[1]?.sampleFormat.componentEncoding).toBe(ComponentEncoding.Float32);
    expect(builtins[1]?.sampleFormat.normalizeIntegerAdc).toBe(false);
    expect(builtins[4]?.sampleFormat.structure).toBe(SampleStructure.Real);
    expect(builtins[4]?.sampleFormat.iqLayout).toBe(IqLayout.NotApplicable);
  });

  it('round-trips user templates via desktop JSON shape', () => {
    const store = new FormatTemplateStore();
    const added = store.add('我的CI16', {
      structure: SampleStructure.ComplexIQ,
      componentEncoding: ComponentEncoding.Int16,
      byteOrder: ByteOrder.Little,
      iqLayout: IqLayout.IqInterleaved,
      channels: 1,
      selectedChannel: 0,
      headerBytes: '0',
      trailerBytes: '0',
      normalizeIntegerAdc: true,
    });
    expect(added.builtin).toBe(false);
    const json = store.exportJson();
    const parsed = JSON.parse(json) as { format: string; version: number; templates: unknown[] };
    expect(parsed.format).toBe('signal-studio-format-templates');
    expect(parsed.version).toBe(1);
    expect(parsed.templates).toHaveLength(1);

    const round = decodeFormatTemplatesJson(json);
    expect(round).toHaveLength(1);
    expect(round[0]?.name).toBe('我的CI16');
    expect(round[0]?.sampleFormat.componentEncoding).toBe(ComponentEncoding.Int16);

    const desktop = encodeSampleFormatDesktop(round[0]!.sampleFormat);
    expect(desktop.structure).toBe('complex');
    expect(desktop.encoding).toBe('I16');
    expect(desktop.byteOrder).toBe('le');
    expect(desktop.iqLayout).toBe('iq');
    expect(desktop.channelLayout).toBe('interleaved');
  });

  it('rejects prototype / wrong format JSON', () => {
    expect(() =>
      decodeFormatTemplatesJson(JSON.stringify({ format: 'other', version: 1, templates: [] })),
    ).toThrow(/原生格式模板/);
    expect(() => encodeFormatTemplatesJson([])).not.toThrow();
  });

  it('getFormatTemplateById resolves builtins', () => {
    expect(getFormatTemplateById('builtin-1')?.name).toBe('通用 CF32');
    expect(getFormatTemplateById('missing')).toBeUndefined();
  });
});
