/**
 * M-06 mark / channel-snapshot / undo-redo session (Bot-F).
 *
 * Combines @wss/domain UndoStack commands with @wss/project-io channel snapshot
 * encode/attach helpers. Pure data — no React. Bot-B may wrap this in uiStore;
 * Playwright can drive it via createM06E2eHook().
 */

import {
  ANNOTATIONS_EXPORT_SCHEMA,
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  type AnnotationJson,
  type AnnotationsDocumentJson,
  type ProjectDocumentJson,
  type ViewRangeJson,
} from '@wss/contracts';
import {
  UndoStack,
  makeAddAnnotationCommand,
  makeChangeAnnotationSourceKindCommand,
  makeRemoveAnnotationCommand,
  makeReplaceAnnotationCommand,
  makeSetActiveSelectionCommand,
  makeSetAnnotationDeletedCommand,
  makeSetChannelSourceSnapshotCommand,
  makeSetFileViewRangeCommand,
  type ActiveSelectionSnapshot,
} from '@wss/domain';
import {
  attachChannelSnapshot,
  encodeChannelSnapshotJson,
  makeLocatedSegmentSnapshot,
  readChannelSnapshot,
  type AnnotationChannelSnapshot,
} from './channel-snapshot.js';
import { saveAnnotationsToJsonText, saveProjectToJsonText } from './project-session.js';

export interface M06SessionSnapshot {
  canUndo: boolean;
  canRedo: boolean;
  undoLabel?: string;
  redoLabel?: string;
  undoDepth: number;
  redoDepth: number;
  annotationCount: number;
  activeFileId?: string;
  activeChannelId?: string;
  activeMarkId?: string;
  selectedMarkIds?: string[];
}

export interface M06MarkSessionOptions {
  project?: ProjectDocumentJson;
  annotations?: AnnotationsDocumentJson;
  undoLimit?: number;
}

export class M06MarkSession {
  readonly project: ProjectDocumentJson;
  readonly annotations: AnnotationsDocumentJson;
  readonly stack: UndoStack;

  constructor(options: M06MarkSessionOptions = {}) {
    this.project = options.project ?? emptyProject();
    this.annotations = options.annotations ?? emptyAnnotations(this.project.files[0]?.metadata.id ?? 'file-1');
    this.stack = new UndoStack({ limit: options.undoLimit ?? 100 });
  }

  getSnapshot(): M06SessionSnapshot {
    const fileId = this.project.activeFileId ?? this.project.files[0]?.metadata.id;
    const file = fileId ? this.project.files.find((f) => f.metadata.id === fileId) : undefined;
    return {
      canUndo: this.stack.canUndo,
      canRedo: this.stack.canRedo,
      undoLabel: this.stack.undoLabel,
      redoLabel: this.stack.redoLabel,
      undoDepth: this.stack.undoDepth,
      redoDepth: this.stack.redoDepth,
      annotationCount: this.annotations.annotations.length,
      activeFileId: this.project.activeFileId,
      activeChannelId: this.project.activeChannelId,
      activeMarkId: file?.activeMarkId,
      selectedMarkIds: file?.selectedMarkIds ? [...file.selectedMarkIds] : undefined,
    };
  }

  addMark(annotation: AnnotationJson): void {
    this.stack.push(makeAddAnnotationCommand(this.annotations, annotation));
  }

  removeMark(annotationId: string): void {
    this.stack.push(makeRemoveAnnotationCommand(this.annotations, annotationId));
  }

  replaceMark(annotation: AnnotationJson): void {
    this.stack.push(makeReplaceAnnotationCommand(this.annotations, annotation));
  }

  setMarkDeleted(annotationId: string, deleted: boolean): void {
    this.stack.push(makeSetAnnotationDeletedCommand(this.annotations, annotationId, deleted));
  }

  changeMarkSourceKind(annotationId: string, kind: AnnotationJson['sourceKind']): void {
    this.stack.push(makeChangeAnnotationSourceKindCommand(this.annotations, annotationId, kind));
  }

  setViewRange(fileId: string, view: ViewRangeJson | undefined): void {
    this.stack.push(makeSetFileViewRangeCommand(this.project, fileId, view));
  }

  setActiveSelection(next: ActiveSelectionSnapshot, fileIdForMarks?: string): void {
    this.stack.push(
      makeSetActiveSelectionCommand(this.project, next, {
        fileIdForMarks: fileIdForMarks ?? next.activeFileId,
      }),
    );
  }

  /**
   * Attach a typed channel snapshot (project-io encode) and record undo via domain command.
   */
  setChannelSnapshotFromTyped(
    fileId: string,
    channelId: string,
    snapshot: AnnotationChannelSnapshot | undefined,
  ): void {
    if (snapshot === undefined) {
      this.stack.push(makeSetChannelSourceSnapshotCommand(this.project, fileId, channelId, undefined));
      const ch = findChannel(this.project, fileId, channelId);
      // clear related ids when clearing snapshot
      delete ch.annotationId;
      delete ch.segmentId;
      delete ch.revisionId;
      return;
    }
    const encoded = encodeChannelSnapshotJson(snapshot) as unknown as Record<string, unknown>;
    this.stack.push(makeSetChannelSourceSnapshotCommand(this.project, fileId, channelId, encoded));
    const file = this.project.files.find((f) => f.metadata.id === fileId);
    const channels = file?.channels ?? [];
    const idx = channels.findIndex((c) => c.id === channelId);
    if (idx >= 0) {
      channels[idx] = attachChannelSnapshot(channels[idx]!, snapshot);
    }
  }

  /** Convenience: build LocatedSegment snapshot + attach with undo. */
  attachLocatedSegmentChannel(input: {
    fileId: string;
    channelId: string;
    annotationId: string;
    segmentId: string;
    revisionId: string;
    name: string;
    begin: bigint;
    end: bigint;
    lowerHz: number;
    upperHz: number;
    sourceKind?: AnnotationJson['sourceKind'];
  }): void {
    const snap = makeLocatedSegmentSnapshot({
      annotationId: input.annotationId,
      segmentId: input.segmentId,
      revisionId: input.revisionId,
      name: input.name,
      begin: input.begin,
      end: input.end,
      lowerHz: input.lowerHz,
      upperHz: input.upperHz,
      fileId: input.fileId,
      sourceKind: input.sourceKind ?? 'Manual',
    });
    // Ensure channel exists
    ensureChannel(this.project, input.fileId, input.channelId, input.name);
    const encoded = encodeChannelSnapshotJson(snap) as unknown as Record<string, unknown>;
    this.stack.push(
      makeSetChannelSourceSnapshotCommand(this.project, input.fileId, input.channelId, encoded),
    );
    const file = this.project.files.find((f) => f.metadata.id === input.fileId)!;
    const channels = file.channels!;
    const idx = channels.findIndex((c) => c.id === input.channelId);
    channels[idx] = attachChannelSnapshot(channels[idx]!, snap);
  }

  readChannelSnapshot(fileId: string, channelId: string) {
    const ch = findChannel(this.project, fileId, channelId);
    return readChannelSnapshot(ch, this.project.version);
  }

  undo() {
    return this.stack.undo();
  }

  redo() {
    return this.stack.redo();
  }

  clearHistory(): void {
    this.stack.clear();
  }

  /** Serialize current docs (v6 project + annotations) for download / e2e assert. */
  exportJson(): { projectText: string; annotationsText: string } {
    return {
      projectText: saveProjectToJsonText(this.project),
      annotationsText: saveAnnotationsToJsonText(this.annotations),
    };
  }
}

function emptyAnnotations(fileId: string): AnnotationsDocumentJson {
  return {
    schema: ANNOTATIONS_EXPORT_SCHEMA,
    fileId,
    sourceSets: [],
    annotations: [],
  };
}

function emptyProject(): ProjectDocumentJson {
  return {
    schema: PROJECT_SCHEMA,
    version: PROJECT_WRITE_VERSION,
    name: 'm06-session',
    files: [
      {
        metadata: {
          id: 'file-1',
          name: 'session.iq',
          path: 'session.iq',
          sampleRateHz: 1e6,
          centerFrequencyHz: 1e9,
          sampleCount: '18446744073709551615',
        },
        channels: [{ id: 'ch-1', name: 'channel-1' }],
      },
    ],
  };
}

function findChannel(project: ProjectDocumentJson, fileId: string, channelId: string) {
  const file = project.files.find((f) => f.metadata.id === fileId);
  if (!file) throw new RangeError(`file not found: ${fileId}`);
  const ch = (file.channels ?? []).find((c) => c.id === channelId);
  if (!ch) throw new RangeError(`channel not found: ${fileId}/${channelId}`);
  return ch;
}

function ensureChannel(
  project: ProjectDocumentJson,
  fileId: string,
  channelId: string,
  name: string,
): void {
  const file = project.files.find((f) => f.metadata.id === fileId);
  if (!file) throw new RangeError(`file not found: ${fileId}`);
  if (!file.channels) file.channels = [];
  if (!file.channels.some((c) => c.id === channelId)) {
    file.channels.push({ id: channelId, name });
  }
}
