import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KAISER_BETA,
  segmentMillisecondsFromFft,
  resolveAnalysisSamples,
  webFftSizeFromAnalysisSamples,
  STFT_BLOCKED_METHODS,
  STFT_SPECTRUM_STATISTIC_STATUS,
} from '@wss/contracts';
import { computeStft } from './stft.js';

describe('G02 StftRequest method / segment / residual contract', () => {
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

  it('resolveAnalysisSamples auto N/B matches desktop ceil(fs/binHz) with no decimation', () => {
    // fs=1e6, BW=fs (full band) → no decimation; points=1024 → binHz=fs/1024
    // auto: analysisSamples = ceil(fs / binHz) = points = 1024
    const plan = resolveAnalysisSamples({
      sampleRateHz: 1_000_000,
      bandwidthHz: 1_000_000,
      points: 1024,
      segmentMilliseconds: 0,
    });
    expect(plan.autoNb).toBe(true);
    expect(plan.decimation).toBe(1);
    expect(plan.analysisSamples).toBe(1024);
    expect(webFftSizeFromAnalysisSamples(plan.analysisSamples)).toBe(1024);
  });

  it('resolveAnalysisSamples fixed segmentMs uses rate*ms/1000', () => {
    const plan = resolveAnalysisSamples({
      sampleRateHz: 1_000_000,
      bandwidthHz: 1_000_000,
      points: 1024,
      segmentMilliseconds: 2,
    });
    expect(plan.autoNb).toBe(false);
    expect(plan.analysisSamples).toBe(2000);
    expect(webFftSizeFromAnalysisSamples(2000)).toBe(2048);
  });

  it('auto N/B without bandwidth/points throws (no silent fake)', async () => {
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
          segmentMilliseconds: 0,
        },
        iq,
      ),
    ).rejects.toThrow(/auto N\/B/);
  });

  it('auto N/B with bandwidth+points resolves fftSize and runs', async () => {
    const n = 2048;
    const iq = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      iq[i * 2] = 1; // DC bias — removeMean should kill DC bin energy relative to no-remove
      iq[i * 2 + 1] = 0;
    }
    const result = await computeStft(
      {
        begin: 0n,
        end: BigInt(n),
        fftSize: 64, // overridden by auto
        hopSize: 512,
        window: 'rectangular',
        sampleRateHz: 1e6,
        segmentMilliseconds: 0,
        bandwidthHz: 1e6,
        analysisPoints: 1024,
        removeMean: true,
      },
      iq,
    );
    expect(result.binCount).toBe(1024);
    expect(result.frameCount).toBeGreaterThan(0);
    // After removeMean on constant IQ, power should be ~0
    let max = 0;
    for (let i = 0; i < result.linearPower.length; i++) {
      const v = result.linearPower[i]!;
      if (v > max) max = v;
    }
    expect(max).toBeLessThan(1e-20);
  });

  it('removeMean false leaves DC bias energy', async () => {
    const n = 256;
    const iq = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      iq[i * 2] = 1;
      iq[i * 2 + 1] = 0;
    }
    const result = await computeStft(
      {
        begin: 0n,
        end: BigInt(n),
        fftSize: 64,
        hopSize: 64,
        window: 'rectangular',
        sampleRateHz: 1e6,
        removeMean: false,
      },
      iq,
    );
    let max = 0;
    for (let i = 0; i < result.linearPower.length; i++) {
      const v = result.linearPower[i]!;
      if (v > max) max = v;
    }
    expect(max).toBeGreaterThan(0);
  });
});
