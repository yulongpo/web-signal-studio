/**
 * Opened IQ ChunkedReader → STFT → main-chart spectrogram (parallel to synthetic fixture).
 */
import type { DspWorkerClient } from '@wss/dsp-wasm';
import type { ChunkedReader } from '@wss/file-io';
import { stftFromChunkedReader } from './stftFromChunkedReader';
import {
  fftshiftFrame,
  normalizePower01,
  MAIN_STFT_DEFAULTS,
  overlapFromHop,
} from './computeMainSpectrogram';

export interface FileSpectrogramResult {
  power: Float32Array;
  binCount: number;
  frameCount: number;
  freqHz: { min: number; max: number };
  timeSec: { min: number; max: number };
  sourceLabel: string;
  sampleRateHz: number;
  samplesRead: bigint;
  /** Actual STFT analysis params used (source of truth for SpecParamStrip). */
  fftSize: number;
  hopSize: number;
  window: typeof MAIN_STFT_DEFAULTS.window;
  overlap: number;
}

export interface ComputeFileSpectrogramOptions {
  reader: ChunkedReader;
  client: DspWorkerClient;
  sampleRateHz: number;
  sourceLabel: string;
  signal?: AbortSignal;
  fftSize?: number;
  hopSize?: number;
  /** Cap samples for first paint (default: enough for ~128 frames). */
  maxSamples?: bigint;
}

export async function computeFileSpectrogram(
  options: ComputeFileSpectrogramOptions,
): Promise<FileSpectrogramResult> {
  const fftSize = options.fftSize ?? MAIN_STFT_DEFAULTS.fftSize;
  const hopSize = options.hopSize ?? MAIN_STFT_DEFAULTS.hopSize;
  const window = MAIN_STFT_DEFAULTS.window;
  const frameTarget = 128;
  const defaultMax = BigInt(fftSize + (frameTarget - 1) * hopSize);
  const maxSamples = options.maxSamples ?? defaultMax;

  const prefix = options.reader.availablePrefix();
  const end =
    prefix.availableSamples < maxSamples ? prefix.availableSamples : maxSamples;

  const { stft, samplesRead, sourceLabel, sampleRateHz } = await stftFromChunkedReader({
    reader: options.reader,
    client: options.client,
    sampleRateHz: options.sampleRateHz,
    sourceLabel: options.sourceLabel,
    begin: 0n,
    end,
    fftSize,
    hopSize,
    window,
    signal: options.signal,
  });

  const { binCount, frameCount } = stft;
  const shifted = new Float32Array(frameCount * binCount);
  for (let f = 0; f < frameCount; f++) {
    const row = stft.linearPower.subarray(f * binCount, (f + 1) * binCount);
    shifted.set(fftshiftFrame(row, binCount), f * binCount);
  }
  const power = normalizePower01(shifted);
  const durationSec =
    frameCount > 0
      ? ((frameCount - 1) * hopSize + fftSize) / sampleRateHz
      : 0;

  return {
    power,
    binCount,
    frameCount,
    freqHz: { min: -sampleRateHz / 2, max: sampleRateHz / 2 },
    timeSec: { min: 0, max: durationSec },
    sourceLabel,
    sampleRateHz,
    samplesRead,
    fftSize,
    hopSize,
    window,
    overlap: overlapFromHop(fftSize, hopSize),
  };
}
