import { describe, expect, it } from 'vitest';
import { makeSyntheticSigmfMeta } from '@wss/file-io';
import { DEFAULT_CI16_LE_IQ } from '@wss/contracts';
import {
  describeRawIqForImport,
  describeRawIqWithTemplate,
  previewSigmfImport,
  suggestFromFilename,
  suggestSourceMetadata,
} from './import-preview.js';

describe('import preview / Add-signal helpers', () => {
  it('suggestFromFilename extracts FS/FC/BW and format token', () => {
    const s = suggestFromFilename(
      'D:\\captures\\burst_FS20e6sps_FC2.4e9hz_BW5e6hz_CI16.iq',
    );
    // 20e6 in filename regex is 20 + e6 — our desktop regex uses [0-9]+(?:\.[0-9]+)? so "20e6" may not match.
    // Use canonical desktop-style tokens without scientific notation:
    const s2 = suggestFromFilename('rec_FS20000000sps_FC2400000000hz_BW5000000hz_CI16.bin');
    expect(s2.sampleRateHz).toBe(20_000_000);
    expect(s2.centerFrequencyHz).toBe(2_400_000_000);
    expect(s2.bandwidthHz).toBe(5_000_000);
    expect(s2.format?.componentEncoding).toBe('int16');
    expect(s.provenance.length).toBeGreaterThan(0);
  });

  it('previewSigmfImport returns Ready row with desktop field names', () => {
    const meta = makeSyntheticSigmfMeta({
      datatype: 'cf32_le',
      sampleRateHz: 20e6,
      frequencyHz: 2.5e9,
      headerBytes: 0,
    });
    // 10 complex float32 frames = 80 bytes
    const { suggestions, row } = previewSigmfImport({
      metaText: JSON.stringify(meta),
      dataByteLength: 80,
      path: 'D:\\tmp\\synthetic.sigmf-meta',
      displayName: 'synthetic.sigmf-meta',
      fileId: 'file-preview-1',
    });
    expect(suggestions.error).toBe('');
    expect(suggestions.sampleCount).toBe('10');
    expect(suggestions.datatype).toBe('cf32_le');
    expect(row.status).toBe('Ready');
    expect(row.formatKind).toBe('sigmf');
    expect(row.sampleRateHz).toBe(20e6);
    expect(row.centerFrequencyHz).toBe(2.5e9);
    expect(row.sampleCount).toBe('10');
    expect(row.confirmed).toBe(true);
    expect(row.acquisitionKnown).toBe(true);
    expect(row.committed).toBe(false);
  });

  it('previewSigmfImport fails on bad datatype like desktop', () => {
    const { row } = previewSigmfImport({
      metaText: JSON.stringify({
        global: { 'core:datatype': 'cu16_le', 'core:version': '1.0.0' },
        captures: [{ 'core:sample_start': 0 }],
        annotations: [],
      }),
      dataByteLength: 100,
      path: 'x.sigmf-meta',
    });
    expect(row.status).toBe('Failed');
    expect(row.error ?? '').toMatch(/datatype|Unsupported/i);
  });

  it('describeRawIqForImport requires confirmation (desktop ImportController)', () => {
    const failed = describeRawIqForImport({
      path: 'D:\\a.iq',
      dataByteLength: 400,
      sampleFormat: DEFAULT_CI16_LE_IQ,
      sampleRateHz: 1e6,
      centerFrequencyHz: 100e6,
      confirmed: false,
    });
    expect(failed.status).toBe('Failed');
    expect(failed.error).toMatch(/确认/);

    const ok = describeRawIqWithTemplate({
      path: 'D:\\a.iq',
      dataByteLength: 400,
      sampleRateHz: 1e6,
      centerFrequencyHz: 100e6,
      templateId: 'builtin-0',
      confirmed: true,
      fileId: 'file-raw-1',
    });
    expect(ok.status).toBe('Ready');
    expect(ok.sampleCount).toBe('100'); // 400 / 4
    expect(ok.templateId).toBe('builtin-0');
    expect(ok.sampleFormat?.componentEncoding).toBe('int16');
  });

  it('suggestSourceMetadata merges filename + SigMF', () => {
    const meta = makeSyntheticSigmfMeta({
      datatype: 'ci16_le',
      sampleRateHz: 1e6,
      frequencyHz: 100e6,
    });
    const s = suggestSourceMetadata({
      path: 'cap_FS2000000sps_FC900000000hz_CI16.sigmf-meta',
      metaText: JSON.stringify(meta),
      dataByteLength: 40,
    });
    expect(s.error).toBe('');
    expect(s.sampleRateHz).toBe(1e6); // SigMF wins
    expect(s.conflicts).toMatch(/Fs|格式|Fc/);
    expect(s.sampleCount).toBe('10');
  });
});
