/**
 * Resolve optional DSP Worker FFT engine for Bot-B.
 * Default remains "js". Opt-in via ?engine=wasm-fft or uiStore preference.
 * See docs/implementation/bot-d/WASM_FFT_WIRING_FOR_BOT_B.md.
 */
import type { DspFftEngineKind } from '@wss/dsp-wasm';

export type DspFftEnginePreference = DspFftEngineKind;

/** Read URL query when available (browser). Safe in jsdom / SSR. */
export function readEngineQueryParam(
  search?: string | null,
): DspFftEngineKind | null {
  try {
    const raw =
      search ??
      (typeof window !== 'undefined' ? window.location.search : '');
    if (!raw) return null;
    const q = new URLSearchParams(
      raw.startsWith('?') ? raw.slice(1) : raw,
    ).get('engine');
    if (q === 'wasm-fft') return 'wasm-fft';
    if (q === 'js') return 'js';
    return null;
  } catch {
    return null;
  }
}

/**
 * Prefer URL ?engine= over store preference. Anything else → 'js'.
 */
export function resolveDspFftEngine(
  preference: DspFftEnginePreference | null | undefined = 'js',
  search?: string | null,
): DspFftEngineKind {
  const fromQuery = readEngineQueryParam(search);
  if (fromQuery) return fromQuery;
  if (preference === 'wasm-fft') return 'wasm-fft';
  return 'js';
}
