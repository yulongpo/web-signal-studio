import { beforeEach, describe, expect, it } from 'vitest';
import { useUiStore } from './uiStore';

/** G02: Bot-D publishes real main-STFT window/overlap for SpecParamStrip. */
describe('G02 dspFftWindow / dspFftOverlap store', () => {
  beforeEach(() => {
    useUiStore.getState().setDspFftAnalysisParams(null);
  });

  it('defaults to null (strip shows honest — until STFT settles)', () => {
    const s = useUiStore.getState();
    expect(s.dspFftWindow).toBeNull();
    expect(s.dspFftOverlap).toBeNull();
    expect(s.dspFftHopSize).toBeNull();
    expect(s.dspFftSizeActive).toBeNull();
  });

  it('setDspFftAnalysisParams publishes window + overlap + hop + fftSize', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'hann',
      overlap: 0.75,
      hopSize: 64,
      fftSize: 256,
    });
    const s = useUiStore.getState();
    expect(s.dspFftWindow).toBe('hann');
    expect(s.dspFftOverlap).toBeCloseTo(0.75, 10);
    expect(s.dspFftHopSize).toBe(64);
    expect(s.dspFftSizeActive).toBe(256);
  });

  it('setDspFftAnalysisParams(null) clears for loading / demo-fallback', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'hamming',
      overlap: 0.5,
      hopSize: 128,
      fftSize: 256,
    });
    useUiStore.getState().setDspFftAnalysisParams(null);
    const s = useUiStore.getState();
    expect(s.dspFftWindow).toBeNull();
    expect(s.dspFftOverlap).toBeNull();
    expect(s.dspFftHopSize).toBeNull();
    expect(s.dspFftSizeActive).toBeNull();
  });

  it('clamps overlap into [0, 1)', () => {
    useUiStore.getState().setDspFftAnalysisParams({
      window: 'rectangular',
      overlap: 1.5,
      hopSize: 1,
      fftSize: 64,
    });
    expect(useUiStore.getState().dspFftOverlap).toBeLessThan(1);
    expect(useUiStore.getState().dspFftOverlap).toBeGreaterThanOrEqual(0);
  });
});
