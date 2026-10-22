import { describe, expect, it } from 'vitest';
import {
  ANNOTATIONS_EXPORT_SCHEMA,
  ANNOTATION_SOURCE_KINDS,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  type AnnotationsDocumentJson,
  type ProjectDocumentJson,
} from '@wss/contracts';
import {
  ANNOTATION_SOURCE_TREE_COLORS,
  CHANNEL_SOURCE_RELATION_DETAILS,
  channelRelationDetail,
  engineeringTreeFromSession,
  listMarkNodes,
  normalizeChannelSourceRelation,
} from './engineering-tree.js';

function demoProject(): ProjectDocumentJson {
  return {
    schema: PROJECT_SCHEMA,
    version: PROJECT_WRITE_VERSION,
    name: 'g19-tree',
    activeFileId: 'file-1',
    files: [
      {
        metadata: {
          id: 'file-1',
          name: 'demo.sigmf',
          path: 'demo.sigmf-meta',
          sampleRateHz: 20e6,
          centerFrequencyHz: 2.5e9,
          sampleCount: '400000',
        },
        activeMarkId: 'm-manual',
        selectedMarkIds: ['m-manual', 'm-algo'],
        channels: [
          {
            id: 'ch-1',
            name: 'NB-1',
            sourceRelation: 'Changed',
            processingState: 'ready',
            centerFrequencyHz: 2.45e9,
            bandwidthHz: 2e6,
            outputSampleRateHz: 5e6,
            sourceTime: { begin: '0', end: '500000' },
            sourceSnapshot: { revisionId: 'rev-create-1' },
          },
        ],
        detectionRuns: ['run-alpha', 'run-beta'],
        view: { time: { begin: '0', end: '500000' } },
      },
    ],
  };
}

function demoAnnotations(): AnnotationsDocumentJson {
  return {
    schema: ANNOTATIONS_EXPORT_SCHEMA,
    fileId: 'file-1',
    sourceSets: ANNOTATION_SOURCE_KINDS.map((k, i) => ({
      id: `ss-${i}`,
      fileId: 'file-1',
      sourceKind: k,
    })),
    annotations: [
      {
        id: 'm-imp',
        name: 'import-a',
        sourceKind: 'ImportedLabel',
        start: '10',
        end: '20',
        lowerHz: 1e6,
        upperHz: 2e6,
      },
      {
        id: 'm-manual',
        name: 'manual-a',
        sourceKind: 'Manual',
        start: '100',
        end: '200',
      },
      {
        id: 'm-algo',
        name: 'algo-a',
        sourceKind: 'Algorithm',
        start: '1000',
        end: '2000',
      },
      {
        id: 'm-soft',
        name: 'soft-del',
        sourceKind: 'Manual',
        start: '1',
        end: '2',
        deleted: true,
      },
    ],
  };
}

describe('G19 engineering tree three-source marks (desktop c1f2cce / 17471a6)', () => {
  it('groups marks under ImportedLabel / Manual / Algorithm with presentation fields', () => {
    const tree = engineeringTreeFromSession(demoProject(), {
      annotations: demoAnnotations(),
      includeEmptySourceGroups: true,
    });
    expect(tree[0]?.kind).toBe('project');
    const file = tree[0]?.children?.[0]?.children?.[0];
    expect(file?.kind).toBe('file');
    expect(file?.active).toBe(true);
    expect(file?.detail).toMatch(/Fc /);
    expect(file?.detail).toMatch(/Fs /);
    expect(file?.detail).toMatch(/S\/s/);

    const marks = file?.children?.find((c) => c.kind === 'marks');
    expect(marks).toBeDefined();
    expect(marks?.count).toBe(3); // soft-deleted excluded from live count
    const sources = marks?.children ?? [];
    expect(sources.map((s) => s.sourceKind)).toEqual([...ANNOTATION_SOURCE_KINDS]);
    expect(sources.every((s) => s.kind === 'annotationSource')).toBe(true);
    expect(sources[0]?.color).toBe(ANNOTATION_SOURCE_TREE_COLORS.ImportedLabel);

    const markNodes = listMarkNodes(tree);
    expect(markNodes).toHaveLength(4);
    const manual = markNodes.find((m) => m.markId === 'm-manual');
    expect(manual?.active).toBe(true);
    expect(manual?.selected).toBe(true);
    expect(manual?.sourceKind).toBe('Manual');
    const soft = markNodes.find((m) => m.markId === 'm-soft');
    expect(soft?.softDeleted).toBe(true);
    expect(soft?.badges).toContain('deleted');

    const channels = file?.children?.find((c) => c.kind === 'channels');
    expect(channels?.children?.[0]?.badges).toContain('diff');

    expect(file?.title).toBe('demo.sigmf');
    expect(file?.tooltip).toContain('demo.sigmf-meta');
    expect(file?.badges).toContain('unread');

    const channel = channels?.children?.[0];
    expect(channel?.title).toBe('NB-1');
    expect(channel?.detail).toMatch(/Fc /);
    expect(channel?.detail).toMatch(/BW /);
    expect(channel?.detail).not.toMatch(/来源已修改/);
    expect(channel?.tooltip).toMatch(/来源已修改/);
    expect(channel?.tooltip).toMatch(/创建修订 rev-create-1/);
    expect(channel?.sourceTooltip).toBe(CHANNEL_SOURCE_RELATION_DETAILS.Changed);
    expect(channel?.badges).toContain('unread');

    const runs = file?.children?.find((c) => c.kind === 'detectionRuns');
    expect(runs?.count).toBe(2);
    expect(runs?.children?.[0]?.label).toBe('run-alpha');

    expect(manual?.title).toBe('manual-a');
    expect(manual?.tooltip).toContain('手动标记');
    expect(channels?.title).toBe('窄带通道');
    expect(marks?.children?.[0]?.title).toBe('原始标签');
    expect(marks?.children?.[1]?.title).toBe('手动标记');
    expect(marks?.children?.[2]?.title).toBe('算法结果');
  });

  it('keeps project-only tree without mark branches when annotations omitted', () => {
    const tree = engineeringTreeFromSession(demoProject(), {
      includeEmptySourceGroups: false,
    });
    const file = tree[0]?.children?.[0]?.children?.[0];
    expect(file?.children?.some((c) => c.kind === 'marks')).toBe(false);
    expect(file?.children?.some((c) => c.kind === 'channels')).toBe(true);
  });
});

describe('G19 channel source relation helpers (desktop c1f2cce)', () => {
  it('normalizes relation codes and details', () => {
    expect(normalizeChannelSourceRelation('Changed')).toBe('Changed');
    expect(normalizeChannelSourceRelation('legacy_needs_review')).toBe('LegacyNeedsReview');
    expect(channelRelationDetail('Missing')).toBe(CHANNEL_SOURCE_RELATION_DETAILS.Missing);
    expect(channelRelationDetail('nope')).toBeUndefined();
  });
});
