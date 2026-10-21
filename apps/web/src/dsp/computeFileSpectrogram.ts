/**
 * Opened IQ ChunkedReader → STFT → main-chart spectrogram (parallel to synthetic fixture).
 */
import type { SpectralWindowName, StftSupportedMethod } from '@wss/contracts';
import {
  DEFAULT_KAISER_BETA,
  segmentMillisecondsFromFft,
  resolveAnalysisSamples,
  webFftSizeFromAnalysisSamples,
} from '@wss/contracts';
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
  window: SpectralWindowName;
  overlap: number;
  method: StftSupportedMethod;
  segmentMilliseconds: number;
  kaiserBeta: number | null;
  removeMean: boolean;
  autoNb: boolean;
  spectrumStatistic: null;
}

export interface ComputeFileSpectrogramOptions {
  reader: ChunkedReader;
  client: DspWorkerClient;
  sampleRateHz: number;
  sourceLabel: string;
  signal?: AbortSignal;
  fftSize?: number;
  hopSize?: number;
  window?: SpectralWindowName;
  method?: StftSupportedMethod;
  kaiserBeta?: number;
  removeMean?: boolean;
  segmentMilliseconds?: number;
  bandwidthHz?: number;
  analysisPoints?: number;
  /** Cap samples for first paint (default: enough for ~128 frames). */
  maxSamples?: bigint;
}

export async function computeFileSpectrogram(
  options: ComputeFileSpectrogramOptions,
): Promise<FileSpectrogramResult> {
  let fftSize = options.fftSize ?? MAIN_STFT_DEFAULTS.fftSize;
  let hopSize = options.hopSize ?? MAIN_STFT_DEFAULTS.hopSize;
  const window: SpectralWindowName = options.window ?? MAIN_STFT_DEFAULTS.window;
  const method: StftSupportedMethod = options.method ?? MAIN_STFT_DEFAULTS.method;
  const kaiserBeta =
    options.kaiserBeta != null && Number.isFinite(options.kaiserBeta)
      ? options.kaiserBeta
      : DEFAULT_KAISER_BETA;
  const removeMean = options.removeMean === true;

  let autoNb = false;
  let segmentMilliseconds: number;
  if (options.segmentMilliseconds === 0) {
    if (
      options.bandwidthHz == null ||
      !(options.bandwidthHz > 0) ||
      options.analysisPoints == null
    ) {
      throw new RangeError(
        'computeFileSpectrogram auto N/B requires bandwidthHz and analysisPoints',
      );
    }
    const plan = resolveAnalysisSamples({
      sampleRateHz: options.sampleRateHz,
      bandwidthHz: options.bandwidthHz,
      points: options.analysisPoints,
      segmentMilliseconds: 0,
    });
    const resolved = webFftSizeFromAnalysisSamples(plan.analysisSamples);
    const overlap = hopSize > 0 && fftSize > 0 ? 1 - hopSize / fftSize : 0.75;
    fftSize = resolved;
    hopSize = Math.max(
      1,
      Math.floor(fftSize * (1 - Math.min(Math.max(overlap, 0), 0.999999))),
    );
    segmentMilliseconds = 0;
    autoNb = true;
  } else if (options.segmentMilliseconds != null && options.segmentMilliseconds > 0) {
    segmentMilliseconds = options.segmentMilliseconds;
  } else {
    segmentMilliseconds = segmentMillisecondsFromFft(fftSize, options.sampleRateHz);
  }

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
    method,
    kaiserBeta,
    removeMean,
    segmentMilliseconds,
    bandwidthHz: autoNb ? options.bandwidthHz : undefined,
    analysisPoints: autoNb ? options.analysisPoints : undefined,
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
    method,
    segmentMilliseconds,
    kaiserBeta: window === 'kaiser' ? kaiserBeta : null,
    removeMean,
    autoNb,
    spectrumStatistic: null,
  };
}
