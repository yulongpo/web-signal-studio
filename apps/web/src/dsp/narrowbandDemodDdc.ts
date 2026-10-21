/**
 * G06 demodulation page DSP feed (Bot-D): sigmf_data_demo → Worker DDC → AM/FM/RMS preview.
 * Bitstream / protocol demod stays BLOCKED (see narrowbandPageDspContracts).
 */
import type { DspWorkerClient } from '@wss/dsp-wasm';
import { ensureDemoSigmfReader } from './auxWaveRawIq';
import { ddcFromChunkedReader } from './ddcFromChunkedReader';
import {
  deriveDecimation,
  deriveLoOffsetHz,
  deriveSampleWindow,
  NB_OBSERVE_MAX_INPUT_SAMPLES,
} from './narrowbandObserveDdc';
import {
  simpleDemodOverview,
  type SimpleDemodMode,
} from './simpleDemodFromIq';
import {
  computeNarrowbandBitstreamDemod,
  type NarrowbandBitstreamDemodResult,
} from './narrowbandPageDspContracts';

export type NarrowbandDemodDdcOptions = {
  client: DspWorkerClient;
  mode?: SimpleDemodMode;
  loOffsetHz?: number;
  interpolation?: number;
  decimation?: number;
  maxWavePoints?: number;
  maxInputSamples?: number;
  demoDir?: string | null;
  signal?: AbortSignal;
  annotationIndex?: number;
};

export type NarrowbandDemodDdcResult = {
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
  mode: SimpleDemodMode;
  waveform: {
    y: Float32Array;
    xDomain: { min: number; max: number; unit: string; label: string };
  };
  /** BLOCKED bitstream — always empty bits. */
  bitstream: NarrowbandBitstreamDemodResult;
};

export async function computeNarrowbandDemodDdc(
  options: NarrowbandDemodDdcOptions,
): Promise<NarrowbandDemodDdcResult> {
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
  const mode: SimpleDemodMode = options.mode ?? 'am_envelope';
  const maxWavePoints = options.maxWavePoints ?? 2048;

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
  });

  const nOut = Number(result.ddc.end - result.ddc.begin);
  const durationSec =
    nOut > 0 ? nOut / result.outputSampleRateHz : 0;

  const y = simpleDemodOverview(result.ddc.samples, mode, {
    maxPoints: maxWavePoints,
    sampleRateHz: result.outputSampleRateHz,
  });

  const bitstream = computeNarrowbandBitstreamDemod({
    tuning: {
      loOffsetHz,
      interpolation,
      decimation,
      sampleBegin: begin,
      sampleEnd: begin + result.samplesRead,
    },
    source: { sourceLabel: handle.sourceLabel, kind: 'sigmf_data_demo' },
  });

  const modeLabel =
    mode === 'am_envelope'
      ? 'AM envelope'
      : mode === 'fm_discriminator'
        ? 'FM discriminator'
        : 'RMS';
  const pipelineLabel =
    `sigmf_data_demo → DDC → ${modeLabel} preview (LO ${loOffsetHz.toFixed(0)} Hz) · not bitstream`;

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
    mode,
    waveform: {
      y,
      xDomain: {
        min: 0,
        max: Math.max(durationSec, 1e-9),
        unit: mode === 'fm_discriminator' ? 's' : 's',
        label: mode === 'fm_discriminator' ? 'Time (FM Hz)' : 'Time',
      },
    },
    bitstream,
  };
}
