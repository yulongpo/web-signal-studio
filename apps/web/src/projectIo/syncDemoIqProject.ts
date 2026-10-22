/**
 * After demo SigMF opens into the main-chart IQ session, commit the same
 * allowlisted pair into the engineering project document so ProjectTree
 * shows real nodes (not the empty「尚未打开工程」shell).
 *
 * Uses F importSigmfStream (enforceDemoPath) — no invented DSP / tree fakes.
 * matrix_pass_claimed: false
 */
import {
  importSigmfStream,
  summarizeLoadedProject,
  SIGMF_DEMO_META_PATH,
} from '@wss/project-io';
import { useUiStore } from '../store/uiStore';

export type SyncDemoIqProjectInput = {
  metaText: string;
  dataByteLength: number;
  /** Absolute allowlisted path; defaults to SIGMF_DEMO_META_PATH. */
  path?: string;
  displayName?: string;
};

export type SyncDemoIqProjectResult =
  | { ok: true; displayName: string; sampleCount: string; sampleRateHz: number }
  | { ok: false; message: string };

export function syncDemoSigmfIntoUiProject(
  input: SyncDemoIqProjectInput,
): SyncDemoIqProjectResult {
  try {
    if (!input.metaText?.trim()) {
      return { ok: false, message: '演示 IQ 缺少 SigMF meta，无法写入工程树。' };
    }
    if (!Number.isFinite(input.dataByteLength) || input.dataByteLength <= 0) {
      return {
        ok: false,
        message: `演示 IQ 数据长度无效（${String(input.dataByteLength)}），无法写入工程树。`,
      };
    }
    const path = input.path ?? SIGMF_DEMO_META_PATH;
    const existing = useUiStore.getState().projectDocument;
    const result = importSigmfStream({
      metaText: input.metaText,
      dataByteLength: input.dataByteLength,
      path,
      displayName: input.displayName ?? '0000000.sigmf-meta',
      mode: existing ? 'append' : 'replace',
      project: existing ?? undefined,
      enforceDemoPath: true,
    });
    const summary = summarizeLoadedProject({
      document: result.project,
      version: 6,
    });
    const active =
      summary.files.find((f) => f.id === summary.activeFileId) ?? summary.files[0];
    useUiStore.setState({
      projectDocument: result.project,
      projectSummary: summary,
      projectError: null,
      projectSource: 'json',
      projectHasSample: false,
      statusFileLabel: active?.name ?? summary.name,
      statusChannelLabel: active ? `${active.channelCount} ch` : '—',
      detectSampleRange: {
        start: '0',
        end: active?.sampleCount ?? '0',
      },
      detectSampleRangeSource: 'file',
    });
    return {
      ok: true,
      displayName: result.row.displayName,
      sampleCount: result.row.sampleCount,
      sampleRateHz: result.row.sampleRateHz,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    useUiStore.setState({
      projectError: message || '演示 IQ 写入工程树失败',
    });
    return {
      ok: false,
      message: message || '演示 IQ 写入工程树失败',
    };
  }
}
