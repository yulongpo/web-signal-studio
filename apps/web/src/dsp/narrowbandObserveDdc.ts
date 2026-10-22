/**
 * Narrowband observe path (Bot-D): sigmf_data_demo → Worker DDC → wave / PSD / STFT.
 * Fills G06 observe chart slots with real processed IQ (not empty shell, not demod).
 * LO/window defaults come from the first SigMF annotation when present.
 */
import type { DspWorkerClient } from '@wss/dsp-wasm';
import type { NarrowbandWaveformMode, NarrowbandPsdMode } from '../types/provisional';
import {
  ensureDemoSigmfReader,
  iqRmsOverview,
  type DemoSigmfAnnotation,
  type DemoSigmfHandle,
} from './auxWaveRawIq';
import { ddcFromChunkedReader } from './ddcFromChunkedReader';
import { fftshiftFrame, normalizePower01 } from './computeMainSpectrogram';
import {
  resolveObserveDdcDrive,
  desktopOutputSampleRateHz,
  type ObserveBroadbandDrive,
  type ResolvedObserveDdcDrive,
} from './narrowbandObserveMarkerDdc';

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
  /** G18: frame = single STFT dwell; statistical = Welch aggregate. */
  psdMode?: NarrowbandPsdMode;
  /** Frame index for frame mode (default: last available frame). */
  psdFrameIndex?: number;
  maxWavePoints?: number;
  maxInputSamples?: number;
  demoDir?: string | null;
  signal?: AbortSignal;
  /** Prefer this annotation index when deriving LO/window (default 0). */
  annotationIndex?: number;
  /**
   * P0#7: broadband active mark/channel drive (desktop Session channel).
   * When set, LO/BW/rate/window come from this — not invented demo index alone.
   */
  broadbandDrive?: ObserveBroadbandDrive | null;
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
  /** P0#7 honest drive resolution (marker/channel/demo-annotation). */
  ddcDrive: ResolvedObserveDdcDrive;
  /** Honest short stamp for UI: 真实 DDC · … */
  ddcStatusStamp: string;
  /** data-nb-ddc-kind */
  ddcKindAttr: ResolvedObserveDdcDrive['ddcKindAttr'];
  waveform: {
    y: Float32Array;
    xDomain: { min: number; max: number; unit: string; label: string };
    mode: NarrowbandWaveformMode;
  };
  psdMode: NarrowbandPsdMode;
  /** Honest tag for which series is plotted. */
  psdSeriesKind: 'frame-stft' | 'welch-statistical';
  psd: {
    y: Float32Array;
    xDomain: { min: number; max: number; unit: string; label: string };
  };
  /** Both series retained so mode switch can be proven to change data. */
  psdFrame: Float32Array;
  psdStatistical: Float32Array;
  /** Resolved STFT frame used for frame PSD; null in statistical mode. */
  psdFrameIndexUsed: number | null;
  /** STFT dwell count available for pin chrome (B/C). */
  psdFrameCount: number;
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
 * fftshift linear power bins then convert to dB.
 */
export function linearPowerToDbShifted(linear: Float32Array): Float32Array {
  const n = linear.length;
  if (n === 0) return new Float32Array(0);
  const half = n >> 1;
  const shifted = new Float32Array(n);
  shifted.set(linear.subarray(half), 0);
  shifted.set(linear.subarray(0, half), half);
  return linearPowerToDb(shifted);
}

/**
 * G18 frame PSD: one STFT dwell (default last frame). Differs from Welch
 * statistical PSD whenever multiple frames/windows exist.
 */
export function buildFramePsdFromStft(
  linearPower: Float32Array,
  binCount: number,
  frameCount: number,
  frameIndex?: number,
): Float32Array {
  if (binCount <= 0 || frameCount <= 0 || linearPower.length < binCount) {
    return new Float32Array(0);
  }
  const idx =
    frameIndex == null
      ? frameCount - 1
      : Math.max(0, Math.min(frameCount - 1, Math.floor(frameIndex)));
  const row = linearPower.subarray(idx * binCount, (idx + 1) * binCount);
  return linearPowerToDbShifted(row);
}

/**
 * G18 statistical PSD: Welch aggregate (independent PSD-N). Falls back to
 * mean across STFT frames when Welch is empty.
 */
export function buildStatisticalPsd(
  welchLinear: Float32Array | null | undefined,
  stftLinear?: Float32Array,
  binCount?: number,
  frameCount?: number,
): Float32Array {
  if (welchLinear && welchLinear.length > 0) {
    return linearPowerToDbShifted(welchLinear);
  }
  if (
    stftLinear &&
    binCount &&
    frameCount &&
    frameCount > 0 &&
    binCount > 0 &&
    stftLinear.length >= binCount * frameCount
  ) {
    const mean = new Float32Array(binCount);
    for (let f = 0; f < frameCount; f++) {
      const row = stftLinear.subarray(f * binCount, (f + 1) * binCount);
      for (let k = 0; k < binCount; k++) mean[k]! += row[k]!;
    }
    const inv = 1 / frameCount;
    for (let k = 0; k < binCount; k++) mean[k]! *= inv;
    return linearPowerToDbShifted(mean);
  }
  return new Float32Array(0);
}

/**
 * Pick plotted PSD series from mode. Frame and statistical must be able to
 * differ numerically when both are available.
 */
export function selectNarrowbandPsdSeries(args: {
  mode: NarrowbandPsdMode;
  frameDb: Float32Array;
  statisticalDb: Float32Array;
}): { y: Float32Array; kind: 'frame-stft' | 'welch-statistical' } {
  if (args.mode === 'frame' && args.frameDb.length > 0) {
    return { y: args.frameDb, kind: 'frame-stft' };
  }
  if (args.statisticalDb.length > 0) {
    return { y: args.statisticalDb, kind: 'welch-statistical' };
  }
  if (args.frameDb.length > 0) {
    return { y: args.frameDb, kind: 'frame-stft' };
  }
  return { y: new Float32Array(0), kind: 'welch-statistical' };
}


/**
 * G18 chart/store helper: given dual series from observe DDC, pick the y-array
 * that `uiStore.narrowbandPsdMode` should plot. Statistical mode never returns
 * a pinned dwell/frame series when Welch/statistical data exists.
 */
export function plotYForNarrowbandPsdMode(
  mode: NarrowbandPsdMode,
  frameDb: Float32Array,
  statisticalDb: Float32Array,
): { y: Float32Array; kind: 'frame-stft' | 'welch-statistical' } {
  return selectNarrowbandPsdSeries({ mode, frameDb, statisticalDb });
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
  const maxInputSamples =
    options.maxInputSamples ?? NB_OBSERVE_MAX_INPUT_SAMPLES;
  const fallbackLo =
    options.loOffsetHz ?? deriveLoOffsetHz(handle, ann);
  const fallbackDecimation =
    options.decimation ?? deriveDecimation(handle, ann);
  const fallbackInterpolation = options.interpolation ?? 1;

  // P0#7: prefer explicit broadband drive (active channel/mark); else demo annotation.
  // Recompute desktop output rate with the real capture Fs (poll may use a hint Fs).
  const driveIn = options.broadbandDrive
    ? {
        ...options.broadbandDrive,
        outputSampleRateHz: desktopOutputSampleRateHz(
          handle.sampleRateHz,
          options.broadbandDrive.bandwidthHz,
        ),
      }
    : null;
  const resolved = resolveObserveDdcDrive({
    sourceCenterFrequencyHz: handle.centerFrequencyHz,
    sampleRateHz: handle.sampleRateHz,
    drive: driveIn,
    fallbackLoOffsetHz: fallbackLo,
    fallbackInterpolation,
    fallbackDecimation,
  });

  const loOffsetHz = resolved.loOffsetHz;
  const interpolation = resolved.interpolation;
  const decimation = resolved.decimation;

  let { begin, end } = deriveSampleWindow(
    handle,
    ann,
    maxInputSamples,
  );
  // When mark/channel supplies a sample window, prefer it (still capped).
  if (
    resolved.sampleBegin != null &&
    resolved.sampleEnd != null &&
    resolved.sampleEnd > resolved.sampleBegin
  ) {
    const maxN = BigInt(Math.max(256, maxInputSamples));
    begin = resolved.sampleBegin;
    end = resolved.sampleEnd;
    if (end > handle.totalSamples) end = handle.totalSamples;
    if (begin < 0n) begin = 0n;
    if (end - begin > maxN) end = begin + maxN;
    if (end <= begin) {
      end = begin + 1n <= handle.totalSamples ? begin + 1n : handle.totalSamples;
    }
  }

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

  // G18 PSD: frame = last STFT dwell; statistical = Welch aggregate.
  const psdMode: NarrowbandPsdMode = options.psdMode ?? 'statistical';
  const psdX = {
    min: -result.outputSampleRateHz / 2,
    max: result.outputSampleRateHz / 2,
    unit: 'Hz',
    label: 'Frequency',
  };
  const welchLinear = result.basebandPsd?.linearPower;
  const stftLinEarly = result.basebandStft?.linearPower;
  const stftBinsEarly = result.basebandStft?.binCount ?? 0;
  const stftFramesEarly = result.basebandStft?.frameCount ?? 0;
  // Pinned/dwell frame index only applies in frame mode so it cannot
  // freeze statistical Welch series when UI switches modes.
  const frameIndexForMode =
    psdMode === 'frame' ? options.psdFrameIndex : undefined;
  const psdFrame = buildFramePsdFromStft(
    stftLinEarly ?? new Float32Array(0),
    stftBinsEarly,
    stftFramesEarly,
    frameIndexForMode,
  );
  const psdFrameIndexUsed =
    psdMode === 'frame' && stftFramesEarly > 0
      ? frameIndexForMode == null
        ? stftFramesEarly - 1
        : Math.max(0, Math.min(stftFramesEarly - 1, Math.floor(frameIndexForMode)))
      : null;
  const psdFrameCount = stftFramesEarly;
  const psdStatistical = buildStatisticalPsd(
    welchLinear,
    stftLinEarly,
    stftBinsEarly,
    stftFramesEarly,
  );
  const selected = selectNarrowbandPsdSeries({
    mode: psdMode,
    frameDb: psdFrame,
    statisticalDb: psdStatistical,
  });
  const psdY = selected.y;

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

  const pipelineLabel = resolved.pipelineLabel;

  return {
    sourceLabel: handle.sourceLabel,
    pipelineLabel,
    ddcDrive: resolved,
    ddcStatusStamp: resolved.statusStamp,
    ddcKindAttr: resolved.ddcKindAttr,
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
    psdMode,
    psdSeriesKind: selected.kind,
    psd: {
      y: psdY,
      xDomain: psdX,
    },
    psdFrame,
    psdStatistical,
    psdFrameIndexUsed,
    psdFrameCount,
    stft: {
      power: stftPower,
      binCount,
      frameCount,
      freqHz: stftFreq,
      timeSec: stftTime,
    },
  };
}
