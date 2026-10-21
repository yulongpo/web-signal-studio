/**
 * Chunked IQ read → DspWorkerClient.analyzeStft loop helper.
 * Cancel mid-read and mid-STFT must reject AbortError.
 * Does NOT replace MainChartHost synthetic fixture — callers must pass a real
 * ChunkedReader (e.g. user-picked WAV) and an explicit sourceLabel.
 */
import type { ChunkedReader } from '@wss/file-io';
import type { DspWorkerClient } from '@wss/dsp-wasm';
import type {
  StftResult,
  SpectralWindowName,
  StftSupportedMethod,
} from '@wss/contracts';
import { DEFAULT_KAISER_BETA, segmentMillisecondsFromFft } from '@wss/contracts';
import { DEFAULT_CHUNK_BYTES } from '@wss/contracts';

export interface StftFromChunkedReaderOptions {
  reader: ChunkedReader;
  client: DspWorkerClient;
  sampleRateHz: number;
  /** Inclusive begin sample (default 0). */
  begin?: bigint;
  /** Exclusive end sample (default: available prefix). */
  end?: bigint;
  fftSize?: number;
  hopSize?: number;
  window?: SpectralWindowName;
  method?: StftSupportedMethod;
  kaiserBeta?: number;
  removeMean?: boolean;
  segmentMilliseconds?: number;
  bandwidthHz?: number;
  analysisPoints?: number;
  maxBytes?: number;
  signal?: AbortSignal;
  /**
   * Explicit source label for UI / telemetry. Must not silently claim "live" /
   * capture when the reader is a synthetic fixture.
   */
  sourceLabel: string;
}

export interface StftFromChunkedReaderResult {
  stft: StftResult;
  samplesRead: bigint;
  sourceLabel: string;
  sampleRateHz: number;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const reason = signal.reason;
    throw reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
  }
}

/**
 * Read IQ chunk(s) as Float32 interleaved → DspWorkerClient.analyzeStft.
 * Uses available-prefix and ~4 MiB chunks; concatenates samples then one STFT.
 * For very long files callers should page externally; this helper covers the
 * Package A path (chunked read + cancelable worker STFT).
 */
export async function stftFromChunkedReader(
  options: StftFromChunkedReaderOptions,
): Promise<StftFromChunkedReaderResult> {
  const {
    reader,
    client,
    sampleRateHz,
    sourceLabel,
    signal,
    fftSize = 256,
    hopSize = 64,
    window = 'hann',
    method = 'welch' as StftSupportedMethod,
    kaiserBeta = DEFAULT_KAISER_BETA,
    removeMean = false,
    maxBytes = DEFAULT_CHUNK_BYTES,
  } = options;

  throwIfAborted(signal);

  const prefix = reader.availablePrefix();
  const begin = options.begin ?? 0n;
  const end = options.end ?? prefix.availableSamples;
  if (end < begin) throw new RangeError('stftFromChunkedReader: end < begin');

  const parts: Float32Array[] = [];
  let cursor = begin;
  let samplesRead = 0n;

  while (cursor < end) {
    throwIfAborted(signal);
    const chunk = await reader.read({
      begin: cursor,
      end,
      maxBytes,
      signal,
    });
    throwIfAborted(signal);
    if (chunk.end <= chunk.begin) break;
    parts.push(chunk.samples);
    samplesRead += chunk.end - chunk.begin;
    cursor = chunk.end;
  }

  throwIfAborted(signal);

  let iq: Float32Array;
  if (parts.length === 0) {
    iq = new Float32Array(0);
  } else if (parts.length === 1) {
    iq = parts[0]!;
  } else {
    let total = 0;
    for (const p of parts) total += p.length;
    iq = new Float32Array(total);
    let o = 0;
    for (const p of parts) {
      iq.set(p, o);
      o += p.length;
    }
  }

  const segmentMilliseconds =
    options.segmentMilliseconds ?? segmentMillisecondsFromFft(fftSize, sampleRateHz);
  const stft = await client.analyzeStft(
    {
      begin,
      end: begin + samplesRead,
      fftSize,
      hopSize,
      window,
      sampleRateHz,
      method,
      segmentMilliseconds,
      bandwidthHz: options.bandwidthHz,
      analysisPoints: options.analysisPoints,
      kaiserBeta: window === 'kaiser' ? kaiserBeta : undefined,
      removeMean: removeMean === true,
    },
    iq,
    signal,
  );

  return {
    stft,
    samplesRead,
    sourceLabel,
    sampleRateHz,
  };
}
