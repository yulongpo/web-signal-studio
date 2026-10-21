/**
 * computeMainSpectrogram with InProcessAsyncBackend — no browser Worker required in CI.
 */
import { afterEach, describe, expect, it } from 'vitest';
import {
  createDspWorkerClient,
  InProcessAsyncBackend,
  type DspWorkerClient,
} from '@wss/dsp-wasm';
import {
  computeMainSpectrogram,
  fftshiftFrame,
  normalizePower01,
  synthesizeTwoToneIq,
  SYNTHETIC_SOURCE_LABEL,
  MAIN_STFT_DEFAULTS,
  overlapFromHop,
} from './computeMainSpectrogram';

const clients: DspWorkerClient[] = [];

afterEach(async () => {
  while (clients.length) {
    await clients.pop()!.close();
  }
});

describe('computeMainSpectrogram', () => {
  it('runs STFT on synthetic two-tone IQ via injected in-process client', async () => {
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);

    const result = await computeMainSpectrogram({
      client,
      fftSize: 256,
      hopSize: 64,
      sampleRateHz: 1_000_000,
      toneHz: [150_000, -220_000],
    });

    expect(result.sourceLabel).toBe(SYNTHETIC_SOURCE_LABEL);
    expect(result.binCount).toBe(256);
    expect(result.frameCount).toBeGreaterThan(100);
    expect(result.power.length).toBe(result.binCount * result.frameCount);
    expect(result.freqHz.min).toBe(-500_000);
    expect(result.freqHz.max).toBe(500_000);
    expect(result.timeSec.max).toBeGreaterThan(0);
    expect(result.window).toBe('hann');
    expect(result.fftSize).toBe(256);
    expect(result.hopSize).toBe(64);
    expect(result.overlap).toBeCloseTo(0.75, 10);
    expect(result.method).toBe('welch');
    expect(result.segmentMilliseconds).toBeCloseTo((256 / 1_000_000) * 1000, 12);
    expect(result.spectrumStatistic).toBeNull();
    expect(result.kaiserBeta).toBeNull();

    let max = 0;
    for (let i = 0; i < result.power.length; i++) {
      max = Math.max(max, result.power[i]!);
    }
    expect(max).toBeCloseTo(1, 5);
  });

  it('honors AbortSignal', async () => {
    const client = createDspWorkerClient({ backend: new InProcessAsyncBackend() });
    clients.push(client);
    const ac = new AbortController();
    ac.abort();
    await expect(
      computeMainSpectrogram({ client, signal: ac.signal, fftSize: 256, hopSize: 64 }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('spectrogram helpers', () => {
  it('synthesizes interleaved IQ of expected length', () => {
    const iq = synthesizeTwoToneIq({
      sampleCount: 128,
      sampleRateHz: 1e6,
      toneHz: [1e5, -2e5],
    });
    expect(iq.length).toBe(256);
  });

  it('fftshifts and normalizes', () => {
    const row = new Float32Array([1, 2, 3, 4]);
    const shifted = fftshiftFrame(row, 4);
    expect(Array.from(shifted)).toEqual([3, 4, 1, 2]);
    const norm = normalizePower01(new Float32Array([0, 2, 4]));
    expect(Array.from(norm)).toEqual([0, 0.5, 1]);
  });
});

describe('G02 FFT window/overlap publish helpers', () => {
  it('MAIN_STFT_DEFAULTS are hann + hop=fft/4', () => {
    expect(MAIN_STFT_DEFAULTS.window).toBe('hann');
    expect(MAIN_STFT_DEFAULTS.hopSize).toBe(MAIN_STFT_DEFAULTS.fftSize / 4);
  });

  it('overlapFromHop matches 1 - hop/fft', () => {
    expect(overlapFromHop(256, 64)).toBeCloseTo(0.75, 12);
    expect(overlapFromHop(1024, 512)).toBeCloseTo(0.5, 12);
    expect(overlapFromHop(256, 256)).toBe(0);
    expect(overlapFromHop(0, 64)).toBe(0);
  });
});

describe('G02 STFT contract helpers', () => {
  it('MAIN_STFT_DEFAULTS.method is welch', () => {
    expect(MAIN_STFT_DEFAULTS.method).toBe('welch');
  });
});
