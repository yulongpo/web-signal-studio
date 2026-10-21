/**
 * G06 narrowband page DSP contracts (Bot-D).
 * Documents inputs/outputs for modulation / recognition / demodulation pages.
 * WIRE paths live in constellationFromIq / simpleDemodFromIq / *Ddc modules.
 * BLOCKED items stay as interfaces + stubs — do not invent model scores or bitstreams.
 *
 * Contract ownership note: Bot-F owns @wss/contracts protocol shapes.
 * These are app-local provisional hooks so Bot-B/E can consume without conflicting
 * package protocols until Bot-F promotes them.
 */
import type { SampleIndex } from '@wss/contracts';
import type { ConstellationPoint } from './constellationFromIq';
import type { SimpleDemodMode } from './simpleDemodFromIq';

/** Shared LO / rational-resample params derived from SigMF annotations (observe path). */
export type NarrowbandDdcTuning = {
  loOffsetHz: number;
  interpolation: number;
  decimation: number;
  sampleBegin: SampleIndex;
  sampleEnd: SampleIndex;
};

/** Common IQ source identity — must stay sigmf_data_demo (or explicit ChunkedReader). */
export type NarrowbandIqSourceRef = {
  sourceLabel: string;
  /** Always 'sigmf_data_demo' for current Bot-D demo path. */
  kind: 'sigmf_data_demo' | 'chunked_reader';
};

// ---------------------------------------------------------------------------
// WIRED: constellation from DDC IQ (modulation page)
// ---------------------------------------------------------------------------

export type NarrowbandConstellationRequest = {
  tuning: NarrowbandDdcTuning;
  source: NarrowbandIqSourceRef;
  maxPoints?: number;
  skipSamples?: number;
};

export type NarrowbandConstellationResult = {
  status: 'ok';
  points: ConstellationPoint[];
  outputSampleRateHz: number;
  pipelineLabel: string;
};

// ---------------------------------------------------------------------------
// WIRED: simple AM/FM/RMS overview from DDC IQ (demodulation page)
// ---------------------------------------------------------------------------

export type NarrowbandSimpleDemodRequest = {
  tuning: NarrowbandDdcTuning;
  source: NarrowbandIqSourceRef;
  mode: SimpleDemodMode;
  maxPoints?: number;
};

export type NarrowbandSimpleDemodResult = {
  status: 'ok';
  mode: SimpleDemodMode;
  y: Float32Array;
  xDomain: { min: number; max: number; unit: string; label: string };
  outputSampleRateHz: number;
  /** Honest: preview only — not product demod / not bitstream. */
  pipelineLabel: string;
};

// ---------------------------------------------------------------------------
// BLOCKED: eye diagram (needs symbol timing recovery — not in-tree for Bot-D)
// ---------------------------------------------------------------------------

/**
 * BLOCKED: eye diagram needs Gardner/Mueller (or equivalent) timing sync — not in Bot-D tree.
 * sigmf_data_demo annotations carry modulation labels + freq edges but **no** symbol_rate / SPS;
 * UI `nbSymbolRate` is chrome only and must not be treated as verified timing.
 * Do not draw an eye from a guessed SPS — that would be a fake trace.
 */
export type NarrowbandEyeDiagramRequest = {
  tuning: NarrowbandDdcTuning;
  source: NarrowbandIqSourceRef;
  /** Samples per symbol — unknown without timing recovery or annotated baud. */
  samplesPerSymbol?: number;
  traces?: number;
};

export type NarrowbandEyeDiagramResult = {
  status: 'BLOCKED';
  reasonCode: 'EYE_TIMING_SYNC_MISSING';
  reasonZh: string;
  reasonEn: string;
};

export const NARROWBAND_EYE_BLOCKED: NarrowbandEyeDiagramResult = {
  status: 'BLOCKED',
  reasonCode: 'EYE_TIMING_SYNC_MISSING',
  reasonZh:
    '眼图需要符号定时同步（Gardner/Mueller 等），Bot-D 树内无此引擎；不绘制伪眼图。',
  reasonEn:
    'Eye diagram needs symbol timing recovery (Gardner/Mueller) or annotated SPS; neither in Bot-D / sigmf_data_demo. No fake eye.',
};

/** Stub: always BLOCKED until timing-sync DSP lands. */
export function computeNarrowbandEyeDiagram(
  _request: NarrowbandEyeDiagramRequest,
): NarrowbandEyeDiagramResult {
  return NARROWBAND_EYE_BLOCKED;
}

// ---------------------------------------------------------------------------
// BLOCKED: modulation recognition / deep-learning (Bot-E TensorRT / FFSCN)
// ---------------------------------------------------------------------------

/** BLOCKED: recognition needs Bot-E model engines (FFSCN/SCN/TRT) — not Bot-D DSP. */
export type NarrowbandRecognitionRequest = {
  tuning: NarrowbandDdcTuning;
  source: NarrowbandIqSourceRef;
  /** Model id from local-compute capabilities (Bot-E). */
  modelId?: string;
};

export type NarrowbandRecognitionLabel = {
  label: string;
  score: number;
};

export type NarrowbandRecognitionResult = {
  status: 'BLOCKED';
  reasonCode: 'RECOGNITION_ENGINE_MISSING';
  reasonZh: string;
  reasonEn: string;
  /** Always empty when BLOCKED — never invent scores. */
  labels: NarrowbandRecognitionLabel[];
};

export const NARROWBAND_RECOGNITION_BLOCKED: NarrowbandRecognitionResult = {
  status: 'BLOCKED',
  reasonCode: 'RECOGNITION_ENGINE_MISSING',
  reasonZh:
    '深度学习识别依赖 Bot-E TensorRT/FFSCN 引擎与权重；Bot-D 不运行演示推理、不生成伪分数。',
  reasonEn:
    'Recognition needs Bot-E TensorRT/FFSCN engines + weights. Bot-D will not invent scores.',
  labels: [],
};

/** Stub: always BLOCKED until Bot-E wires a verified engine. */
export function computeNarrowbandRecognition(
  _request: NarrowbandRecognitionRequest,
): NarrowbandRecognitionResult {
  return NARROWBAND_RECOGNITION_BLOCKED;
}

// ---------------------------------------------------------------------------
// BLOCKED: bitstream / protocol demod (PSK/QAM hard decisions + decoder)
// ---------------------------------------------------------------------------

/** BLOCKED: product demod / bitstream needs symbol decisions + decoder — not in-tree. */
export type NarrowbandBitstreamDemodRequest = {
  tuning: NarrowbandDdcTuning;
  source: NarrowbandIqSourceRef;
  modulationHint?: string;
};

export type NarrowbandBitstreamDemodResult = {
  status: 'BLOCKED';
  reasonCode: 'BITSTREAM_DEMOD_MISSING';
  reasonZh: string;
  reasonEn: string;
  /** Always empty when BLOCKED. */
  bits: Uint8Array;
};

export const NARROWBAND_BITSTREAM_BLOCKED: NarrowbandBitstreamDemodResult = {
  status: 'BLOCKED',
  reasonCode: 'BITSTREAM_DEMOD_MISSING',
  reasonZh:
    '比特流/协议解调（硬判决+译码）不在 Bot-D 树内；仅提供 AM/FM 包络预览，不伪造比特。',
  reasonEn:
    'Bitstream/protocol demod not in Bot-D tree. Only AM/FM envelope preview; no fake bits.',
  bits: new Uint8Array(0),
};

/** Stub: always BLOCKED — use simpleDemodOverview for envelope preview instead. */
export function computeNarrowbandBitstreamDemod(
  _request: NarrowbandBitstreamDemodRequest,
): NarrowbandBitstreamDemodResult {
  return NARROWBAND_BITSTREAM_BLOCKED;
}
