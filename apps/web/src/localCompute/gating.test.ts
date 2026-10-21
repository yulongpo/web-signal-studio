import { describe, expect, it } from 'vitest';
import type {
  LocalComputeDetectionCapabilities,
  LocalComputeRuntimePrecheck,
  LocalComputeTaskRecord,
} from '@wss/contracts';
import {
  bannerTextsFromCapabilities,
  canRunDetect,
  candidatesForDraw,
  gateDisableReason,
  isFfscnEnabled,
  isKnownUiCode,
  isScnEnabled,
  pickUiMessageText,
  shouldDrawDetectionCandidates,
  uiMessagesForBanner,
} from './gating';

const blocked: LocalComputeDetectionCapabilities = {
  ffscn: false,
  scn: false,
  reasons: ['BLOCKED: stub'],
  uiMessages: [
    {
      code: 'STUB_RUNTIME',
      severity: 'error',
      en: 'Local compute is in stub mode (no TensorRT). Detection will not invent results.',
      zh: '本地计算处于占位模式（无 TensorRT），检测不会伪造结果。',
    },
  ],
};

const modelMissing: LocalComputeDetectionCapabilities = {
  ffscn: false,
  scn: false,
  reasons: ['BLOCKED: MODEL_MISSING_FFSCN', 'BLOCKED: MODEL_MISSING_SCN'],
  uiMessages: [
    {
      code: 'MODEL_MISSING_FFSCN',
      severity: 'error',
      en: 'FFSCN model file is missing. Detection cannot run.',
      zh: '缺少 FFSCN 模型文件，无法运行检测。',
    },
    {
      code: 'MODEL_MISSING_SCN',
      severity: 'error',
      en: 'SCN model file is missing. Detection cannot run.',
      zh: '缺少 SCN 模型文件，无法运行检测。',
    },
    {
      code: 'GPU_MISSING',
      severity: 'error',
      en: 'No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable.',
      zh: '未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。',
    },
  ],
};

function makeTask(
  patch: Partial<LocalComputeTaskRecord> & Pick<LocalComputeTaskRecord, 'status'>,
): LocalComputeTaskRecord {
  return {
    runId: 'r1',
    kind: 'ffscn.detect',
    progress: 1,
    request: {},
    result: null,
    evidence: [],
    blockReasons: [],
    uiMessages: [],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...patch,
  };
}

const stubRuntime: LocalComputeRuntimePrecheck = {
  engine: 'STUB_NON_TENSORRT',
  tensorrtVerified: false,
  cudaVerified: false,
  canInventResults: false,
  modelSearchRoots: [],
  ffscnPresent: false,
  scnPresent: false,
  ffscnReady: false,
  scnReady: false,
};

describe('detection gating', () => {
  it('prefers zh banner text', () => {
    expect(pickUiMessageText(blocked.uiMessages[0]!, 'zh')).toContain('占位模式');
    expect(bannerTextsFromCapabilities(blocked, 'zh')[0]).toContain('占位模式');
  });

  it('gates buttons on ffscn/scn booleans and online/auth', () => {
    expect(isFfscnEnabled(blocked)).toBe(false);
    expect(isScnEnabled(blocked)).toBe(false);
    expect(canRunDetect(blocked, 'ffscn', true, true)).toBe(false);
    expect(canRunDetect({ ...blocked, ffscn: true }, 'ffscn', true, true)).toBe(true);
    expect(canRunDetect({ ...blocked, ffscn: true }, 'ffscn', false, true)).toBe(false);
    expect(canRunDetect({ ...blocked, ffscn: true }, 'ffscn', true, false)).toBe(false);
  });

  it('exposes MODEL_MISSING_* / GPU_MISSING gate reasons with code chips', () => {
    const ff = gateDisableReason(modelMissing, 'ffscn', true, true, 'zh');
    expect(ff?.code).toBe('MODEL_MISSING_FFSCN');
    expect(ff?.text).toContain('缺少 FFSCN');
    const scn = gateDisableReason(modelMissing, 'scn', true, true, 'zh');
    expect(scn?.code).toBe('MODEL_MISSING_SCN');
    expect(isKnownUiCode('GPU_MISSING')).toBe(true);
    expect(isKnownUiCode('MODEL_MISSING_FFSCN')).toBe(true);
  });

  it('renders unknown SOURCE_MISSING from server uiMessages without inventing copy', () => {
    const withSource: LocalComputeDetectionCapabilities = {
      ffscn: true,
      scn: true,
      reasons: [],
      uiMessages: [
        {
          code: 'SOURCE_MISSING',
          severity: 'error',
          en: 'sourcePath is required for real detection; refusing to invent candidates.',
          zh: '真检测需要 sourcePath，拒绝伪造候选结果。',
        },
      ],
    };
    const msgs = uiMessagesForBanner(withSource);
    expect(msgs[0]?.code).toBe('SOURCE_MISSING');
    expect(pickUiMessageText(msgs[0]!, 'zh')).toContain('sourcePath');
    // Known via extended set for chip styling; copy still comes from server.
    expect(isKnownUiCode('SOURCE_MISSING')).toBe(true);
  });

  it('BLOCKED task with null/fake result never draws candidates', () => {
    const blockedTask = makeTask({
      status: 'BLOCKED',
      result: {
        candidates: [{ score: 0.99, box: [0, 0, 1, 1] }],
        boxes: [[0, 0, 1, 1]],
        detections: [{ id: 'fake' }],
      },
      uiMessages: [
        {
          code: 'SOURCE_MISSING',
          severity: 'error',
          en: 'sourcePath is required',
          zh: '真检测需要 sourcePath，拒绝伪造候选结果。',
        },
      ],
      messageZh: '真检测需要 sourcePath，拒绝伪造候选结果。',
      blockReasons: ['BLOCKED: SOURCE_MISSING'],
    });
    expect(shouldDrawDetectionCandidates(blockedTask, stubRuntime)).toBe(false);
    expect(candidatesForDraw(blockedTask, stubRuntime)).toEqual([]);
    expect(uiMessagesForBanner(null, blockedTask)[0]?.code).toBe('SOURCE_MISSING');
  });

  it('draws only when succeeded + verifiedForward + PYTORCH_* engine', () => {
    const ok = makeTask({
      status: 'succeeded',
      result: {
        verifiedForward: true,
        engine: 'PYTORCH_CUDA',
        candidates: [{ score: 0.8 }],
      },
    });
    expect(shouldDrawDetectionCandidates(ok, stubRuntime)).toBe(true);
    expect(candidatesForDraw(ok, stubRuntime)).toHaveLength(1);

    const stubOkStatus = makeTask({
      status: 'succeeded',
      result: {
        candidates: [{ score: 0.9 }],
        engine: 'STUB_NON_TENSORRT',
      },
    });
    expect(shouldDrawDetectionCandidates(stubOkStatus, stubRuntime)).toBe(false);
    expect(candidatesForDraw(stubOkStatus, stubRuntime)).toEqual([]);

    const noRuntime = makeTask({
      status: 'succeeded',
      result: { candidates: [{ score: 1 }] },
    });
    expect(shouldDrawDetectionCandidates(noRuntime, null)).toBe(false);
  });
});
