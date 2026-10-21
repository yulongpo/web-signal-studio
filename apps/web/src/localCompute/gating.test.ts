import { describe, expect, it } from 'vitest';
import type {
  LocalComputeDetectionCapabilities,
  LocalComputeRuntimePrecheck,
  LocalComputeTaskRecord,
} from '@wss/contracts';
import {
  LOCAL_COMPUTE_STUB_RUNTIME_COPY,
  LOCAL_COMPUTE_STUB_ENGINE,
  LOCAL_COMPUTE_UI_CODES,
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
  iqSourceGateReason,
  canRunDetectWithSource,
} from './gating';

/** STUB fixture MUST use contracts copy — no duplicated en/zh literals. */
const blocked: LocalComputeDetectionCapabilities = {
  ffscn: false,
  scn: false,
  reasons: ['BLOCKED: stub'],
  uiMessages: [
    {
      code: LOCAL_COMPUTE_STUB_RUNTIME_COPY.code,
      severity: LOCAL_COMPUTE_STUB_RUNTIME_COPY.severity,
      en: LOCAL_COMPUTE_STUB_RUNTIME_COPY.en,
      zh: LOCAL_COMPUTE_STUB_RUNTIME_COPY.zh,
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
  engine: LOCAL_COMPUTE_STUB_ENGINE,
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
  it('prefers zh banner text from LOCAL_COMPUTE_STUB_RUNTIME_COPY', () => {
    expect(blocked.uiMessages[0]!.en).toBe(LOCAL_COMPUTE_STUB_RUNTIME_COPY.en);
    expect(blocked.uiMessages[0]!.zh).toBe(LOCAL_COMPUTE_STUB_RUNTIME_COPY.zh);
    expect(blocked.uiMessages[0]!.severity).toBe(LOCAL_COMPUTE_STUB_RUNTIME_COPY.severity);
    expect(blocked.uiMessages[0]!.code).toBe(LOCAL_COMPUTE_STUB_RUNTIME_COPY.code);
    expect(pickUiMessageText(blocked.uiMessages[0]!, 'zh')).toBe(
      LOCAL_COMPUTE_STUB_RUNTIME_COPY.zh,
    );
    expect(bannerTextsFromCapabilities(blocked, 'zh')[0]).toBe(
      LOCAL_COMPUTE_STUB_RUNTIME_COPY.zh,
    );
    expect(pickUiMessageText(blocked.uiMessages[0]!, 'en')).toBe(
      LOCAL_COMPUTE_STUB_RUNTIME_COPY.en,
    );
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
    expect(LOCAL_COMPUTE_UI_CODES).toContain('SOURCE_MISSING');
    expect(LOCAL_COMPUTE_UI_CODES).toContain('TORCH_MISSING');
    expect(isKnownUiCode('SOURCE_MISSING')).toBe(true);
  });

  it('renders SOURCE_MISSING from server uiMessages without inventing copy', () => {
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
    expect(pickUiMessageText(msgs[0]!, 'zh')).toBe(withSource.uiMessages[0]!.zh);
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

  it('renders WEIGHT_HASH_MISMATCH from server uiMessages (alias of MODEL_HASH_MISMATCH)', () => {
    const weightHash: LocalComputeDetectionCapabilities = {
      ffscn: false,
      scn: false,
      reasons: ['BLOCKED: WEIGHT_HASH_MISMATCH for ffscn'],
      uiMessages: [
        {
          code: 'MODEL_HASH_MISMATCH',
          severity: 'error',
          en: "Detection model hash/version does not match the configured expectation.",
          zh: "检测模型哈希/版本与配置期望不一致。",
        },
        {
          code: 'WEIGHT_HASH_MISMATCH',
          severity: 'error',
          en: "Detection model hash/version does not match the configured expectation.",
          zh: "检测模型哈希/版本与配置期望不一致。",
        },
      ],
    };
    expect(LOCAL_COMPUTE_UI_CODES).toContain('WEIGHT_HASH_MISMATCH');
    expect(isKnownUiCode('WEIGHT_HASH_MISMATCH')).toBe(true);
    const msgs = uiMessagesForBanner(weightHash);
    expect(msgs.map((m) => m.code)).toEqual(['MODEL_HASH_MISMATCH', 'WEIGHT_HASH_MISMATCH']);
    expect(pickUiMessageText(msgs[1]!, 'en')).toBe("Detection model hash/version does not match the configured expectation.");
    expect(pickUiMessageText(msgs[1]!, 'zh')).toBe("检测模型哈希/版本与配置期望不一致。");
    const gate = gateDisableReason(weightHash, 'ffscn', true, true, 'zh');
    // Prefer MODEL_HASH_MISMATCH (listed before WEIGHT alias) when both present.
    expect(gate?.code).toBe('MODEL_HASH_MISMATCH');
    expect(gate?.text).toBe("检测模型哈希/版本与配置期望不一致。");
    expect(shouldDrawDetectionCandidates(
      makeTask({
        status: 'BLOCKED',
        result: { candidates: [{ score: 1 }] },
        uiMessages: weightHash.uiMessages,
      }),
      stubRuntime,
    )).toBe(false);
    expect(candidatesForDraw(
      makeTask({
        status: 'BLOCKED',
        result: { candidates: [{ score: 1 }] },
        uiMessages: weightHash.uiMessages,
      }),
      stubRuntime,
    )).toEqual([]);
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
        engine: LOCAL_COMPUTE_STUB_ENGINE,
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

describe('IQ source session gate', () => {
  it('iqSourceGateReason returns SOURCE_MISSING when no IQ', () => {
    const r = iqSourceGateReason(false, 'zh');
    expect(r?.code).toBe('SOURCE_MISSING');
    expect(r?.text).toMatch(/sourcePath/);
  });

  it('iqSourceGateReason is null when IQ present', () => {
    expect(iqSourceGateReason(true)).toBeNull();
  });

  it('canRunDetectWithSource requires IQ even when caps allow', () => {
    const detection = {
      ffscn: true,
      scn: true,
      reasons: [],
      uiMessages: [],
    };
    expect(canRunDetectWithSource(detection, 'ffscn', true, true, false)).toBe(false);
    expect(canRunDetectWithSource(detection, 'ffscn', true, true, true)).toBe(true);
  });
});
