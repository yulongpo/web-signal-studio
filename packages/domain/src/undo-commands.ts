/**
 * Reversible domain ops for annotations + project selection/view.
 * Mutates held JSON docs in place; never deep-clones IQ / sample buffers.
 */

import {
  ANNOTATION_SOURCE_KINDS,
  type AnnotationJson,
  type AnnotationSourceKind,
  type AnnotationsDocumentJson,
  type ProjectDocumentJson,
  type ProjectFileJson,
  type ViewRangeJson,
} from '@wss/contracts';
import type { UndoCommand } from './undo-stack.js';

let commandSeq = 0;
function nextCommandId(prefix: string): string {
  commandSeq += 1;
  return `${prefix}-${commandSeq}`;
}

export function isAnnotationSourceKind(value: unknown): value is AnnotationSourceKind {
  return typeof value === 'string' && (ANNOTATION_SOURCE_KINDS as readonly string[]).includes(value);
}

export function assertAnnotationSourceKind(value: unknown): AnnotationSourceKind {
  if (!isAnnotationSourceKind(value)) {
    throw new TypeError(`Invalid AnnotationSourceKind: ${JSON.stringify(value)}`);
  }
  return value;
}

/** Shallow clone of an annotation mark (segments array copied; nested objects shared). */
export function cloneAnnotationMark(mark: AnnotationJson): AnnotationJson {
  return {
    ...mark,
    segments: mark.segments ? mark.segments.map((s) => ({ ...s })) : undefined,
    derivedFrom: mark.derivedFrom ? [...mark.derivedFrom] : undefined,
    reviewHistory: mark.reviewHistory ? mark.reviewHistory.map((r) => ({ ...r })) : undefined,
    revisions: mark.revisions ? mark.revisions.map((r) => ({ ...r })) : undefined,
    originEvidence: mark.originEvidence ? { ...mark.originEvidence } : undefined,
  };
}

function findFile(project: ProjectDocumentJson, fileId: string): ProjectFileJson {
  const file = project.files.find((f) => f.metadata.id === fileId);
  if (!file) {
    throw new RangeError(`Project file not found: ${fileId}`);
  }
  return file;
}

function findAnnotationIndex(doc: AnnotationsDocumentJson, id: string): number {
  return doc.annotations.findIndex((a) => a.id === id);
}

/** Add a mark; redo inserts, undo removes by id. */
export function makeAddAnnotationCommand(
  doc: AnnotationsDocumentJson,
  annotation: AnnotationJson,
  label = 'Add annotation',
): UndoCommand {
  assertAnnotationSourceKind(annotation.sourceKind);
  const snapshot = cloneAnnotationMark(annotation);
  const id = snapshot.id;
  return {
    id: nextCommandId('ann-add'),
    label,
    redo() {
      const idx = findAnnotationIndex(doc, id);
      if (idx >= 0) {
        doc.annotations[idx] = cloneAnnotationMark(snapshot);
      } else {
        doc.annotations.push(cloneAnnotationMark(snapshot));
      }
    },
    undo() {
      const idx = findAnnotationIndex(doc, id);
      if (idx >= 0) doc.annotations.splice(idx, 1);
    },
  };
}

/** Remove a mark by id; undo restores the prior snapshot. */
export function makeRemoveAnnotationCommand(
  doc: AnnotationsDocumentJson,
  annotationId: string,
  label = 'Remove annotation',
): UndoCommand {
  const existing = doc.annotations.find((a) => a.id === annotationId);
  if (!existing) {
    throw new RangeError(`Annotation not found: ${annotationId}`);
  }
  const snapshot = cloneAnnotationMark(existing);
  return {
    id: nextCommandId('ann-remove'),
    label,
    redo() {
      const idx = findAnnotationIndex(doc, annotationId);
      if (idx >= 0) doc.annotations.splice(idx, 1);
    },
    undo() {
      const idx = findAnnotationIndex(doc, annotationId);
      if (idx >= 0) {
        doc.annotations[idx] = cloneAnnotationMark(snapshot);
      } else {
        doc.annotations.push(cloneAnnotationMark(snapshot));
      }
    },
  };
}

/** Replace a mark; stores before/after snapshots (no IQ). */
export function makeReplaceAnnotationCommand(
  doc: AnnotationsDocumentJson,
  next: AnnotationJson,
  label = 'Update annotation',
): UndoCommand {
  assertAnnotationSourceKind(next.sourceKind);
  const idx0 = findAnnotationIndex(doc, next.id);
  if (idx0 < 0) {
    throw new RangeError(`Annotation not found: ${next.id}`);
  }
  const before = cloneAnnotationMark(doc.annotations[idx0]!);
  const after = cloneAnnotationMark(next);
  return {
    id: nextCommandId('ann-replace'),
    label,
    redo() {
      const idx = findAnnotationIndex(doc, after.id);
      if (idx < 0) throw new RangeError(`Annotation missing on redo: ${after.id}`);
      doc.annotations[idx] = cloneAnnotationMark(after);
    },
    undo() {
      const idx = findAnnotationIndex(doc, before.id);
      if (idx < 0) throw new RangeError(`Annotation missing on undo: ${before.id}`);
      doc.annotations[idx] = cloneAnnotationMark(before);
    },
  };
}

/** Soft-delete / restore via `deleted` flag (keeps three-source kind intact). */
export function makeSetAnnotationDeletedCommand(
  doc: AnnotationsDocumentJson,
  annotationId: string,
  deleted: boolean,
  label = deleted ? 'Delete annotation' : 'Restore annotation',
): UndoCommand {
  const existing = doc.annotations.find((a) => a.id === annotationId);
  if (!existing) {
    throw new RangeError(`Annotation not found: ${annotationId}`);
  }
  const prev = existing.deleted === true;
  return {
    id: nextCommandId('ann-deleted'),
    label,
    redo() {
      const ann = doc.annotations.find((a) => a.id === annotationId);
      if (!ann) throw new RangeError(`Annotation missing: ${annotationId}`);
      ann.deleted = deleted;
    },
    undo() {
      const ann = doc.annotations.find((a) => a.id === annotationId);
      if (!ann) throw new RangeError(`Annotation missing: ${annotationId}`);
      ann.deleted = prev;
    },
  };
}

function cloneViewRangeJson(view: ViewRangeJson | undefined): ViewRangeJson | undefined {
  if (!view) return undefined;
  return {
    time: { begin: view.time.begin, end: view.time.end },
    frequency: { lowerHz: view.frequency.lowerHz, upperHz: view.frequency.upperHz },
  };
}

/** Set a file's view range (wire decimal strings preserved as-is). */
export function makeSetFileViewRangeCommand(
  project: ProjectDocumentJson,
  fileId: string,
  view: ViewRangeJson | undefined,
  label = 'Set view range',
): UndoCommand {
  const file = findFile(project, fileId);
  const before = cloneViewRangeJson(file.view);
  const after = cloneViewRangeJson(view);
  return {
    id: nextCommandId('proj-view'),
    label,
    redo() {
      const f = findFile(project, fileId);
      if (after === undefined) {
        delete f.view;
      } else {
        f.view = cloneViewRangeJson(after);
      }
    },
    undo() {
      const f = findFile(project, fileId);
      if (before === undefined) {
        delete f.view;
      } else {
        f.view = cloneViewRangeJson(before);
      }
    },
  };
}

export interface ActiveSelectionSnapshot {
  activeFileId?: string;
  activeChannelId?: string;
  selectedMarkIds?: string[];
  activeMarkId?: string;
}

function readSelection(project: ProjectDocumentJson, fileId?: string): ActiveSelectionSnapshot {
  const snap: ActiveSelectionSnapshot = {
    activeFileId: project.activeFileId,
    activeChannelId: project.activeChannelId,
  };
  if (fileId) {
    const file = project.files.find((f) => f.metadata.id === fileId);
    if (file) {
      snap.selectedMarkIds = file.selectedMarkIds ? [...file.selectedMarkIds] : undefined;
      snap.activeMarkId = file.activeMarkId;
    }
  }
  return snap;
}

function applySelection(
  project: ProjectDocumentJson,
  snap: ActiveSelectionSnapshot,
  fileId?: string,
): void {
  if (snap.activeFileId === undefined) delete project.activeFileId;
  else project.activeFileId = snap.activeFileId;

  if (snap.activeChannelId === undefined) delete project.activeChannelId;
  else project.activeChannelId = snap.activeChannelId;

  if (!fileId) return;
  const file = findFile(project, fileId);
  if (snap.selectedMarkIds === undefined) delete file.selectedMarkIds;
  else file.selectedMarkIds = [...snap.selectedMarkIds];
  if (snap.activeMarkId === undefined) delete file.activeMarkId;
  else file.activeMarkId = snap.activeMarkId;
}

/** Change active file/channel and optional per-file mark selection. */
export function makeSetActiveSelectionCommand(
  project: ProjectDocumentJson,
  next: ActiveSelectionSnapshot,
  options: { fileIdForMarks?: string; label?: string } = {},
): UndoCommand {
  const fileId = options.fileIdForMarks;
  const before = readSelection(project, fileId);
  const after: ActiveSelectionSnapshot = {
    activeFileId: next.activeFileId,
    activeChannelId: next.activeChannelId,
    selectedMarkIds: next.selectedMarkIds ? [...next.selectedMarkIds] : undefined,
    activeMarkId: next.activeMarkId,
  };
  return {
    id: nextCommandId('proj-sel'),
    label: options.label ?? 'Set active selection',
    redo() {
      applySelection(project, after, fileId);
    },
    undo() {
      applySelection(project, before, fileId);
    },
  };
}
