import { describe, expect, it } from 'vitest';
import {
  ANNOTATIONS_EXPORT_SCHEMA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
} from '@wss/contracts';
import {
  decodeChannelSnapshotJson,
  encodeChannelSnapshotJson,
  makeLocatedSegmentSnapshot,
  parseAnnotationsJson,
  parseProjectJson,
  serializeAnnotationsJson,
  serializeProjectJson,
} from './index.js';

describe('project-io skeleton', () => {
  it('round-trips a minimal v6 project with decimal sampleCount past 2^53', () => {
    const sampleCount = ((1n << 53n) + 99n).toString(10);
    const json = serializeProjectJson({
      schema: PROJECT_SCHEMA,
      version: PROJECT_WRITE_VERSION,
      name: 'demo',
      activeFileId: 'file-1',
      files: [
        {
          metadata: {
            id: 'file-1',
            name: 'demo.iq',
            path: 'demo.iq',
            sampleRateHz: 20e6,
            centerFrequencyHz: 1e9,
            sampleCount,
          },
          view: {
            time: { begin: '0', end: sampleCount },
            frequency: { lowerHz: 9.9e8, upperHz: 1.01e9 },
          },
        },
      ],
    });
    const loaded = parseProjectJson(json);
    expect(loaded.version).toBe(6);
    expect(loaded.document.schema).toBe(PROJECT_SCHEMA);
    expect(loaded.document.files[0]?.metadata.sampleCount).toBe(sampleCount);
    expect(typeof loaded.document.files[0]?.metadata.sampleCount).toBe('string');
  });

  it('rejects wrong schema / version', () => {
    expect(() =>
      parseProjectJson(JSON.stringify({ schema: 'other', version: 6, name: 'x', files: [] })),
    ).toThrow(/schema/);
    expect(() =>
      parseProjectJson(
        JSON.stringify({ schema: PROJECT_SCHEMA, version: 7, name: 'x', files: [] }),
      ),
    ).toThrow(/version/);
  });

  it('round-trips annotations export + three sourceKind values', () => {
    const doc = {
      schema: ANNOTATIONS_EXPORT_SCHEMA,
      fileId: 'file-1',
      sourceSets: [
        { id: 'ss-1', fileId: 'file-1', sourceKind: 'ImportedLabel' as const },
        { id: 'ss-2', fileId: 'file-1', sourceKind: 'Manual' as const },
        { id: 'ss-3', fileId: 'file-1', sourceKind: 'Algorithm' as const },
      ],
      annotations: [
        {
          id: 'a-1',
          name: 'mark',
          sourceKind: 'Manual' as const,
          start: '100',
          end: '200',
          lowerHz: 1e6,
          upperHz: 2e6,
        },
      ],
    };
    const text = serializeAnnotationsJson(doc);
    const parsed = parseAnnotationsJson(text);
    expect(parsed.sourceSets.map((s) => s.sourceKind)).toEqual([
      'ImportedLabel',
      'Manual',
      'Algorithm',
    ]);
    expect(parsed.annotations[0]?.start).toBe('100');
  });

  it('requires boundRange on v6 channel snapshots', () => {
    const snap = makeLocatedSegmentSnapshot({
      annotationId: 'a1',
      segmentId: 's1',
      revisionId: 'r1',
      name: 'ch',
      begin: 10n,
      end: 20n,
      lowerHz: 100,
      upperHz: 200,
      fileId: 'file-1',
      sourceKind: 'Algorithm',
    });
    const json = encodeChannelSnapshotJson(snap);
    expect(json.boundRange.time.begin).toBe('10');
    expect(json.bindingKind).toBe('LocatedSegment');
    const decoded = decodeChannelSnapshotJson(json, 6);
    expect(decoded.boundRange.time.end).toBe(20n);

    const { boundRange: _drop, ...withoutBound } = json;
    expect(() => decodeChannelSnapshotJson(withoutBound as typeof json, 6)).toThrow(/boundRange/);
  });
});
