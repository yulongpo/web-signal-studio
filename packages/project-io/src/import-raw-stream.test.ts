/**
 * A Next #2: RAW → engineering-tree commit stream (Bot-F).
 * Desktop: describeRawFile + ImportController Ready → sources() → commit.
 */
import { describe, expect, it } from 'vitest';
import {
  ByteOrder,
  ComponentEncoding,
  IqLayout,
  SampleStructure,
  type SampleFormatDescriptor,
} from '@wss/contracts';
import { createG19E2eHook } from './g19-e2e-hook.js';
import {
  importRawStream,
  importRawWithTemplate,
  sampleFormatToDatatypeLabel,
  validateRawAcquisition,
} from './import-raw-stream.js';
import { openProjectFromJsonText } from './project-session.js';

const ci16: SampleFormatDescriptor = {
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

describe('importRawStream (RAW → project/tree commit)', () => {
  it('commits confirmed CI16 RAW into project + engineering tree', () => {
    // 1000 complex int16 frames = 1000 * 4 bytes
    const dataByteLength = 4000;
    const result = importRawStream({
      path: 'D:\\data\\capture.iq',
      dataByteLength,
      sampleFormat: ci16,
      sampleRateHz: 1_000_000,
      centerFrequencyHz: 100_000_000,
      declaredBandwidthHz: 200_000,
      displayName: 'capture.iq',
      templateId: 'builtin-0',
      confirmed: true,
      mode: 'replace',
      fileId: 'file-raw-ci16',
    });

    expect(result.row.format).toBe('raw');
    expect(result.row.status).toBe('Ready');
    expect(result.row.committed).toBe(true);
    expect(result.row.sampleCount).toBe('1000');
    expect(result.row.datatype).toBe('ci16_le');
    expect(result.row.sampleRateHz).toBe(1_000_000);
    expect(result.row.centerFrequencyHz).toBe(100_000_000);
    expect(result.project.files).toHaveLength(1);
    expect(result.project.activeFileId).toBe('file-raw-ci16');
    expect(result.project.files[0]?.metadata.sampleCount).toBe('1000');
    expect(result.project.files[0]?.metadata.sampleFormat?.componentEncoding).toBe(
      ComponentEncoding.Int16,
    );
    expect(result.project.files[0]?.metadata.declaredBandwidthHz).toBe(200_000);
    expect(result.project.files[0]?.metadata.effectiveBandwidthHz).toBe(200_000);
    expect(result.annotations.annotations).toHaveLength(0);

    const tree = result.tree;
    expect(tree[0]?.kind).toBe('project');
    const iqFolder = tree[0]?.children?.[0];
    expect(iqFolder?.label).toBe('IQ 文件');
    expect(iqFolder?.children?.[0]?.kind).toBe('file');
    expect(iqFolder?.children?.[0]?.sampleCount).toBe('1000');

    const opened = openProjectFromJsonText(JSON.stringify(result.project));
    expect(opened.document.files[0]?.metadata.sampleCount).toBe('1000');
  });

  it('rejects unconfirmed RAW (desktop confirmed gate)', () => {
    expect(() =>
      importRawStream({
        path: 'x.iq',
        dataByteLength: 4000,
        sampleFormat: ci16,
        sampleRateHz: 1e6,
        centerFrequencyHz: 1e8,
        confirmed: false,
      }),
    ).toThrow(/请确认采样结构/);
  });

  it('rejects invalid acquisition bounds like desktop describeRawFile', () => {
    expect(() =>
      importRawStream({
        path: 'x.iq',
        dataByteLength: 4000,
        sampleFormat: ci16,
        sampleRateHz: 0,
        centerFrequencyHz: 1e8,
        confirmed: true,
      }),
    ).toThrow(/采样率、频率、时长或有效带宽无效/);
  });

  it('importRawWithTemplate applies builtin-1 CF32 + header/trailer', () => {
    // header 16 + 10 frames * 8 bytes (cf32) + trailer 8 = 16+80+8 = 104
    const result = importRawWithTemplate({
      path: 'burst.raw',
      dataByteLength: 104,
      sampleRateHz: 2_000_000,
      centerFrequencyHz: 915_000_000,
      templateId: 'builtin-1',
      headerBytes: '16',
      trailerBytes: '8',
      confirmed: true,
      mode: 'replace',
      fileId: 'file-cf32',
    });
    expect(result.row.sampleCount).toBe('10');
    expect(result.row.datatype).toBe('cf32_le');
    expect(result.project.files[0]?.metadata.sampleFormat?.headerBytes).toBe('16');
    expect(result.project.files[0]?.metadata.sampleFormat?.trailerBytes).toBe('8');
    expect(result.row.provenance).toMatch(/template:builtin-1/);
  });

  it('append mode adds a second RAW file without wiping the first', () => {
    const first = importRawStream({
      path: 'a.iq',
      dataByteLength: 4000,
      sampleFormat: ci16,
      sampleRateHz: 1e6,
      centerFrequencyHz: 1e8,
      confirmed: true,
      mode: 'replace',
      fileId: 'file-a',
    });
    const second = importRawStream({
      path: 'b.iq',
      dataByteLength: 8000,
      sampleFormat: ci16,
      sampleRateHz: 1e6,
      centerFrequencyHz: 2e8,
      confirmed: true,
      mode: 'append',
      project: first.project,
      fileId: 'file-b',
    });
    expect(second.project.files).toHaveLength(2);
    expect(second.project.activeFileId).toBe('file-b');
    expect(second.project.files[0]?.metadata.id).toBe('file-a');
    expect(second.project.files[1]?.metadata.sampleCount).toBe('2000');
  });

  it('sampleFormatToDatatypeLabel + validateRawAcquisition helpers', () => {
    expect(sampleFormatToDatatypeLabel(ci16)).toBe('ci16_le');
    expect(
      validateRawAcquisition({
        sampleFormat: ci16,
        sampleRateHz: 1e6,
        centerFrequencyHz: 1e8,
        declaredBandwidthHz: 2e6,
        sampleCount: 1000n,
      }),
    ).toMatch(/无效/);
    expect(
      validateRawAcquisition({
        sampleFormat: ci16,
        sampleRateHz: 1e6,
        centerFrequencyHz: 1e8,
        declaredBandwidthHz: 5e5,
        sampleCount: 1000n,
      }),
    ).toBeUndefined();
  });
});

describe('G19 hook importRawWithTemplate', () => {
  it('commits RAW and exposes tree via getTree', () => {
    const hook = createG19E2eHook();
    const state = hook.importRawWithTemplate({
      path: 'hook.iq',
      dataByteLength: 4000,
      sampleRateHz: 1e6,
      centerFrequencyHz: 1e8,
      templateId: 'builtin-0',
      confirmed: true,
      mode: 'replace',
      fileId: 'file-hook-raw',
    });
    expect(state.fileCount).toBe(1);
    expect(state.sampleCount).toBe('1000');
    expect(state.annotationCount).toBe(0);
    const fileNode = hook.getTree()[0]?.children?.[0]?.children?.[0];
    expect(fileNode?.kind).toBe('file');
    expect(fileNode?.sampleCount).toBe('1000');
    expect(hook.lastResult?.row.format).toBe('raw');
  });
});
