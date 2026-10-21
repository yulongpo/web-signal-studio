import { existsSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { openSigmfArrayBuffer } from '@wss/file-io';
import {
  SIGMF_DEMO_DATA_PATH,
  SIGMF_DEMO_JSON_PATH,
  SIGMF_DEMO_META_PATH,
  assertAllowedDemoIqPath,
  isAllowedDemoIqPath,
  listAllowedDemoIqPaths,
} from './demo-iq-paths.js';
import { createG19E2eHook, installG19E2eHook, WSS_G19_HOOK_KEY } from './g19-e2e-hook.js';
import { importSigmfStream } from './import-sigmf-stream.js';
import { openProjectFromJsonText } from './project-session.js';

const demoPresent =
  existsSync(SIGMF_DEMO_META_PATH) &&
  existsSync(SIGMF_DEMO_DATA_PATH) &&
  existsSync(SIGMF_DEMO_JSON_PATH);

describe('G19 demo IQ path allowlist', () => {
  it('lists exactly the three allowlisted demo files', () => {
    const paths = listAllowedDemoIqPaths();
    expect(paths).toHaveLength(3);
    expect(paths.every(isAllowedDemoIqPath)).toBe(true);
    expect(isAllowedDemoIqPath('D:\\evil\\capture.sigmf-meta')).toBe(false);
    expect(() => assertAllowedDemoIqPath('C:\\temp\\x.sigmf-meta')).toThrow(/not allowed/);
  });
});

describe.runIf(demoPresent)('G19–G20 SigMF demo import stream (HH-laptop demo)', () => {
  it('imports 0000000.sigmf-* + companion json into project tree/session', () => {
    const metaText = readFileSync(SIGMF_DEMO_META_PATH, 'utf8');
    const dataLen = statSync(SIGMF_DEMO_DATA_PATH).size;
    const companionJsonText = readFileSync(SIGMF_DEMO_JSON_PATH, 'utf8');

    const result = importSigmfStream({
      metaText,
      dataByteLength: dataLen,
      companionJsonText,
      path: SIGMF_DEMO_META_PATH,
      displayName: '0000000.sigmf-meta',
      mode: 'replace',
      fileId: 'file-demo-0000000',
      enforceDemoPath: true,
    });

    expect(result.row.status).toBe('Ready');
    expect(result.row.datatype).toBe('cf32_le');
    expect(result.row.sampleRateHz).toBe(20_000_000);
    expect(result.row.centerFrequencyHz).toBe(2_500_000_000);
    expect(result.row.sampleCount).toBe('400000');
    expect(typeof result.row.sampleCount).toBe('string');
    expect(result.companionSchema).toBe('rfbench-v1');

    expect(result.project.files).toHaveLength(1);
    expect(result.project.activeFileId).toBe('file-demo-0000000');
    expect(result.project.files[0]?.metadata.sampleCount).toBe('400000');
    expect(result.project.files[0]?.metadata.path).toBe(SIGMF_DEMO_META_PATH);

    const tree = result.tree;
    expect(tree[0]?.kind).toBe('project');
    const iqFolder = tree[0]?.children?.[0];
    expect(iqFolder?.label).toBe('IQ Files');
    expect(iqFolder?.children?.[0]?.kind).toBe('file');
    expect(iqFolder?.children?.[0]?.sampleCount).toBe('400000');

    expect(result.annotations.annotations.length).toBeGreaterThanOrEqual(4);
    expect(result.annotations.annotations[0]?.sourceKind).toBe('ImportedLabel');
    expect(typeof result.annotations.annotations[0]?.start).toBe('string');

    const opened = openProjectFromJsonText(
      JSON.stringify(result.project),
    );
    expect(opened.document.files[0]?.metadata.sampleCount).toBe('400000');
  });

  it('openSigmfArrayBuffer reads demo data for charting (file-io path)', () => {
    const metaText = readFileSync(SIGMF_DEMO_META_PATH, 'utf8');
    const data = readFileSync(SIGMF_DEMO_DATA_PATH);
    const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    const handle = openSigmfArrayBuffer({
      id: 'demo-0000000',
      meta: metaText,
      data: ab,
      label: 'sigmf_data_demo allowlist (not synthetic capture claim)',
      dataPathStub: SIGMF_DEMO_DATA_PATH,
    });
    expect(handle.meta.datatype).toBe('cf32_le');
    expect(handle.meta.sampleRateHz).toBe(20_000_000);
    expect(handle.reader.availablePrefix().totalSamples).toBe(400000n);
  });

  it('G19 e2e hook importSigmf + install on window-like target', () => {
    const hook = createG19E2eHook();
    const metaText = readFileSync(SIGMF_DEMO_META_PATH, 'utf8');
    const dataLen = statSync(SIGMF_DEMO_DATA_PATH).size;
    const companionJsonText = readFileSync(SIGMF_DEMO_JSON_PATH, 'utf8');
    const state = hook.importSigmf({
      metaText,
      dataByteLength: dataLen,
      companionJsonText,
      path: SIGMF_DEMO_META_PATH,
      fileId: 'file-hook-demo',
      mode: 'replace',
    });
    expect(state.fileCount).toBe(1);
    expect(state.sampleCount).toBe('400000');
    expect(state.annotationCount).toBeGreaterThanOrEqual(4);
    expect(state.sourceGroupLabels).toEqual(['ImportedLabel', 'Manual', 'Algorithm']);
    expect(state.markNodeCount).toBeGreaterThanOrEqual(4);
    const fileNode = hook.getTree()[0]?.children?.[0]?.children?.[0];
    expect(fileNode?.kind).toBe('file');
    expect(fileNode?.detail ?? '').toMatch(/400000 samples/);
    expect(fileNode?.children?.some((c) => c.kind === 'marks')).toBe(true);

    const target: Record<string, unknown> = {};
    installG19E2eHook(target as { [typeof WSS_G19_HOOK_KEY]?: ReturnType<typeof createG19E2eHook> });
    expect(target[WSS_G19_HOOK_KEY]).toBeDefined();
  });
});

describe.runIf(!demoPresent)('G19 demo missing (skip on non-HH machines)', () => {
  it('records skip — demo path not present', () => {
    expect(demoPresent).toBe(false);
  });
});
