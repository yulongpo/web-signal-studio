import { describe, expect, it } from 'vitest';
import {
  computeNarrowbandBitstreamDemod,
  computeNarrowbandEyeDiagram,
  computeNarrowbandRecognition,
  NARROWBAND_BITSTREAM_BLOCKED,
  NARROWBAND_EYE_BLOCKED,
  NARROWBAND_RECOGNITION_BLOCKED,
} from './narrowbandPageDspContracts';

const tuning = {
  loOffsetHz: 0,
  interpolation: 1,
  decimation: 16,
  sampleBegin: 0n,
  sampleEnd: 1024n,
};

const source = {
  sourceLabel: 'sigmf_data_demo',
  kind: 'sigmf_data_demo' as const,
};

describe('narrowbandPageDspContracts BLOCKED stubs', () => {
  it('eye diagram always BLOCKED', () => {
    const r = computeNarrowbandEyeDiagram({ tuning, source });
    expect(r.status).toBe('BLOCKED');
    expect(r.reasonCode).toBe(NARROWBAND_EYE_BLOCKED.reasonCode);
  });

  it('recognition always BLOCKED with empty labels', () => {
    const r = computeNarrowbandRecognition({ tuning, source });
    expect(r.status).toBe('BLOCKED');
    expect(r.labels).toEqual([]);
    expect(r.reasonCode).toBe(NARROWBAND_RECOGNITION_BLOCKED.reasonCode);
  });

  it('bitstream always BLOCKED with empty bits', () => {
    const r = computeNarrowbandBitstreamDemod({ tuning, source });
    expect(r.status).toBe('BLOCKED');
    expect(r.bits.byteLength).toBe(0);
    expect(r.reasonCode).toBe(NARROWBAND_BITSTREAM_BLOCKED.reasonCode);
  });
});
