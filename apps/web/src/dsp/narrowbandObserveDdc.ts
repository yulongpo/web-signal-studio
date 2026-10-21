/**
 * Narrowband observe path (Bot-D): sigmf_data_demo → Worker DDC → wave / PSD / STFT.
 * Fills G06 observe chart slots with real processed IQ (not empty shell, not demod).
 * LO/window defaults come from the first SigMF annotation when present.
 */
import type { DspWorkerClient } from '@wss/dsp-wasm';
import type { NarrowbandWaveformMode } from '../types/provisional';
import {
  ensureDemoSigmfReader,
  iqRmsOverview,
  type DemoSigmfAnnotation,
  type DemoSigmfHandle,
} from './auxWaveRawIq';
import { ddcFromChunkedReader } from './ddcFromChunkedReader';
import { fftshiftFrame, normalizePower01 } from './computeMainSpectrogram';

/** Cap input IQ samples so one observe paint stays interactive. */
export const NB_OBSERVE_MAX_INPUT_SAMPLES = 65_536;

/** Default rational resample when annotation BW is unknown. */
export const NB_OBSERVE_DEFAULT_DECIMATION = 16;

export type NarrowbandObserveDdcOptions = {
  client: DspWorkerClient;
  /** Override LO (baseband Hz). Default: first annotation mid − center. */
  loOffsetHz?: number;
  interpolation?: number;
  decimation?: number;
  psdFftSize?: number;
  stftFftSize?: number;
  waveformMode?: NarrowbandWaveformMode;
  maxWavePoints?: number;
  maxInputSamples?: number;
  demoDir?: string | null;
  signal?: AbortSignal;
  /** Prefer this annotation index when deriving LO/window (default 0). */
  annotationIndex?: number;
};

export type NarrowbandObserveDdcResult = {
  sourceLabel: string;
  /** Honest pipeline description for UI data attrs / status. */
  pipelineLabel: string;
  loOffsetHz: number;
  interpolation: number;
  decimation: number;
  inputSampleRateHz: number;
  outputSampleRateHz: number;
  samplesRead: bigint;
  sampleBegin: bigint;
  sampleEnd: bigint;
  annotationLabel?: string;
  waveform: {
    y: Float32Array;
    xDomain: { min: number; max: number; unit: string; label: string };
    mode: NarrowbandWaveformMode;
  };
  psd: {
    y: Float32Array;
    xDomain: { min: number; max: number; unit: string; label: string };
  };
  stft: {
    power: Float32Array;
    binCount: number;
    frameCount: number;
    freqHz: { min: number; max: number };
    timeSec: { min: number; max: number };
  };
};

function pickAnnotation(
  handle: DemoSigmfHandle,
  index: number,
): DemoSigmfAnnotation | null {
  if (!handle.annotations.length) return null;
  const i = Math.max(0, Math.min(handle.annotations.length - 1, index));
  return handle.annotations[i] ?? null;
}

/**
 * Derive baseband LO from annotation RF edges vs capture center.
 * Falls back to 0 when meta lacks frequency edges.
 */
export function deriveLoOffsetHz(
  handle: DemoSigmfHandle,
  annotation: DemoSigmfAnnotation | null,
): number {
  if (
    annotation &&
    annotation.freqLowerHz != null &&
    annotation.freqUpperHz != null &&
    handle.centerFrequencyHz != null &&
    Number.isFinite(handle.centerFrequencyHz)
  ) {
    const mid = (annotation.freqLowerHz + annotation.freqUpperHz) / 2;
    return mid - handle.centerFrequencyHz;
  }
  return 0;
}

/**
 * Choose decimation so output rate is roughly 4× annotation bandwidth,
 * clamped to powers of two in [2, 64].
 */
export function deriveDecimation(
  handle: DemoSigmfHandle,
  annotation: DemoSigmfAnnotation | null,
): number {
  if (
    annotation &&
    annotation.freqLowerHz != null &&
    annotation.freqUpperHz != null &&
    handle.sampleRateHz > 0
  ) {
    const bw = Math.abs(annotation.freqUpperHz - annotation.freqLowerHz);
    if (bw > 0) {
      const targetOut = Math.max(bw * 4, handle.sampleRateHz / 64);
      const raw = Math.round(handle.sampleRateHz / targetOut);
      const clamped = Math.max(2, Math.min(64, raw));
      // Snap to nearest power of two for FIR-friendly rates.
      const pot = 2 ** Math.round(Math.log2(clamped));
      return Math.max(2, Math.min(64, pot));
    }
  }
  return NB_OBSERVE_DEFAULT_DECIMATION;
}

export function deriveSampleWindow(
  handle: DemoSigmfHandle,
  annotation: DemoSigmfAnnotation | null,
  maxInputSamples: number,
): { begin: bigint; end: bigint } {
  const total = handle.totalSamples;
  const maxN = BigInt(Math.max(256, maxInputSamples));
  if (total <= 0n) return { begin: 0n, end: 0n };

  let begin = 0n;
  let end = total < maxN ? total : maxN;

  if (annotation) {
    const annBegin = BigInt(Math.max(0, Math.floor(annotation.sampleStart)));
    let annEnd = annBegin + BigInt(Math.max(1, Math.floor(annotation.sampleCount)));
    if (annEnd > total) annEnd = total;
    begin = annBegin > total ? 0n : annBegin;
    end = annEnd;
    if (end - begin > maxN) {
      end = begin + maxN;
    }
    if (end <= begin) {
      end = begin + 1n <= total ? begin + 1n : total;
    }
  }

  return { begin, end };
}

function overviewFromIq(
  iq: Float32Array,
  mode: NarrowbandWaveformMode,
  points: number,
): Float32Array {
  const sampleCount = Math.floor(iq.length / 2);
  if (sampleCount <= 0) return new Float32Array(Math.max(1, points));

  if (mode === 'rms' || mode === 'envelope') {
    return iqRmsOverview(iq, points);
  }

  const n = Math.max(1, points);
  const out = new Float32Array(n);
  for (let x = 0; x < n; x++) {
    const idx = Math.min(
      sampleCount - 1,
      Math.floor((x * sampleCount) / n),
    );
    const i = iq[idx * 2] ?? 0;
    const q = iq[idx * 2 + 1] ?? 0;
    if (mode === 'phase') {
      out[x] = Math.atan2(q, i);
    } else {
      // 'iq' → show I channel overview (Q available via mode switch later).
      out[x] = i;
    }
  }
  return out;
}

function linearPowerToDb(linear: Float32Array): Float32Array {
  const out = new Float32Array(linear.length);
  const eps = 1e-20;
  for (let i = 0; i < linear.length; i++) {
    out[i] = 10 * Math.log10(Math.max(eps, linear[i]!));
  }
  return out;
}

/**
 * Open demo SigMF → DDC (+ baseband PSD/STFT) for G06 observe charts.
 */
export async function computeNarrowbandObserveDdc(
  options: NarrowbandObserveDdcOptions,
): Promise<NarrowbandObserveDdcResult> {
  const handle = await ensureDemoSigmfReader({
    demoDir: options.demoDir,
    signal: options.signal,
  });
  const ann = pickAnnotation(handle, options.annotationIndex ?? 0);
  const loOffsetHz =
    options.loOffsetHz ?? deriveLoOffsetHz(handle, ann);
  const interpolation = options.interpolation ?? 1;
  const decimation =
    options.decimation ?? deriveDecimation(handle, ann);
  const maxInputSamples =
    options.maxInputSamples ?? NB_OBSERVE_MAX_INPUT_SAMPLES;
  const { begin, end } = deriveSampleWindow(
    handle,
    ann,
    maxInputSamples,
  );

  const psdFftSize = options.psdFftSize ?? 1024;
  const stftFftSize = options.stftFftSize ?? 256;
  const waveformMode = options.waveformMode ?? 'iq';
  const maxWavePoints = options.maxWavePoints ?? 2048;

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
    basebandPsd: {
      fftSize: Math.min(psdFftSize, 4096),
      window: 'hann',
      overlap: 0.5,
    },
    basebandStft: {
      fftSize: Math.min(stftFftSize, 2048),
      hopSize,
      window: 'hann',
    },
  });

  const nOut = Number(result.ddc.end - result.ddc.begin);
  const durationSec =
    nOut > 0 ? nOut / result.outputSampleRateHz : 0;

  const waveY = overviewFromIq(
    result.ddc.samples,
    waveformMode,
    maxWavePoints,
  );

  // PSD: fftshift-ish axis from -fs/2..fs/2 for WaveformChart x.
  let psdY = new Float32Array(0);
  let psdX = {
    min: -result.outputSampleRateHz / 2,
    max: result.outputSampleRateHz / 2,
    unit: 'Hz',
    label: 'Frequency',
  };
  if (result.basebandPsd && result.basebandPsd.linearPower.length > 0) {
    const lin = result.basebandPsd.linearPower;
    const n = lin.length;
    const half = n >> 1;
    const shifted = new Float32Array(n);
    shifted.set(lin.subarray(half), 0);
    shifted.set(lin.subarray(0, half), half);
    psdY = new Float32Array(linearPowerToDb(shifted));
  }

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

  const pipelineLabel = `sigmf_data_demo → DDC (LO ${loOffsetHz.toFixed(0)} Hz, R=${interpolation}/${decimation}) · not demod`;

  return {
    sourceLabel: handle.sourceLabel,
    pipelineLabel,
    loOffsetHz,
    interpolation,
    decimation,
    inputSampleRateHz: result.inputSampleRateHz,
    outputSampleRateHz: result.outputSampleRateHz,
    samplesRead: result.samplesRead,
    sampleBegin: begin,
    sampleEnd: begin + result.samplesRead,
    annotationLabel: ann?.label,
    waveform: {
      y: waveY,
      xDomain: {
        min: 0,
        max: Math.max(durationSec, 1e-9),
        unit: 's',
        label: 'Time',
      },
      mode: waveformMode,
    },
    psd: {
      y: psdY,
      xDomain: psdX,
    },
    stft: {
      power: stftPower,
      binCount,
      frameCount,
      freqHz: stftFreq,
      timeSec: stftTime,
    },
  };
}
