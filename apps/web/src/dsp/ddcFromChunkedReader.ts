/**
 * Chunked IQ read → DspWorkerClient.processDdc (+ optional baseband STFT/PSD).
 * Cancel mid-read and mid-DDC must reject AbortError.
 * Does NOT replace the narrowband UI stub — callers must pass a real
 * ChunkedReader and an explicit sourceLabel (no silent fake IQ).
 */
import type { ChunkedReader } from '@wss/file-io';
import type { DspWorkerClient } from '@wss/dsp-wasm';
import type { DdcResult, StftResult, PsdResult, SpectralWindowName } from '@wss/contracts';
import { DEFAULT_CHUNK_BYTES } from '@wss/contracts';

export interface DdcFromChunkedReaderOptions {
  reader: ChunkedReader;
  client: DspWorkerClient;
  /** Input sample rate of the IQ stream (Hz). */
  sampleRateHz: number;
  /**
   * LO offset in Hz (same as DdcRequest.loHz).
   * Tone / carrier at this offset is mixed to baseband DC.
   */
  loOffsetHz: number;
  interpolation: number;
  decimation: number;
  firTaps?: Float64Array;
  /** Inclusive begin sample (default 0). */
  begin?: bigint;
  /** Exclusive end sample (default: available prefix). */
  end?: bigint;
  maxBytes?: number;
  signal?: AbortSignal;
  /**
   * Explicit source label for UI / telemetry. Must not silently claim "live" /
   * capture when the reader is a synthetic fixture.
   */
  sourceLabel: string;
  /** Optional STFT on DDC baseband output (JS Worker path; default engine). */
  basebandStft?: {
    fftSize?: number;
    hopSize?: number;
    window?: SpectralWindowName;
  };
  /** Optional Welch-style PSD on DDC baseband (mutually fine with stft). */
  basebandPsd?: {
    fftSize?: number;
    window?: SpectralWindowName;
    overlap?: number;
  };
}

export interface DdcFromChunkedReaderResult {
  ddc: DdcResult;
  samplesRead: bigint;
  sourceLabel: string;
  inputSampleRateHz: number;
  outputSampleRateHz: number;
  basebandStft?: StftResult;
  basebandPsd?: PsdResult;
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    const reason = signal.reason;
    if (reason instanceof Error) throw reason;
    if (typeof DOMException !== 'undefined') {
      throw new DOMException('Aborted', 'AbortError');
    }
    const err = new Error('Aborted');
    err.name = 'AbortError';
    throw err;
  }
}

async function readIqChunks(options: {
  reader: ChunkedReader;
  begin: bigint;
  end: bigint;
  maxBytes: number;
  signal?: AbortSignal;
}): Promise<{ iq: Float32Array; samplesRead: bigint }> {
  const { reader, begin, end, maxBytes, signal } = options;
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

  return { iq, samplesRead };
}

/**
 * Read IQ chunk(s) → cancelable Worker DDC → optional baseband STFT/PSD.
 * Production callers must supply a real ChunkedReader + honest sourceLabel.
 */
export async function ddcFromChunkedReader(
  options: DdcFromChunkedReaderOptions,
): Promise<DdcFromChunkedReaderResult> {
  const {
    reader,
    client,
    sampleRateHz,
    loOffsetHz,
    interpolation,
    decimation,
    firTaps,
    sourceLabel,
    signal,
    maxBytes = DEFAULT_CHUNK_BYTES,
    basebandStft,
    basebandPsd,
  } = options;

  if (!sourceLabel || !sourceLabel.trim()) {
    throw new TypeError('ddcFromChunkedReader: sourceLabel is required (no silent fake IQ)');
  }
  if (!(sampleRateHz > 0)) throw new RangeError('sampleRateHz must be > 0');
  if (!Number.isInteger(interpolation) || interpolation < 1) {
    throw new RangeError(`interpolation must be integer >= 1, got ${interpolation}`);
  }
  if (!Number.isInteger(decimation) || decimation < 1) {
    throw new RangeError(`decimation must be integer >= 1, got ${decimation}`);
  }

  throwIfAborted(signal);

  const prefix = reader.availablePrefix();
  const begin = options.begin ?? 0n;
  const end = options.end ?? prefix.availableSamples;
  if (end < begin) throw new RangeError('ddcFromChunkedReader: end < begin');

  const { iq, samplesRead } = await readIqChunks({
    reader,
    begin,
    end,
    maxBytes,
    signal,
  });

  throwIfAborted(signal);

  const ddc = await client.processDdc(
    {
      begin,
      end: begin + samplesRead,
      loHz: loOffsetHz,
      sampleRateHz,
      interpolation,
      decimation,
      firTaps,
    },
    iq,
    signal,
  );

  throwIfAborted(signal);

  const nOut = Number(ddc.end - ddc.begin);
  let basebandStftResult: StftResult | undefined;
  let basebandPsdResult: PsdResult | undefined;

  if (basebandStft && nOut > 0) {
    const fftSize = basebandStft.fftSize ?? 256;
    const hopSize = basebandStft.hopSize ?? Math.max(1, Math.floor(fftSize / 4));
    const window = basebandStft.window ?? 'hann';
    basebandStftResult = await client.analyzeStft(
      {
        begin: 0n,
        end: ddc.end - ddc.begin,
        fftSize,
        hopSize,
        window,
        sampleRateHz: ddc.outputSampleRateHz,
      },
      ddc.samples,
      signal,
    );
  }

  if (basebandPsd && nOut > 0) {
    const fftSize = basebandPsd.fftSize ?? 256;
    const window = basebandPsd.window ?? 'hann';
    const overlap = basebandPsd.overlap ?? 0.5;
    basebandPsdResult = await client.analyzePsd(
      {
        begin: 0n,
        end: ddc.end - ddc.begin,
        fftSize,
        window,
        overlap,
        sampleRateHz: ddc.outputSampleRateHz,
      },
      ddc.samples,
      signal,
    );
  }

  return {
    ddc,
    samplesRead,
    sourceLabel,
    inputSampleRateHz: sampleRateHz,
    outputSampleRateHz: ddc.outputSampleRateHz,
    basebandStft: basebandStftResult,
    basebandPsd: basebandPsdResult,
  };
}
