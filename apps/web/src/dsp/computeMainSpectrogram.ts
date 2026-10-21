/**
 * Synthetic two-tone IQ → STFT via DspWorkerClient for the main chart.
 * Labeled synthetic fixture — NOT a real capture / file IQ path.
 */
import type { SpectralWindowName, StftSupportedMethod } from '@wss/contracts';
import {
  DEFAULT_KAISER_BETA,
  segmentMillisecondsFromFft,
  resolveAnalysisSamples,
  webFftSizeFromAnalysisSamples,
} from '@wss/contracts';
import type { DspWorkerClient } from '@wss/dsp-wasm';
import { createDspWorkerClient, InProcessAsyncBackend } from '@wss/dsp-wasm';

export const SYNTHETIC_SOURCE_LABEL = 'synthetic fixture' as const;

/** Defaults used by main STFT when callers omit fft/hop/window. */
export const MAIN_STFT_DEFAULTS = {
  fftSize: 256,
  hopSize: 64,
  window: 'hann' as const,
  method: 'welch' as const satisfies StftSupportedMethod,
  kaiserBeta: DEFAULT_KAISER_BETA,
} as const;

/** Overlap ratio from hop: 1 - hop/fft (clamped to [0, 1)). */
export function overlapFromHop(fftSize: number, hopSize: number): number {
  if (!(fftSize > 0) || !(hopSize > 0)) return 0;
  const o = 1 - hopSize / fftSize;
  if (o < 0) return 0;
  if (o >= 1) return 0.999999;
  return o;
}

export interface MainSpectrogramResult {
  power: Float32Array;
  binCount: number;
  frameCount: number;
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
  sourceLabel: typeof SYNTHETIC_SOURCE_LABEL;
  sampleRateHz: number;
  /** Actual STFT analysis params used (source of truth for SpecParamStrip). */
  fftSize: number;
  hopSize: number;
  window: SpectralWindowName;
  overlap: number;
  /** Always 'welch' — only implemented STFT method. */
  method: StftSupportedMethod;
  /** Derived segment duration ms = fftSize/fs*1000 (desktop segmentMilliseconds). */
  segmentMilliseconds: number;
  /** Kaiser β used when window is kaiser; else null. */
  kaiserBeta: number | null;
  /** Desktop removeMean applied. */
  removeMean: boolean;
  /** True when auto N/B resolved fftSize. */
  autoNb: boolean;
  /**
   * SpectrumStatistic is PSD-only on desktop STFT path — always null here.
   * Strip should show NA / — until a real PSD statistic path exists.
   */
  spectrumStatistic: null;
}

export interface ComputeMainSpectrogramOptions {
  /** Injected client (tests: InProcessAsyncBackend). Default: in-process. */
  client?: DspWorkerClient;
  signal?: AbortSignal;
  fftSize?: number;
  hopSize?: number;
  window?: SpectralWindowName;
  method?: StftSupportedMethod;
  kaiserBeta?: number;
  removeMean?: boolean;
  /**
   * Desktop segmentMilliseconds. Omit → derive from fftSize.
   * Pass 0 for auto N/B (requires bandwidthHz + analysisPoints).
   */
  segmentMilliseconds?: number;
  bandwidthHz?: number;
  analysisPoints?: number;
  sampleRateHz?: number;
  /** Tone frequencies in Hz (baseband). */
  toneHz?: [number, number];
}

/** Interleaved float32 IQ: two complex tones. */
export function synthesizeTwoToneIq(options: {
  sampleCount: number;
  sampleRateHz: number;
  toneHz: [number, number];
  amps?: [number, number];
}): Float32Array {
  const { sampleCount, sampleRateHz, toneHz } = options;
  const amps = options.amps ?? ([1, 0.7] as [number, number]);
  const out = new Float32Array(sampleCount * 2);
  for (let n = 0; n < sampleCount; n++) {
    let i = 0;
    let q = 0;
    for (let t = 0; t < 2; t++) {
      const p = (2 * Math.PI * toneHz[t]! * n) / sampleRateHz;
      const a = amps[t]!;
      i += a * Math.cos(p);
      q += a * Math.sin(p);
    }
    out[n * 2] = i;
    out[n * 2 + 1] = q;
  }
  return out;
}

/** fftshift one STFT frame so bin 0 maps to -fs/2 for chart freq axis. */
export function fftshiftFrame(frame: Float32Array, binCount: number): Float32Array {
  const half = binCount >> 1;
  const out = new Float32Array(binCount);
  out.set(frame.subarray(half), 0);
  out.set(frame.subarray(0, half), half);
  return out;
}

/** Max-normalize linear power to [0, 1] for SpectrumChart levels. */
export function normalizePower01(power: Float32Array): Float32Array {
  let max = 0;
  for (let i = 0; i < power.length; i++) {
    const v = power[i]!;
    if (v > max) max = v;
  }
  const out = new Float32Array(power.length);
  if (max <= 0) return out;
  const inv = 1 / max;
  for (let i = 0; i < power.length; i++) out[i] = power[i]! * inv;
  return out;
}

export async function computeMainSpectrogram(
  options: ComputeMainSpectrogramOptions = {},
): Promise<MainSpectrogramResult> {
  let fftSize = options.fftSize ?? MAIN_STFT_DEFAULTS.fftSize;
  let hopSize = options.hopSize ?? MAIN_STFT_DEFAULTS.hopSize;
  const window: SpectralWindowName = options.window ?? MAIN_STFT_DEFAULTS.window;
  const method: StftSupportedMethod = options.method ?? MAIN_STFT_DEFAULTS.method;
  const kaiserBeta =
    options.kaiserBeta != null && Number.isFinite(options.kaiserBeta)
      ? options.kaiserBeta
      : MAIN_STFT_DEFAULTS.kaiserBeta;
  const removeMean = options.removeMean === true;
  const sampleRateHz = options.sampleRateHz ?? 1_000_000;
  const toneHz = options.toneHz ?? ([150_000, -220_000] as [number, number]);

  let autoNb = false;
  let segmentMilliseconds: number;
  if (options.segmentMilliseconds === 0) {
    if (
      options.bandwidthHz == null ||
      !(options.bandwidthHz > 0) ||
      options.analysisPoints == null
    ) {
      throw new RangeError(
        'computeMainSpectrogram auto N/B requires bandwidthHz and analysisPoints',
      );
    }
    const plan = resolveAnalysisSamples({
      sampleRateHz,
      bandwidthHz: options.bandwidthHz,
      points: options.analysisPoints,
      segmentMilliseconds: 0,
    });
    const resolved = webFftSizeFromAnalysisSamples(plan.analysisSamples);
    const overlap = hopSize > 0 && fftSize > 0 ? 1 - hopSize / fftSize : 0.75;
    fftSize = resolved;
    hopSize = Math.max(1, Math.floor(fftSize * (1 - Math.min(Math.max(overlap, 0), 0.999999))));
    segmentMilliseconds = 0;
    autoNb = true;
  } else if (options.segmentMilliseconds != null && options.segmentMilliseconds > 0) {
    segmentMilliseconds = options.segmentMilliseconds;
  } else {
    segmentMilliseconds = segmentMillisecondsFromFft(fftSize, sampleRateHz);
  }

  const frameTarget = 128;
  const sampleCount = fftSize + (frameTarget - 1) * hopSize;

  const ownClient = !options.client;
  const client =
    options.client ??
    createDspWorkerClient({ backend: new InProcessAsyncBackend() });

  try {
    const iq = synthesizeTwoToneIq({ sampleCount, sampleRateHz, toneHz });
    const stft = await client.analyzeStft(
      {
        begin: 0n,
        end: BigInt(sampleCount),
        fftSize,
        hopSize,
        window,
        sampleRateHz,
        method,
        segmentMilliseconds,
        bandwidthHz: autoNb ? options.bandwidthHz : undefined,
        analysisPoints: autoNb ? options.analysisPoints : undefined,
        kaiserBeta: window === 'kaiser' ? kaiserBeta : undefined,
        removeMean,
      },
      iq,
      options.signal,
    );

    const { binCount, frameCount } = stft;
    const shifted = new Float32Array(frameCount * binCount);
    for (let f = 0; f < frameCount; f++) {
      const row = stft.linearPower.subarray(f * binCount, (f + 1) * binCount);
      shifted.set(fftshiftFrame(row, binCount), f * binCount);
    }
    const power = normalizePower01(shifted);
    const durationSec = ((frameCount - 1) * hopSize + fftSize) / sampleRateHz;

    return {
      power,
      binCount,
      frameCount,
      freqHz: { min: -sampleRateHz / 2, max: sampleRateHz / 2 },
      timeSec: { min: 0, max: durationSec },
      sourceLabel: SYNTHETIC_SOURCE_LABEL,
      sampleRateHz,
      fftSize,
      hopSize,
      window,
      overlap: overlapFromHop(fftSize, hopSize),
      method,
      segmentMilliseconds,
      kaiserBeta: window === 'kaiser' ? kaiserBeta : null,
      removeMean,
      autoNb,
      spectrumStatistic: null,
    };
  } finally {
    if (ownClient) await client.close();
  }
}
