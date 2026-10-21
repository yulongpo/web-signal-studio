/**
 * Testable M-06 E2E hook surface (Bot-F).
 *
 * Bot-B (or a Playwright beforeEach) can install this on `window.__wssM06` so
 * e2e specs drive marks / channel snapshots / undo without clicking through UI.
 * Pure factory — no DOM import at module load.
 */

import type { AnnotationJson } from '@wss/contracts';
import { M06MarkSession, type M06SessionSnapshot } from './m06-mark-session.js';

export const WSS_M06_HOOK_KEY = '__wssM06' as const;

export interface M06E2eHookApi {
  /** Session snapshot safe for JSON serialization in Playwright evaluate. */
  getState(): M06SessionSnapshot;
  addManualMark(input: {
    id: string;
    name?: string;
    start: string;
    end: string;
    lowerHz?: number;
    upperHz?: number;
  }): M06SessionSnapshot;
  removeMark(id: string): M06SessionSnapshot;
  changeSourceKind(id: string, kind: AnnotationJson['sourceKind']): M06SessionSnapshot;
  attachChannelSnapshot(input: {
    fileId?: string;
    channelId?: string;
    annotationId: string;
    segmentId: string;
    revisionId: string;
    name?: string;
    begin: string;
    end: string;
    lowerHz?: number;
    upperHz?: number;
    sourceKind?: AnnotationJson['sourceKind'];
  }): M06SessionSnapshot;
  clearChannelSnapshot(fileId?: string, channelId?: string): M06SessionSnapshot;
  setSelection(input: {
    activeFileId?: string;
    activeChannelId?: string;
    activeMarkId?: string;
    selectedMarkIds?: string[];
  }): M06SessionSnapshot;
  undo(): M06SessionSnapshot;
  redo(): M06SessionSnapshot;
  /** Export project+annotations JSON texts (decimal sample indexes preserved). */
  exportJson(): { projectText: string; annotationsText: string };
  /** Underlying session for advanced unit tests (not for Playwright evaluate). */
  readonly session: M06MarkSession;
}

export function createM06E2eHook(session = new M06MarkSession()): M06E2eHookApi {
  const api: M06E2eHookApi = {
    session,
    getState: () => session.getSnapshot(),
    addManualMark(input) {
      session.addMark({
        id: input.id,
        name: input.name ?? input.id,
        sourceKind: 'Manual',
        start: input.start,
        end: input.end,
        lowerHz: input.lowerHz ?? 0,
        upperHz: input.upperHz ?? 1e6,
      });
      return session.getSnapshot();
    },
    removeMark(id) {
      session.removeMark(id);
      return session.getSnapshot();
    },
    changeSourceKind(id, kind) {
      session.changeMarkSourceKind(id, kind);
      return session.getSnapshot();
    },
    attachChannelSnapshot(input) {
      const fileId = input.fileId ?? 'file-1';
      const channelId = input.channelId ?? 'ch-1';
      session.attachLocatedSegmentChannel({
        fileId,
        channelId,
        annotationId: input.annotationId,
        segmentId: input.segmentId,
        revisionId: input.revisionId,
        name: input.name ?? input.annotationId,
        begin: BigInt(input.begin),
        end: BigInt(input.end),
        lowerHz: input.lowerHz ?? 0,
        upperHz: input.upperHz ?? 1e6,
        sourceKind: input.sourceKind ?? 'Manual',
      });
      return session.getSnapshot();
    },
    clearChannelSnapshot(fileId = 'file-1', channelId = 'ch-1') {
      session.setChannelSnapshotFromTyped(fileId, channelId, undefined);
      return session.getSnapshot();
    },
    setSelection(input) {
      session.setActiveSelection(
        {
          activeFileId: input.activeFileId,
          activeChannelId: input.activeChannelId,
          activeMarkId: input.activeMarkId,
          selectedMarkIds: input.selectedMarkIds,
        },
        input.activeFileId ?? 'file-1',
      );
      return session.getSnapshot();
    },
    undo() {
      session.undo();
      return session.getSnapshot();
    },
    redo() {
      session.redo();
      return session.getSnapshot();
    },
    exportJson: () => session.exportJson(),
  };
  return api;
}

/** Install hook on a window-like target (browser page). */
export function installM06E2eHook(
  target: { [WSS_M06_HOOK_KEY]?: M06E2eHookApi },
  session?: M06MarkSession,
): M06E2eHookApi {
  const hook = createM06E2eHook(session);
  target[WSS_M06_HOOK_KEY] = hook;
  return hook;
}
