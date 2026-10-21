import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** G02: Bot-D publishes real main-STFT analysis params for SpecParamStrip. */
describe('G02 dspFft / spectral contract store', () => {
  beforeEach(() => {
    useUiStore.getState().setDspFftAnalysisParams(null);
  });

  it('defaults to null (strip shows honest dash until STFT settles)', () => {
    const s = useUiStore.getState();
    expect(s.dspFftWindow).toBeNull();
    expect(s.dspFftOverlap).toBeNull();
    expect(s.dspFftHopSize).toBeNull();
    expect(s.dspFftSizeActive).toBeNull();
    expect(s.dspAnalysisSamples).toBeNull();
    expect(s.dspSpectralMethod).toBeNull();
    expect(s.dspSegmentMs).toBeNull();
    expect(s.dspSpectrumStatistic).toBeNull();
    expect(s.dspKaiserBeta).toBeNull();
    expect(s.dspRemoveMean).toBeNull();
    expect(s.dspAutoNb).toBeNull();
  });

  it('setDspFftAnalysisParams publishes window/overlap + method/segmentMs; statistic stays null', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'hann',
      overlap: 0.75,
      hopSize: 64,
      fftSize: 256,
      analysisSamples: 200,
      method: 'welch',
      segmentMs: 0.256,
      spectrumStatistic: null,
      kaiserBeta: null,
      removeMean: false,
      autoNb: false,
    });
    const s = useUiStore.getState();
    expect(s.dspFftWindow).toBe('hann');
    expect(s.dspFftOverlap).toBeCloseTo(0.75, 10);
    expect(s.dspFftHopSize).toBe(64);
    expect(s.dspFftSizeActive).toBe(256);
    expect(s.dspAnalysisSamples).toBe(200);
    expect(s.dspSpectralMethod).toBe('welch');
    expect(s.dspSegmentMs).toBeCloseTo(0.256, 10);
    expect(s.dspSpectrumStatistic).toBeNull();
    expect(s.dspKaiserBeta).toBeNull();
    expect(s.dspRemoveMean).toBe(false);
    expect(s.dspAutoNb).toBe(false);
  });

  it('publishes kaiserBeta when window is kaiser', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'kaiser',
      overlap: 0.5,
      hopSize: 128,
      fftSize: 256,
      analysisSamples: 256,
      method: 'welch',
      segmentMs: 1,
      spectrumStatistic: null,
      kaiserBeta: 8.6,
    });
    expect(useUiStore.getState().dspKaiserBeta).toBeCloseTo(8.6, 10);
  });

  it('setDspFftAnalysisParams(null) clears for loading / demo-fallback', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'hamming',
      overlap: 0.5,
      hopSize: 128,
      fftSize: 256,
      analysisSamples: 256,
      method: 'welch',
      segmentMs: 0.5,
      spectrumStatistic: null,
      kaiserBeta: null,
    });
    useUiStore.getState().setDspFftAnalysisParams(null);
    const s = useUiStore.getState();
    expect(s.dspFftWindow).toBeNull();
    expect(s.dspFftSizeActive).toBeNull();
    expect(s.dspAnalysisSamples).toBeNull();
    expect(s.dspSpectralMethod).toBeNull();
    expect(s.dspSegmentMs).toBeNull();
    expect(s.dspSpectrumStatistic).toBeNull();
    expect(s.dspKaiserBeta).toBeNull();
  });

  it('clamps overlap into [0, 1)', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'rectangular',
      overlap: 1.5,
      hopSize: 1,
      fftSize: 64,
      analysisSamples: 64,
      method: 'welch',
      segmentMs: 0,
      spectrumStatistic: null,
      kaiserBeta: null,
    });
    expect(useUiStore.getState().dspFftOverlap).toBeLessThan(1);
    expect(useUiStore.getState().dspFftOverlap).toBeGreaterThanOrEqual(0);
  });

  it('publishes removeMean and autoNb when provided', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'hann',
      overlap: 0.5,
      hopSize: 128,
      fftSize: 256,
      analysisSamples: 180,
      method: 'welch',
      segmentMs: 0,
      spectrumStatistic: null,
      kaiserBeta: null,
      removeMean: true,
      autoNb: true,
    });
    expect(useUiStore.getState().dspRemoveMean).toBe(true);
    expect(useUiStore.getState().dspAutoNb).toBe(true);
    expect(useUiStore.getState().dspAnalysisSamples).toBe(180);
    expect(useUiStore.getState().dspFftSizeActive).toBe(256);
  });

  it('publishes distinct pre-PoT analysisSamples vs post-PoT fftSizeActive', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'hann',
      overlap: 0.75,
      hopSize: 64,
      fftSize: 256,
      analysisSamples: 200,
      method: 'welch',
      segmentMs: 0,
      spectrumStatistic: null,
      kaiserBeta: null,
      autoNb: true,
    });
    const s = useUiStore.getState();
    expect(s.dspAnalysisSamples).toBe(200);
    expect(s.dspFftSizeActive).toBe(256);
    expect(s.dspAnalysisSamples).not.toBe(s.dspFftSizeActive);
  });
});
