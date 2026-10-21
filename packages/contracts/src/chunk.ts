import type { SampleIndex } from './sample-index.js';
import { DEFAULT_CHUNK_BYTES } from './formats.js';

export { DEFAULT_CHUNK_BYTES };

export interface ChunkReadRequest {
  /** Inclusive begin sample index. */
  begin: SampleIndex;
  /** Exclusive end sample index. */
  end: SampleIndex;
  /** Soft byte budget; readers should not exceed this by much. Default ~4 MiB. */
  maxBytes?: number;
  /** AbortSignal for cancel. */
  signal?: AbortSignal;
}

export interface ChunkReadResponse {
  begin: SampleIndex;
  end: SampleIndex;
  /** Interleaved IQ as Float32 (I0,Q0,I1,Q1,...) or Real as Float32. */
  samples: Float32Array;
  /** True when response was truncated to available-prefix. */
  truncatedToAvailable: boolean;
  bytesRead: number;
}

export interface AvailablePrefix {
  /** Contiguous readable prefix length in samples (0..total). */
  availableSamples: SampleIndex;
  totalSamples: SampleIndex;
  status: 'ready' | 'loading' | 'partial' | 'failed';
  generation: string; // decimal
  fingerprint?: string;
  error?: string;
}

export interface CancelToken {
  readonly cancelled: boolean;
  throwIfCancelled(): void;
}

export function abortSignalToCancelToken(signal?: AbortSignal): CancelToken {
  return {
    get cancelled() {
      return signal?.aborted === true;
    },
    throwIfCancelled() {
      if (signal?.aborted) {
        const reason = signal.reason;
        throw reason instanceof Error ? reason : new DOMException('Aborted', 'AbortError');
      }
    },
  };
}
