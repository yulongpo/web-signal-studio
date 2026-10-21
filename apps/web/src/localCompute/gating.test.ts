import { describe, expect, it } from 'vitest';
import type { LocalComputeDetectionCapabilities } from '@wss/contracts';
import {
  bannerTextsFromCapabilities,
  canRunDetect,
  isFfscnEnabled,
  isScnEnabled,
  pickUiMessageText,
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
});
