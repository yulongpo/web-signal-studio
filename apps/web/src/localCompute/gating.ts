/**
 * PROVISIONAL — Bot-B detection button gating helpers (pure).
 * Gate on server capabilities only; never invent FFSCN/SCN candidates client-side.
 */

import type { LocalComputeDetectionCapabilities, LocalComputeUiMessage } from '@wss/contracts';

export type DetectLocale = 'zh' | 'en';

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
