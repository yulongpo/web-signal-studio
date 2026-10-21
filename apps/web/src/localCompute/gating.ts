/**
 * PROVISIONAL — Bot-B detection button gating + result draw policy (pure).
 * Gate on server capabilities only; never invent FFSCN/SCN candidates client-side.
 * Align with DETECTION_PAGE_CONTRACT.md + REAL_MODEL_INTEGRATION.md.
 */

import {
  LOCAL_COMPUTE_UI_CODES,
  type LocalComputeDetectionCapabilities,
  type LocalComputeRuntimePrecheck,
  type LocalComputeTaskRecord,
  type LocalComputeUiMessage,
} from '@wss/contracts';

export type DetectLocale = 'zh' | 'en';

/** Codes documented in contracts LOCAL_COMPUTE_UI_CODES (tip may lag server). */
export const KNOWN_UI_CODES: ReadonlySet<string> = new Set(LOCAL_COMPUTE_UI_CODES);

/**
 * Extra stable codes emitted by Bot-E (capabilities.py / REAL_MODEL_INTEGRATION)
 * that may not yet be listed in packages/contracts LOCAL_COMPUTE_UI_CODES.
 * Used only for chip styling / recognition — never invent copy for unknown codes.
 */
export const EXTENDED_UI_CODES: ReadonlySet<string> = new Set([
  ...LOCAL_COMPUTE_UI_CODES,
  'SOURCE_MISSING',
  'TORCH_MISSING',
  'TORCH_CPU_ONLY',
  'TORCH_CUDA_OK',
  'MODEL_HOME_MISSING',
  'MODEL_LOAD_FAILED',
  'INFERENCE_FAILED',
  'REAL_RUNTIME',
]);

export function isKnownUiCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return EXTENDED_UI_CODES.has(code) || KNOWN_UI_CODES.has(code);
}

export function pickUiMessageText(
  msg: LocalComputeUiMessage,
  locale: DetectLocale = 'zh',
): string {
  if (locale === 'zh' && msg.zh?.trim()) return msg.zh;
  if (msg.en?.trim()) return msg.en;
  return msg.zh || msg.en || msg.code;
}

export function bannerTextsFromCapabilities(
  detection: LocalComputeDetectionCapabilities | null | undefined,
  locale: DetectLocale = 'zh',
): string[] {
  if (!detection) return [];
  if (detection.uiMessages?.length) {
    return detection.uiMessages.map((m) => pickUiMessageText(m, locale));
  }
  return detection.reasons ?? [];
}

/** Prefer uiMessages (with codes); fall back to reasons. Never invent copy. */
export function uiMessagesForBanner(
  detection: LocalComputeDetectionCapabilities | null | undefined,
  task?: LocalComputeTaskRecord | null,
): LocalComputeUiMessage[] {
  if (task?.status === 'BLOCKED' && task.uiMessages?.length) {
    return task.uiMessages;
  }
  if (detection?.uiMessages?.length) return detection.uiMessages;
  return [];
}

export function isFfscnEnabled(
  detection: LocalComputeDetectionCapabilities | null | undefined,
): boolean {
  return detection?.ffscn === true;
}

export function isScnEnabled(
  detection: LocalComputeDetectionCapabilities | null | undefined,
): boolean {
  return detection?.scn === true;
}

export function canRunDetect(
  detection: LocalComputeDetectionCapabilities | null | undefined,
  kind: 'ffscn' | 'scn',
  online: boolean,
  authorized: boolean,
): boolean {
  if (!online || !authorized || !detection) return false;
  return kind === 'ffscn' ? isFfscnEnabled(detection) : isScnEnabled(detection);
}

export interface GateDisableReason {
  /** Stable code chip when available (server message preferred). */
  code: string | null;
  /** zh (or en) human text — from server uiMessages when possible. */
  text: string;
}

/**
 * Clear reason when FFSCN/SCN button is disabled.
 * Prefers matching MODEL_MISSING_* / family uiMessage from server; does not invent SOURCE_MISSING copy.
 */
export function gateDisableReason(
  detection: LocalComputeDetectionCapabilities | null | undefined,
  kind: 'ffscn' | 'scn',
  online: boolean,
  authorized: boolean,
  locale: DetectLocale = 'zh',
): GateDisableReason | null {
  if (canRunDetect(detection, kind, online, authorized)) return null;
  if (!online) {
    return { code: null, text: locale === 'zh' ? '本地计算服务不可达（offline）。' : 'Local compute unreachable (offline).' };
  }
  if (!authorized) {
    return { code: null, text: locale === 'zh' ? '鉴权失败（401）。' : 'Unauthorized (401).' };
  }
  if (!detection) {
    return { code: null, text: locale === 'zh' ? '尚未取得 capabilities。' : 'Capabilities not loaded.' };
  }

  const preferCodes =
    kind === 'ffscn'
      ? ['MODEL_MISSING_FFSCN', 'MODEL_PATH_MISSING', 'MODEL_HASH_MISMATCH', 'MODEL_LOAD_FAILED', 'STUB_RUNTIME', 'NO_FAKE_INFERENCE', 'GPU_MISSING', 'TORCH_MISSING']
      : ['MODEL_MISSING_SCN', 'MODEL_PATH_MISSING', 'MODEL_HASH_MISMATCH', 'MODEL_LOAD_FAILED', 'STUB_RUNTIME', 'NO_FAKE_INFERENCE', 'GPU_MISSING', 'TORCH_MISSING'];

  const msgs = detection.uiMessages ?? [];
  for (const code of preferCodes) {
    const hit = msgs.find((m) => m.code === code);
    if (hit) {
      return { code: hit.code, text: pickUiMessageText(hit, locale) };
    }
  }
  if (msgs[0]) {
    return { code: msgs[0].code, text: pickUiMessageText(msgs[0], locale) };
  }
  const reason = detection.reasons?.[0];
  return {
    code: null,
    text:
      reason ??
      (locale === 'zh'
        ? kind === 'ffscn'
          ? 'FFSCN 不可用（detection.ffscn !== true）。'
          : 'SCN 不可用（detection.scn !== true）。'
        : kind === 'ffscn'
          ? 'FFSCN unavailable (detection.ffscn !== true).'
          : 'SCN unavailable (detection.scn !== true).'),
  };
}

function isPytorchEngine(engine: unknown): boolean {
  return typeof engine === 'string' && engine.startsWith('PYTORCH_');
}

/**
 * Draw candidates only when the task succeeded with a verified real forward.
 * - BLOCKED / null result → never draw (ignore unexpected keys).
 * - Require result.verifiedForward === true and engine PYTORCH_*.
 * - If runtime.canInventResults === false or missing, still allow verifiedForward path
 *   (canInventResults means "do not invent"; verified results are not invented).
 * - Without verifiedForward, refuse when canInventResults is false/missing.
 */
export function shouldDrawDetectionCandidates(
  task: LocalComputeTaskRecord | null | undefined,
  runtime?: LocalComputeRuntimePrecheck | null,
): boolean {
  if (!task) return false;
  if (task.status === 'BLOCKED') return false;
  if (task.status !== 'succeeded') return false;
  const result = task.result;
  if (result == null || typeof result !== 'object') return false;

  const verified = result.verifiedForward === true;
  const engineOk = isPytorchEngine(result.engine);

  if (verified && engineOk) return true;

  // Refuse inventing / drawing unverified payloads.
  if (runtime == null || runtime.canInventResults !== true) return false;
  return false;
}

/** Safe candidate list for UI — empty unless shouldDraw. Never fabricate. */
export function candidatesForDraw(
  task: LocalComputeTaskRecord | null | undefined,
  runtime?: LocalComputeRuntimePrecheck | null,
): unknown[] {
  if (!shouldDrawDetectionCandidates(task, runtime)) return [];
  const raw = task?.result?.candidates;
  return Array.isArray(raw) ? raw : [];
}
