import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KAISER_BETA,
  segmentMillisecondsFromFft,
  STFT_BLOCKED_METHODS,
  STFT_SPECTRUM_STATISTIC_STATUS,
} from '@wss/contracts';
import { computeStft } from './stft.js';

describe('G02 StftRequest method / segment contract', () => {
  it('segmentMillisecondsFromFft matches fftSize/fs*1000', () => {
    expect(segmentMillisecondsFromFft(1024, 1_000_000)).toBeCloseTo(1.024, 12);
    expect(segmentMillisecondsFromFft(256, 1e6)).toBeCloseTo(0.256, 12);
  });

  it('documents SpectrumStatistic as NA on STFT', () => {
    expect(STFT_SPECTRUM_STATISTIC_STATUS).toBe('NA_PSD_ONLY');
  });

  it('lists Multitaper/Burg/etc as BLOCKED for STFT', () => {
    expect(STFT_BLOCKED_METHODS).toContain('multitaper');
    expect(STFT_BLOCKED_METHODS).toContain('burg');
    expect(STFT_BLOCKED_METHODS).toContain('periodogram');
    expect(STFT_BLOCKED_METHODS).toContain('bartlett');
  });

  it('rejects BLOCKED method at compute (no silent fallback)', async () => {
    const iq = new Float32Array(512);
    await expect(
      computeStft(
        {
          begin: 0n,
          end: 256n,
          fftSize: 64,
          hopSize: 32,
          window: 'hann',
          sampleRateHz: 1e6,
          // @ts-expect-error intentional blocked method
          method: 'multitaper',
        },
        iq,
      ),
    ).rejects.toThrow(/BLOCKED/);
  });

  it('accepts welch + kaiserBeta path', async () => {
    const n = 128;
    const iq = new Float32Array(n * 2);
    const result = await computeStft(
      {
        begin: 0n,
        end: BigInt(n),
        fftSize: 64,
        hopSize: 32,
        window: 'kaiser',
        sampleRateHz: 1e6,
        method: 'welch',
        kaiserBeta: DEFAULT_KAISER_BETA,
        segmentMilliseconds: segmentMillisecondsFromFft(64, 1e6),
      },
      iq,
    );
    expect(result.frameCount).toBeGreaterThan(0);
    expect(result.binCount).toBe(64);
  });
});
