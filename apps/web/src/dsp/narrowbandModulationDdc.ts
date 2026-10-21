/**
 * G06 modulation page DSP feed (Bot-D): sigmf_data_demo → Worker DDC → constellation + STFT.
 * Eye diagram stays BLOCKED (see narrowbandPageDspContracts).
 * Does not claim modulation classification.
 */
import type { DspWorkerClient } from '@wss/dsp-wasm';
import { ensureDemoSigmfReader } from './auxWaveRawIq';
import { ddcFromChunkedReader } from './ddcFromChunkedReader';
import { fftshiftFrame, normalizePower01 } from './computeMainSpectrogram';
import {
  constellationFromIq,
  type ConstellationPoint,
} from './constellationFromIq';
import {
  deriveDecimation,
  deriveLoOffsetHz,
  deriveSampleWindow,
  NB_OBSERVE_MAX_INPUT_SAMPLES,
} from './narrowbandObserveDdc';
import {
  computeNarrowbandEyeDiagram,
  type NarrowbandEyeDiagramResult,
} from './narrowbandPageDspContracts';

export type NarrowbandModulationDdcOptions = {
  client: DspWorkerClient;
  loOffsetHz?: number;
  interpolation?: number;
  decimation?: number;
  stftFftSize?: number;
  maxConstellationPoints?: number;
  maxInputSamples?: number;
  demoDir?: string | null;
  signal?: AbortSignal;
  annotationIndex?: number;
};

export type NarrowbandModulationDdcResult = {
  sourceLabel: string;
  pipelineLabel: string;
  loOffsetHz: number;
  interpolation: number;
  decimation: number;
  outputSampleRateHz: number;
  samplesRead: bigint;
  sampleBegin: bigint;
  sampleEnd: bigint;
  annotationLabel?: string;
  constellation: ConstellationPoint[];
  /** BLOCKED eye — always status BLOCKED until timing sync lands. */
  eye: NarrowbandEyeDiagramResult;
  stft: {
    power: Float32Array;
    binCount: number;
    frameCount: number;
    freqHz: { min: number; max: number };
    timeSec: { min: number; max: number };
  };
};

/**
 * Open demo SigMF → DDC → constellation points + baseband STFT for modulation page.
 */
export async function computeNarrowbandModulationDdc(
  options: NarrowbandModulationDdcOptions,
): Promise<NarrowbandModulationDdcResult> {
  const handle = await ensureDemoSigmfReader({
    demoDir: options.demoDir,
    signal: options.signal,
  });
  const anns = handle.annotations;
  const annIdx = Math.max(
    0,
    Math.min(anns.length - 1, options.annotationIndex ?? 0),
  );
  const ann = anns.length ? anns[annIdx]! : null;
  const loOffsetHz = options.loOffsetHz ?? deriveLoOffsetHz(handle, ann);
  const interpolation = options.interpolation ?? 1;
  const decimation = options.decimation ?? deriveDecimation(handle, ann);
  const maxInputSamples =
    options.maxInputSamples ?? NB_OBSERVE_MAX_INPUT_SAMPLES;
  const { begin, end } = deriveSampleWindow(handle, ann, maxInputSamples);
  const stftFftSize = options.stftFftSize ?? 256;
  const hopSize = Math.max(1, Math.floor(stftFftSize / 4));

  const result = await ddcFromChunkedReader({
    reader: handle.reader,
    client: options.client,
    sampleRateHz: handle.sampleRateHz,
    loOffsetHz,
    interpolation,
    decimation,
    begin,
    end,
    sourceLabel: handle.sourceLabel,
    signal: options.signal,
    basebandStft: {
      fftSize: Math.min(stftFftSize, 2048),
      hopSize,
      window: 'hann',
    },
  });

  const nOut = Number(result.ddc.end - result.ddc.begin);
  const durationSec =
    nOut > 0 ? nOut / result.outputSampleRateHz : 0;

  // Skip a short FIR transient (~decimation taps heuristic) before scatter.
  const skipSamples = Math.min(
    Math.floor(nOut / 8),
    Math.max(0, decimation * 4),
  );
  const constellation = constellationFromIq(result.ddc.samples, {
    maxPoints: options.maxConstellationPoints ?? 2048,
    skipSamples,
  });

  const eye = computeNarrowbandEyeDiagram({
    tuning: {
      loOffsetHz,
      interpolation,
      decimation,
      sampleBegin: begin,
      sampleEnd: begin + result.samplesRead,
    },
    source: { sourceLabel: handle.sourceLabel, kind: 'sigmf_data_demo' },
  });

  let stftPower = new Float32Array(0);
  let binCount = 0;
  let frameCount = 0;
  let stftTime = { min: 0, max: Math.max(durationSec, 1e-9) };
  let stftFreq = {
    min: -result.outputSampleRateHz / 2,
    max: result.outputSampleRateHz / 2,
  };
  if (result.basebandStft && result.basebandStft.frameCount > 0) {
    binCount = result.basebandStft.binCount;
    frameCount = result.basebandStft.frameCount;
    const shifted = new Float32Array(frameCount * binCount);
    for (let f = 0; f < frameCount; f++) {
      const row = result.basebandStft.linearPower.subarray(
        f * binCount,
        (f + 1) * binCount,
      );
      shifted.set(fftshiftFrame(row, binCount), f * binCount);
    }
    stftPower = new Float32Array(normalizePower01(shifted));
    stftTime = {
      min: 0,
      max:
        frameCount > 0
          ? ((frameCount - 1) * hopSize + stftFftSize) /
            result.outputSampleRateHz
          : durationSec,
    };
  }

  const pipelineLabel =
    `sigmf_data_demo → DDC → constellation (LO ${loOffsetHz.toFixed(0)} Hz, R=${interpolation}/${decimation}) · not classifier`;

  return {
    sourceLabel: handle.sourceLabel,
    pipelineLabel,
    loOffsetHz,
    interpolation,
    decimation,
    outputSampleRateHz: result.outputSampleRateHz,
    samplesRead: result.samplesRead,
    sampleBegin: begin,
    sampleEnd: begin + result.samplesRead,
    annotationLabel: ann?.label,
    constellation,
    eye,
    stft: {
      power: stftPower,
      binCount,
      frameCount,
      freqHz: stftFreq,
      timeSec: stftTime,
    },
  };
}
