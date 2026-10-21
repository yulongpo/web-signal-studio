import { describe, expect, it } from 'vitest';
import {
  formatAdaptiveValue,
  formatDetectionPhysicalTimes,
  parseAdaptiveValue,
} from './adaptiveValue';

describe('parseAdaptiveValue / formatAdaptiveValue', () => {
  it('parses scalar and rejects stray units', () => {
    expect(parseAdaptiveValue('0.7', 'Scalar')).toBe(0.7);
    expect(parseAdaptiveValue('0.7 ms', 'Scalar')).toBeNull();
  });

  it('parses time with default ms and formats back', () => {
    expect(parseAdaptiveValue('5', 'Time')).toBeCloseTo(0.005);
    expect(parseAdaptiveValue('2 s', 'Time')).toBe(2);
    expect(formatAdaptiveValue(0.005, 'Time')).toBe('5 ms');
  });

  it('parses frequency prefixes', () => {
    expect(parseAdaptiveValue('100 kHz', 'Frequency')).toBe(1e5);
    expect(formatAdaptiveValue(1e6, 'Frequency')).toBe('1 MHz');
  });
});

describe('formatDetectionPhysicalTimes', () => {
  it('stays honest without Fs', () => {
    const r = formatDetectionPhysicalTimes({
      sampleRateHz: null,
      fftSize: 65536,
      hopMilliseconds: 1,
      modelFrames: 10,
      modelHopFrames: 5,
    });
    expect(r.hasFs).toBe(false);
    expect(r.summary).toContain('真实 IQ');
  });

  it('computes hop via floor(Fs*hop) when Fs present', () => {
    const r = formatDetectionPhysicalTimes({
      sampleRateHz: 1e6,
      fftSize: 1024,
      hopMilliseconds: 1,
      modelFrames: 10,
      modelHopFrames: 5,
    });
    expect(r.hasFs).toBe(true);
    expect(r.summary).toMatch(/ms/);
    expect(r.details).toContain('Fs=');
  });
});
