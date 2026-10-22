import { describe, expect, it } from 'vitest';
import {
  deriveNavEnvelope,
  derivePsdInWindow,
  deriveWaveInWindow,
  type SpectrogramDisplaySource,
} from './chartDisplayDerive';

function makeSrc(): SpectrogramDisplaySource {
  const binCount = 8;
  const frameCount = 10;
  const power = new Float32Array(binCount * frameCount);
  for (let t = 0; t < frameCount; t++) {
    for (let f = 0; f < binCount; f++) {
      power[t * binCount + f] = (t + 1) * (f === 3 ? 10 : 1);
    }
  }
  return {
    power,
    binCount,
    frameCount,
    freqHz: { min: -4, max: 4 },
    timeSec: { min: 0, max: 1 },
  };
}

describe('chartDisplayDerive', () => {
  it('nav envelope peaks track time', () => {
    const env = deriveNavEnvelope(makeSrc());
    expect(env).toHaveLength(10);
    expect(env[9]!).toBeGreaterThan(env[0]!);
  });

  it('wave series follows window length', () => {
    const { y, xDomain } = deriveWaveInWindow(makeSrc(), { min: 0.2, max: 0.6 });
    expect(y.length).toBeGreaterThan(1);
    expect(xDomain.min).toBeCloseTo(0.2);
    expect(xDomain.label).toBe('源文件时间 (s)');
  });

  it('psd Y is frequency-labeled dB curve', () => {
    const { y, xDomain } = derivePsdInWindow(makeSrc(), { min: 0, max: 1 });
    expect(y).toHaveLength(8);
    expect(xDomain.unit).toBe('Hz');
    expect(y[3]!).toBeGreaterThan(y[0]!);
  });
});
