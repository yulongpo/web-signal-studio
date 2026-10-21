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
  makeChangeAnnotationSourceKindCommand,
  makeSetFileViewRangeCommand,
  makeSetActiveSelectionCommand,
  makeSetChannelSourceSnapshotCommand,
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
        channels: [{ id: 'ch-1', name: 'channel-1' }],
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

  it('undo/redo on empty stack are no-ops (no throw)', () => {
    const stack = new UndoStack();
    expect(stack.undo()).toBeUndefined();
    expect(stack.redo()).toBeUndefined();
    expect(stack.undoDepth).toBe(0);
    expect(stack.redoDepth).toBe(0);
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });

  it('clear() zeroes both depths', () => {
    const stack = new UndoStack();
    stack.push({
      id: '1',
      label: 'one',
      redo: () => undefined,
      undo: () => undefined,
    });
    stack.undo();
    expect(stack.undoDepth).toBe(0);
    expect(stack.redoDepth).toBe(1);
    stack.clear();
    expect(stack.undoDepth).toBe(0);
    expect(stack.redoDepth).toBe(0);
    expect(stack.canUndo).toBe(false);
    expect(stack.canRedo).toBe(false);
  });

  it('pushAlreadyApplied does not double-apply redo', () => {
    let count = 0;
    const stack = new UndoStack();
    const cmd = {
      id: 'live',
      label: 'already applied',
      redo: () => {
        count += 1;
      },
      undo: () => {
        count -= 1;
      },
    };
    // mutation already happened outside the stack
    count = 1;
    stack.pushAlreadyApplied(cmd);
    expect(count).toBe(1);
    expect(stack.undoDepth).toBe(1);
    stack.undo();
    expect(count).toBe(0);
    stack.redo();
    expect(count).toBe(1);
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

  it('rejects invalid / lowercase kinds on assert, add, and replace', () => {
    const doc = emptyAnnotations();
    expect(() => assertAnnotationSourceKind('manual')).toThrow(/Invalid AnnotationSourceKind/);
    expect(() => assertAnnotationSourceKind('importedlabel')).toThrow(/Invalid AnnotationSourceKind/);
    expect(() => assertAnnotationSourceKind('')).toThrow(/Invalid AnnotationSourceKind/);
    expect(() => assertAnnotationSourceKind(null)).toThrow(/Invalid AnnotationSourceKind/);

    expect(() =>
      makeAddAnnotationCommand(doc, {
        ...mark('bad', 'Manual'),
        sourceKind: 'manual' as AnnotationJson['sourceKind'],
      }),
    ).toThrow(/Invalid AnnotationSourceKind/);

    stackSeed(doc);
    expect(() =>
      makeReplaceAnnotationCommand(doc, {
        ...mark('m1', 'Manual'),
        sourceKind: 'algorithm' as AnnotationJson['sourceKind'],
      }),
    ).toThrow(/Invalid AnnotationSourceKind/);
    expect(() => makeChangeAnnotationSourceKindCommand(doc, 'm1', 'manual' as never)).toThrow(
      /Invalid AnnotationSourceKind/,
    );
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

    // undo remove — restore ImportedLabel
    stack.undo();
    expect(doc.annotations.find((a) => a.id === 'm3')?.sourceKind).toBe('ImportedLabel');

    // undo deleted flag
    stack.undo();
    expect(doc.annotations.find((a) => a.id === 'm2')?.deleted).toBe(false);

    // undo replace
    stack.undo();
    expect(doc.annotations.find((a) => a.id === 'm1')?.name).toBe('m1');
  });

  it('changeSourceKind cycles three kinds and undoes without losing decimals', () => {
    const doc = emptyAnnotations();
    const stack = new UndoStack();
    const hugeStart = '9007199254740993';
    const hugeEnd = '9007199254741093';
    stack.push(makeAddAnnotationCommand(doc, mark('m1', 'ImportedLabel', hugeStart, hugeEnd)));

    stack.push(makeChangeAnnotationSourceKindCommand(doc, 'm1', 'Manual'));
    expect(doc.annotations[0]?.sourceKind).toBe('Manual');
    expect(doc.annotations[0]?.start).toBe(hugeStart);
    expect(doc.annotations[0]?.end).toBe(hugeEnd);

    stack.push(makeChangeAnnotationSourceKindCommand(doc, 'm1', 'Algorithm'));
    expect(doc.annotations[0]?.sourceKind).toBe('Algorithm');
    expect(doc.annotations[0]?.start).toBe(hugeStart);

    stack.undo();
    expect(doc.annotations[0]?.sourceKind).toBe('Manual');
    expect(doc.annotations[0]?.start).toBe(hugeStart);
    expect(doc.annotations[0]?.end).toBe(hugeEnd);

    stack.undo();
    expect(doc.annotations[0]?.sourceKind).toBe('ImportedLabel');
    expect(doc.annotations[0]?.start).toBe(hugeStart);
    expect(typeof doc.annotations[0]?.start).toBe('string');
  });

  it('soft-delete does not clear or alter sourceKind', () => {
    const doc = emptyAnnotations();
    const stack = new UndoStack();
    stack.push(makeAddAnnotationCommand(doc, mark('m1', 'Algorithm', '11', '22')));
    const beforeKind = doc.annotations[0]!.sourceKind;
    const beforeStart = doc.annotations[0]!.start;
    const beforeEnd = doc.annotations[0]!.end;

    stack.push(makeSetAnnotationDeletedCommand(doc, 'm1', true));
    expect(doc.annotations[0]?.deleted).toBe(true);
    expect(doc.annotations[0]?.sourceKind).toBe(beforeKind);
    expect(doc.annotations[0]?.start).toBe(beforeStart);
    expect(doc.annotations[0]?.end).toBe(beforeEnd);

    stack.undo();
    expect(doc.annotations[0]?.deleted).toBe(false);
    expect(doc.annotations[0]?.sourceKind).toBe('Algorithm');
    expect(doc.annotations[0]?.start).toBe('11');
  });
});

function stackSeed(doc: AnnotationsDocumentJson): void {
  const stack = new UndoStack();
  stack.push(makeAddAnnotationCommand(doc, mark('m1', 'Manual')));
}

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

describe('boundary: BigInt marks + interleaved docs + channel snapshot', () => {
  it('annotation start/end past 2^53 survive add → replace → undo → redo', () => {
    const doc = emptyAnnotations();
    const stack = new UndoStack();
    const start = sampleIndexToDecimal((1n << 53n) + 1n);
    const end = sampleIndexToDecimal((1n << 53n) + 101n);
    const start2 = sampleIndexToDecimal((1n << 53n) + 50n);
    const end2 = SampleIndexMaxish();

    stack.push(makeAddAnnotationCommand(doc, mark('m1', 'Manual', start, end)));
    expect(doc.annotations[0]?.start).toBe('9007199254740993');
    expect(typeof doc.annotations[0]?.start).toBe('string');

    stack.push(
      makeReplaceAnnotationCommand(doc, {
        ...mark('m1', 'Manual', start2, end2),
        name: 'moved',
      }),
    );
    expect(doc.annotations[0]?.start).toBe(start2);
    expect(doc.annotations[0]?.end).toBe(end2);
    expect(typeof doc.annotations[0]?.end).toBe('string');

    stack.undo();
    expect(doc.annotations[0]?.start).toBe(start);
    expect(doc.annotations[0]?.end).toBe(end);
    expect(doc.annotations[0]?.name).toBe('m1');

    stack.redo();
    expect(doc.annotations[0]?.start).toBe(start2);
    expect(doc.annotations[0]?.end).toBe(end2);
    // Odd past-2^53 loses precision under Number; wire must stay the decimal string.
    expect(String(Number(start))).not.toBe(start);
    expect(doc.annotations[0]?.start).toBe(start2);
    expect(typeof doc.annotations[0]?.start).toBe('string');
  });

  it('sourceSet sourceIdentity physicalSamples / availableSamples stay decimal strings', () => {
    const doc = emptyAnnotations();
    const physical = sampleIndexToDecimal((1n << 53n) + 7n);
    const available = sampleIndexToDecimal((1n << 60n) - 1n);
    doc.sourceSets.push({
      id: 'ss-1',
      fileId: 'file-1',
      sourceKind: 'Manual',
      sourceIdentity: {
        fileId: 'file-1',
        physicalSamples: physical,
        availableSamples: available,
      },
    });
    expect(doc.sourceSets[0]?.sourceIdentity?.physicalSamples).toBe(physical);
    expect(doc.sourceSets[0]?.sourceIdentity?.availableSamples).toBe(available);
    expect(typeof doc.sourceSets[0]?.sourceIdentity?.physicalSamples).toBe('string');
    expect(String(Number(physical))).not.toBe(physical);
  });

  it('interleaves annotation + project selection/view; full undo restores both', () => {
    const doc = emptyAnnotations();
    const project = emptyProject();
    const stack = new UndoStack();
    const hugeBegin = '9007199254740993';

    stack.push(makeAddAnnotationCommand(doc, mark('m1', 'ImportedLabel', '1', '2')));
    stack.push(
      makeSetActiveSelectionCommand(
        project,
        { activeFileId: 'file-1', activeChannelId: 'ch-1', activeMarkId: 'm1', selectedMarkIds: ['m1'] },
        { fileIdForMarks: 'file-1' },
      ),
    );
    stack.push(
      makeSetFileViewRangeCommand(project, 'file-1', {
        time: { begin: hugeBegin, end: '9007199254741093' },
        frequency: { lowerHz: 0, upperHz: 1 },
      }),
    );
    stack.push(makeChangeAnnotationSourceKindCommand(doc, 'm1', 'Algorithm'));

    expect(doc.annotations).toHaveLength(1);
    expect(doc.annotations[0]?.sourceKind).toBe('Algorithm');
    expect(project.activeFileId).toBe('file-1');
    expect(project.files[0]!.view?.time.begin).toBe(hugeBegin);

    while (stack.canUndo) stack.undo();

    expect(doc.annotations).toHaveLength(0);
    expect(project.activeFileId).toBeUndefined();
    expect(project.files[0]!.view).toBeUndefined();
    expect(project.files[0]!.activeMarkId).toBeUndefined();
  });

  it('channel sourceSnapshot attach/clear undoes without domain→project-io dep', () => {
    const project = emptyProject();
    const stack = new UndoStack();
    const snap: Record<string, unknown> = {
      annotationId: 'a1',
      segmentId: 's1',
      revisionId: 'r1',
      name: 'n',
      range: {
        time: { begin: '9007199254740993', end: '9007199254741093' },
        frequency: { lowerHz: 0, upperHz: 1 },
      },
      bindingKind: 'LocatedSegment',
      boundRange: {
        time: { begin: '9007199254740993', end: '9007199254741093' },
        frequency: { lowerHz: 0, upperHz: 1 },
      },
      sourceKind: 'Manual',
      reviewStatus: 'Accepted',
      sourceIdentity: { fileId: 'file-1' },
    };

    stack.push(makeSetChannelSourceSnapshotCommand(project, 'file-1', 'ch-1', snap));
    const ch = project.files[0]!.channels![0]!;
    expect(ch.sourceSnapshot?.annotationId).toBe('a1');
    expect((ch.sourceSnapshot?.range as { time: { begin: string } }).time.begin).toBe(
      '9007199254740993',
    );

    stack.push(makeSetChannelSourceSnapshotCommand(project, 'file-1', 'ch-1', undefined));
    expect(ch.sourceSnapshot).toBeUndefined();

    stack.undo();
    expect(ch.sourceSnapshot?.annotationId).toBe('a1');
    stack.undo();
    expect(ch.sourceSnapshot).toBeUndefined();
  });
});

function SampleIndexMaxish(): string {
  // uint64-ish high but still a decimal string used in prior Bot-F tests
  return sampleIndexToDecimal((1n << 60n) - 1n);
}
