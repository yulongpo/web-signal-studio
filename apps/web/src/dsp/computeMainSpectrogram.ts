/**
 * Synthetic two-tone IQ → STFT via DspWorkerClient for the main chart.
 * Labeled synthetic fixture — NOT a real capture / file IQ path.
 */
import type { DspWorkerClient } from '@wss/dsp-wasm';
import { createDspWorkerClient, InProcessAsyncBackend } from '@wss/dsp-wasm';

export const SYNTHETIC_SOURCE_LABEL = 'synthetic fixture' as const;

export interface MainSpectrogramResult {
  power: Float32Array;
  binCount: number;
  frameCount: number;
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
  sourceLabel: typeof SYNTHETIC_SOURCE_LABEL;
  sampleRateHz: number;
}

export interface ComputeMainSpectrogramOptions {
  /** Injected client (tests: InProcessAsyncBackend). Default: in-process. */
  client?: DspWorkerClient;
  signal?: AbortSignal;
  fftSize?: number;
  hopSize?: number;
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
  const fftSize = options.fftSize ?? 256;
  const hopSize = options.hopSize ?? 64;
  const sampleRateHz = options.sampleRateHz ?? 1_000_000;
  const toneHz = options.toneHz ?? ([150_000, -220_000] as [number, number]);
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
        window: 'hann',
        sampleRateHz,
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
    };
  } finally {
    if (ownClient) await client.close();
  }
}
