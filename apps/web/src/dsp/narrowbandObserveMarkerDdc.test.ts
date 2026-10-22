/**
 * P0#7: broadband active mark/channel → Observe DDC drive (desktop parity).
 * Pure resolve + stamp; no Multitaper/Burg; no cascaded FirDecimator invention.
 */
import { describe, expect, it } from 'vitest';
import {
  channelRfCenterBandwidth,
  desktopOutputSampleRateHz,
  markRfCenterBandwidth,
  rationalResampleForOutputRate,
  resolveBroadbandDrive,
  resolveObserveDdcDrive,
} from './narrowbandObserveMarkerDdc';

describe('P0#7 desktop output rate / rational map', () => {
  it('mirrors annotationChannelRequest: min(fs, max(4e6, bw*1.3))', () => {
    expect(desktopOutputSampleRateHz(20e6, 1e6)).toBe(4e6);
    expect(desktopOutputSampleRateHz(20e6, 5e6)).toBe(6.5e6);
    expect(desktopOutputSampleRateHz(2e6, 1e6)).toBe(2e6);
  });

  it('maps output rate to single-stage rational (no cascade)', () => {
    expect(rationalResampleForOutputRate(20e6, 4e6)).toEqual({
      interpolation: 1,
      decimation: 5,
    });
    expect(rationalResampleForOutputRate(20e6, 20e6)).toEqual({
      interpolation: 1,
      decimation: 1,
    });
  });
});

describe('P0#7 mark/channel RF extract', () => {
  it('reads mark lower/upper Hz', () => {
    expect(
      markRfCenterBandwidth({
        id: 'm1',
        lowerHz: 990e6,
        upperHz: 1010e6,
      }),
    ).toEqual({ centerFrequencyHz: 1e9, bandwidthHz: 20e6 });
  });

  it('reads channel fields or snapshot range', () => {
    expect(
      channelRfCenterBandwidth({
        id: 'ch1',
        centerFrequencyHz: 1.001e9,
        bandwidthHz: 2e6,
        outputSampleRateHz: 4e6,
      })?.centerFrequencyHz,
    ).toBe(1.001e9);

    const fromSnap = channelRfCenterBandwidth({
      id: 'ch2',
      sourceSnapshot: {
        range: {
          time: { begin: '100', end: '5000' },
          frequency: { lowerHz: 100e6, upperHz: 120e6 },
        },
      },
    });
    expect(fromSnap).toMatchObject({
      centerFrequencyHz: 110e6,
      bandwidthHz: 20e6,
    });
    expect(fromSnap?.sampleBegin).toBe(100n);
    expect(fromSnap?.sampleEnd).toBe(5000n);
  });
});

describe('P0#7 resolveBroadbandDrive preference', () => {
  const marks = [
    {
      id: 'm-active',
      name: 'tone',
      lowerHz: 1.01e9,
      upperHz: 1.03e9,
      start: '0',
      end: '8192',
    },
  ];
  const channels = [
    {
      id: 'ch-active',
      name: 'from-mark',
      sourceMarkId: 'm-active',
      centerFrequencyHz: 1.02e9,
      bandwidthHz: 20e6,
      outputSampleRateHz: 4e6,
    },
  ];

  it('prefers active channel over mark (desktop Session.activeChannel)', () => {
    const d = resolveBroadbandDrive({
      sampleRateHz: 20e6,
      activeChannelId: 'ch-active',
      channels,
      activeMarkId: 'm-active',
      marks,
    });
    expect(d?.kind).toBe('channel');
    expect(d?.id).toBe('ch-active');
    expect(d?.centerFrequencyHz).toBe(1.02e9);
    expect(d?.bandwidthHz).toBe(20e6);
    expect(d?.outputSampleRateHz).toBe(4e6);
  });

  it('falls back to active mark when no channel', () => {
    const d = resolveBroadbandDrive({
      sampleRateHz: 20e6,
      activeChannelId: null,
      channels: [],
      activeMarkId: 'm-active',
      marks,
    });
    expect(d?.kind).toBe('mark');
    expect(d?.id).toBe('m-active');
    expect(d?.centerFrequencyHz).toBe(1.02e9);
    expect(d?.bandwidthHz).toBe(20e6);
    // bw=20e6 → max(4e6, 26e6)=26e6 → min(20e6,26e6)=20e6
    expect(d?.outputSampleRateHz).toBe(20e6);
    expect(d?.sampleBegin).toBe(0n);
    expect(d?.sampleEnd).toBe(8192n);
  });

  it('returns null when neither yields RF box', () => {
    expect(
      resolveBroadbandDrive({
        sampleRateHz: 20e6,
        activeMarkId: 'missing',
        marks: [{ id: 'x', lowerHz: 1, upperHz: 1 }],
      }),
    ).toBeNull();
  });
});

describe('P0#7 resolveObserveDdcDrive LO + honest stamp', () => {
  it('LO = channelCenterRf - sourceFc (web mix-to-DC convention)', () => {
    const r = resolveObserveDdcDrive({
      sourceCenterFrequencyHz: 1e9,
      sampleRateHz: 20e6,
      drive: {
        kind: 'mark',
        id: 'm1',
        centerFrequencyHz: 1.005e9,
        bandwidthHz: 1e6,
        outputSampleRateHz: 4e6,
      },
    });
    expect(r.loOffsetHz).toBe(5e6);
    expect(r.interpolation).toBe(1);
    expect(r.decimation).toBe(5);
    expect(r.ddcKindAttr).toBe('real-marker');
    expect(r.statusStamp).toContain('真实 DDC');
    expect(r.statusStamp).toContain('标记 m1');
    expect(r.pipelineLabel).toContain('真实 DDC');
    expect(r.pipelineLabel).toContain('no Multitaper/Burg');
    expect(r.pipelineLabel).not.toContain('Bluestein');
  });

  it('demo-annotation fallback still stamps 真实 DDC (honest, not fake IQ)', () => {
    const r = resolveObserveDdcDrive({
      sourceCenterFrequencyHz: 1e9,
      sampleRateHz: 20e6,
      drive: null,
      fallbackLoOffsetHz: 12345,
      fallbackDecimation: 16,
      fallbackInterpolation: 1,
    });
    expect(r.kind).toBe('demo-annotation');
    expect(r.loOffsetHz).toBe(12345);
    expect(r.ddcKindAttr).toBe('real-demo-annotation');
    expect(r.statusStamp).toContain('真实 DDC');
    expect(r.statusStamp).toContain('演示标注');
  });
});