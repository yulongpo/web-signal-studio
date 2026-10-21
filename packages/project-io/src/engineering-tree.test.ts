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
  engineeringTreeFromSession,
  listMarkNodes,
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
          },
        ],
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
    expect(file?.detail).toMatch(/S\/s/);
    expect(file?.detail).toMatch(/400000 samples/);

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
