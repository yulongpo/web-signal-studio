import { describe, expect, it } from 'vitest';
import {
  ANNOTATIONS_EXPORT_SCHEMA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
  type AnnotationJson,
  type AnnotationsDocumentJson,
  type ProjectDocumentJson,
} from '@wss/contracts';
import {
  UndoStack,
  HistoryStack,
  makeAddAnnotationCommand,
  makeRemoveAnnotationCommand,
  makeReplaceAnnotationCommand,
  makeSetAnnotationDeletedCommand,
  makeSetFileViewRangeCommand,
  makeSetActiveSelectionCommand,
  isAnnotationSourceKind,
  assertAnnotationSourceKind,
  makeSampleRange,
  sampleRangeLength,
} from './index.js';

function emptyAnnotations(fileId = 'file-1'): AnnotationsDocumentJson {
  return {
    schema: ANNOTATIONS_EXPORT_SCHEMA,
    fileId,
    sourceSets: [],
    annotations: [],
  };
}

function mark(
  id: string,
  sourceKind: AnnotationJson['sourceKind'],
  start = '0',
  end = '100',
): AnnotationJson {
  return {
    id,
    name: id,
    sourceKind,
    start,
    end,
    lowerHz: 0,
    upperHz: 1e6,
  };
}

function emptyProject(): ProjectDocumentJson {
  return {
    schema: PROJECT_SCHEMA,
    version: PROJECT_WRITE_VERSION,
    name: 'demo',
    files: [
      {
        metadata: {
          id: 'file-1',
          name: 'a.iq',
          path: 'a.iq',
          sampleRateHz: 1e6,
          centerFrequencyHz: 1e9,
          sampleCount: '1000000000000',
        },
      },
    ],
  };
}

describe('UndoStack', () => {
  it('push / undo / redo preserves order', () => {
    const values: number[] = [];
    const stack = new UndoStack();

    stack.push({
      id: 'a',
      label: 'A',
      redo: () => {
        values.push(1);
      },
      undo: () => {
        values.pop();
      },
    });
    stack.push({
      id: 'b',
      label: 'B',
      redo: () => {
        values.push(2);
      },
      undo: () => {
        values.pop();
      },
    });

    expect(values).toEqual([1, 2]);
    expect(stack.canUndo).toBe(true);
    expect(stack.undoLabel).toBe('B');

    stack.undo();
    expect(values).toEqual([1]);
    expect(stack.redoLabel).toBe('B');

    stack.undo();
    expect(values).toEqual([]);
    expect(stack.canUndo).toBe(false);

    stack.redo();
    expect(values).toEqual([1]);
    stack.redo();
    expect(values).toEqual([1, 2]);
    expect(stack.canRedo).toBe(false);
  });

  it('clears redo after a new push', () => {
    const values: string[] = [];
    const stack = new UndoStack();
    stack.push({
      id: '1',
      label: 'one',
      redo: () => values.push('one'),
      undo: () => values.pop(),
    });
    stack.push({
      id: '2',
      label: 'two',
      redo: () => values.push('two'),
      undo: () => values.pop(),
    });
    stack.undo();
    expect(stack.canRedo).toBe(true);
    stack.push({
      id: '3',
      label: 'three',
      redo: () => values.push('three'),
      undo: () => values.pop(),
    });
    expect(stack.canRedo).toBe(false);
    expect(values).toEqual(['one', 'three']);
  });

  it('evicts oldest entries when over limit', () => {
    const applied: number[] = [];
    const stack = new UndoStack({ limit: 2 });
    for (const n of [1, 2, 3]) {
      stack.push({
        id: String(n),
        label: String(n),
        redo: () => applied.push(n),
        undo: () => applied.pop(),
      });
    }
    expect(stack.undoDepth).toBe(2);
    // undoing twice only reverses 3 then 2; 1 was evicted from history
    stack.undo();
    stack.undo();
    expect(stack.canUndo).toBe(false);
    expect(applied).toEqual([1]);
  });

  it('HistoryStack alias works', () => {
    const stack = new HistoryStack({ limit: 5 });
    expect(stack.canUndo).toBe(false);
    stack.pushAlreadyApplied({
      id: 'x',
      label: 'x',
      redo: () => undefined,
      undo: () => undefined,
    });
    expect(stack.canUndo).toBe(true);
    stack.clear();
    expect(stack.canUndo).toBe(false);
  });
});

describe('annotation undo commands + three-source', () => {
  it('accepts ImportedLabel | Manual | Algorithm', () => {
    expect(isAnnotationSourceKind('ImportedLabel')).toBe(true);
    expect(isAnnotationSourceKind('Manual')).toBe(true);
    expect(isAnnotationSourceKind('Algorithm')).toBe(true);
    expect(isAnnotationSourceKind('manual')).toBe(false);
    expect(assertAnnotationSourceKind('Algorithm')).toBe('Algorithm');
  });

  it('add / remove / replace / deleted round-trip', () => {
    const doc = emptyAnnotations();
    const stack = new UndoStack();

    stack.push(makeAddAnnotationCommand(doc, mark('m1', 'Manual')));
    stack.push(makeAddAnnotationCommand(doc, mark('m2', 'Algorithm', '10', '20')));
    stack.push(makeAddAnnotationCommand(doc, mark('m3', 'ImportedLabel', '100', '200')));
    expect(doc.annotations.map((a) => a.sourceKind)).toEqual([
      'Manual',
      'Algorithm',
      'ImportedLabel',
    ]);

    stack.push(
      makeReplaceAnnotationCommand(doc, {
        ...mark('m1', 'Manual', '5', '50'),
        name: 'renamed',
      }),
    );
    expect(doc.annotations.find((a) => a.id === 'm1')?.name).toBe('renamed');

    stack.push(makeSetAnnotationDeletedCommand(doc, 'm2', true));
    expect(doc.annotations.find((a) => a.id === 'm2')?.deleted).toBe(true);

    stack.push(makeRemoveAnnotationCommand(doc, 'm3'));
    expect(doc.annotations.some((a) => a.id === 'm3')).toBe(false);

    // undo remove → restore ImportedLabel
    stack.undo();
    expect(doc.annotations.find((a) => a.id === 'm3')?.sourceKind).toBe('ImportedLabel');

    // undo deleted flag
    stack.undo();
    expect(doc.annotations.find((a) => a.id === 'm2')?.deleted).toBe(false);

    // undo replace
    stack.undo();
    expect(doc.annotations.find((a) => a.id === 'm1')?.name).toBe('m1');
  });
});

describe('project view / selection commands', () => {
  it('set view range preserves bigint-safe decimal strings', () => {
    const project = emptyProject();
    const stack = new UndoStack();
    const hugeBegin = '9007199254740993'; // > MAX_SAFE_INTEGER
    const hugeEnd = '9007199254741093';

    stack.push(
      makeSetFileViewRangeCommand(project, 'file-1', {
        time: { begin: hugeBegin, end: hugeEnd },
        frequency: { lowerHz: 1e6, upperHz: 2e6 },
      }),
    );

    expect(project.files[0]!.view?.time.begin).toBe(hugeBegin);
    expect(project.files[0]!.view?.time.end).toBe(hugeEnd);

    // domain sample-range still uses bigint
    const range = makeSampleRange(
      sampleIndexFromDecimal(hugeBegin),
      sampleIndexFromDecimal(hugeEnd),
    );
    expect(sampleIndexToDecimal(sampleRangeLength(range))).toBe('100');

    stack.undo();
    expect(project.files[0]!.view).toBeUndefined();

    stack.redo();
    expect(project.files[0]!.view?.time.begin).toBe(hugeBegin);
  });

  it('set active selection + mark ids', () => {
    const project = emptyProject();
    const stack = new UndoStack();
    stack.push(
      makeSetActiveSelectionCommand(
        project,
        {
          activeFileId: 'file-1',
          activeChannelId: 'ch-1',
          selectedMarkIds: ['m1', 'm2'],
          activeMarkId: 'm1',
        },
        { fileIdForMarks: 'file-1' },
      ),
    );
    expect(project.activeFileId).toBe('file-1');
    expect(project.files[0]!.activeMarkId).toBe('m1');
    expect(project.files[0]!.selectedMarkIds).toEqual(['m1', 'm2']);

    stack.undo();
    expect(project.activeFileId).toBeUndefined();
    expect(project.files[0]!.activeMarkId).toBeUndefined();
  });
});
