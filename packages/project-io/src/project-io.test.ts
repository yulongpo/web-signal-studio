import { describe, expect, it } from 'vitest';
import {
  ANNOTATIONS_EXPORT_SCHEMA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  SAMPLE_INDEX_MAX,
  sampleIndexToDecimal,
} from '@wss/contracts';
import {
  attachChannelSnapshot,
  decodeChannelSnapshotJson,
  encodeChannelSnapshotJson,
  makeLocatedSegmentSnapshot,
  openAnnotationsFromJsonText,
  openProjectFromJsonText,
  parseAnnotationsJson,
  parseProjectJson,
  readChannelSnapshot,
  saveAnnotationsToJsonText,
  saveProjectToJsonText,
  serializeAnnotationsJson,
  serializeProjectJson,
  summarizeLoadedProject,
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

describe('channel snapshot persistence on project channels', () => {
  it('attach serialize parse keeps decimal snapshot ranges and related ids', () => {
    const begin = (1n << 53n) + 42n;
    const end = SAMPLE_INDEX_MAX;
    const snap = makeLocatedSegmentSnapshot({
      annotationId: 'ann-1',
      segmentId: 'seg-1',
      revisionId: 'rev-1',
      name: 'NB-1',
      begin,
      end,
      lowerHz: 1e6,
      upperHz: 2e6,
      fileId: 'file-1',
      sourceKind: 'ImportedLabel',
      reviewStatus: 'Pending',
    });

    const channel = attachChannelSnapshot({ id: 'ch-1', name: 'channel-1' }, snap);
    expect(channel.annotationId).toBe('ann-1');
    expect(channel.segmentId).toBe('seg-1');
    expect(channel.revisionId).toBe('rev-1');

    const text = serializeProjectJson({
      schema: PROJECT_SCHEMA,
      version: PROJECT_WRITE_VERSION,
      name: 'with-snapshot',
      files: [
        {
          metadata: {
            id: 'file-1',
            name: 'big.iq',
            path: 'big.iq',
            sampleRateHz: 1e6,
            centerFrequencyHz: 1e9,
            sampleCount: sampleIndexToDecimal(end),
          },
          view: {
            time: { begin: '0', end: sampleIndexToDecimal(end) },
            frequency: { lowerHz: 0, upperHz: 5e5 },
          },
          channels: [channel],
        },
      ],
    });

    const raw = JSON.parse(text) as {
      files: Array<{
        metadata: { sampleCount: unknown };
        view: { time: { begin: unknown; end: unknown } };
        channels: Array<{
          sourceSnapshot: {
            range: { time: { begin: unknown; end: unknown } };
            boundRange: { time: { begin: unknown; end: unknown } };
          };
          annotationId: string;
        }>;
      }>;
    };
    const f0 = raw.files[0]!;
    expect(typeof f0.metadata.sampleCount).toBe('string');
    expect(typeof f0.view.time.begin).toBe('string');
    expect(typeof f0.view.time.end).toBe('string');
    expect(f0.view.time.end).toBe(sampleIndexToDecimal(end));
    const snapWire = f0.channels[0]!.sourceSnapshot;
    expect(typeof snapWire.range.time.begin).toBe('string');
    expect(typeof snapWire.boundRange.time.end).toBe('string');
    expect(snapWire.range.time.begin).toBe(sampleIndexToDecimal(begin));
    expect(snapWire.boundRange.time.end).toBe(sampleIndexToDecimal(end));
    expect(f0.channels[0]!.annotationId).toBe('ann-1');

    const loaded = parseProjectJson(text);
    const loadedCh = loaded.document.files[0]!.channels![0]!;
    const decoded = readChannelSnapshot(loadedCh, loaded.version);
    expect(decoded).toBeDefined();
    expect(decoded!.range.time.begin).toBe(begin);
    expect(decoded!.boundRange.time.end).toBe(end);
    expect(decoded!.sourceKind).toBe('ImportedLabel');
    expect(decoded!.sourceIdentity.fileId).toBe('file-1');
  });

  it('pre-v6 decode falls back boundRange to range when missing', () => {
    const snap = makeLocatedSegmentSnapshot({
      annotationId: 'a',
      segmentId: 's',
      revisionId: 'r',
      name: 'n',
      begin: 1n,
      end: 2n,
      lowerHz: 0,
      upperHz: 1,
      fileId: 'f',
    });
    const json = encodeChannelSnapshotJson(snap);
    const { boundRange: _b, ...legacy } = json;
    const decoded = decodeChannelSnapshotJson(legacy as typeof json, 5);
    expect(decoded.boundRange.time.begin).toBe(1n);
    expect(decoded.boundRange.time.end).toBe(2n);
  });
});

describe('web open/save wiring contract', () => {
  it('openProjectFromJsonText / saveProjectToJsonText force v6 and summarize', () => {
    const sampleCount = ((1n << 53n) + 7n).toString(10);
    const text = saveProjectToJsonText({
      schema: PROJECT_SCHEMA,
      version: 4,
      name: 'session-demo',
      activeFileId: 'file-1',
      files: [
        {
          metadata: {
            id: 'file-1',
            name: 'a.iq',
            path: 'a.iq',
            sampleRateHz: 1e6,
            centerFrequencyHz: 100e6,
            sampleCount,
          },
        },
      ],
    });
    const opened = openProjectFromJsonText(text);
    expect(opened.version).toBe(6);
    expect(opened.document.version).toBe(6);
    const summary = summarizeLoadedProject(opened);
    expect(summary.name).toBe('session-demo');
    expect(summary.files[0]?.sampleCount).toBe(sampleCount);
    expect(typeof summary.files[0]?.sampleCount).toBe('string');
  });

  it('open/save annotations text via session helpers', () => {
    const text = saveAnnotationsToJsonText({
      schema: ANNOTATIONS_EXPORT_SCHEMA,
      fileId: 'file-1',
      sourceSets: [],
      annotations: [
        {
          id: 'a1',
          name: 'm',
          sourceKind: 'Manual',
          start: sampleIndexToDecimal((1n << 53n) + 1n),
          end: sampleIndexToDecimal((1n << 53n) + 9n),
        },
      ],
    });
    const doc = openAnnotationsFromJsonText(text);
    expect(doc.annotations[0]?.start).toBe('9007199254740993');
    expect(typeof doc.annotations[0]?.start).toBe('string');
  });
});

describe('project file BigInt JSON boundaries', () => {
  it('sampleCount / view / snapshot ranges stay string decimals after serialize-parse', () => {
    const pastBegin = (1n << 53n) + 99n;
    const past = sampleIndexToDecimal(pastBegin);
    const max = sampleIndexToDecimal(SAMPLE_INDEX_MAX);
    const snap = makeLocatedSegmentSnapshot({
      annotationId: 'a',
      segmentId: 's',
      revisionId: 'r',
      name: 'n',
      begin: pastBegin,
      end: SAMPLE_INDEX_MAX,
      lowerHz: 10,
      upperHz: 20,
      fileId: 'file-1',
    });

    const text = serializeProjectJson({
      schema: PROJECT_SCHEMA,
      version: 6,
      name: 'boundaries',
      files: [
        {
          metadata: {
            id: 'file-1',
            name: 'x.iq',
            path: 'x.iq',
            sampleRateHz: 1,
            centerFrequencyHz: 1,
            sampleCount: max,
          },
          view: {
            time: { begin: '0', end: past },
            frequency: { lowerHz: 0, upperHz: 1 },
          },
          channels: [attachChannelSnapshot({ id: 'c1', name: 'c1' }, snap)],
        },
      ],
    });

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const files = parsed.files as Array<Record<string, unknown>>;
    const meta = files[0]!.metadata as Record<string, unknown>;
    const view = files[0]!.view as { time: { begin: unknown; end: unknown } };
    const ch = (files[0]!.channels as Array<Record<string, unknown>>)[0]!;
    const ss = ch.sourceSnapshot as {
      range: { time: { begin: unknown; end: unknown } };
      boundRange: { time: { begin: unknown; end: unknown } };
    };

    expect(meta.sampleCount).toBe(max);
    expect(typeof meta.sampleCount).toBe('string');
    expect(view.time.begin).toBe('0');
    expect(view.time.end).toBe(past);
    expect(typeof view.time.end).toBe('string');
    expect(ss.range.time.begin).toBe(past);
    expect(ss.boundRange.time.end).toBe(max);
    expect(typeof ss.range.time.begin).toBe('string');
    expect(typeof ss.boundRange.time.end).toBe('string');

    // Prove bare numeric JSON would have lost the past-safe value
    const lost = JSON.parse(past) as number;
    expect(BigInt(Math.trunc(lost)).toString(10)).not.toBe(past);
  });
});