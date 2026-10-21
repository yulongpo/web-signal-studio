/**
 * G19–G20 testable hook (Bot-F).
 *
 * Bot-B can install on `window.__wssG19` in Playwright / e2e bootstrap:
 *   import { installG19E2eHook } from '@wss/project-io';
 *   installG19E2eHook(window);
 *
 * Does not edit uiStore / ProjectTree — B maps `getTree()` into the left rail.
 */

import {
  SIGMF_DEMO_DATA_PATH,
  SIGMF_DEMO_JSON_PATH,
  SIGMF_DEMO_META_PATH,
  listAllowedDemoIqPaths,
} from './demo-iq-paths.js';
import { engineeringTreeFromProject, type EngineeringTreeNode } from './engineering-tree.js';
import {
  importSigmfStream,
  type ImportSigmfStreamResult,
  type ImportStreamRow,
} from './import-sigmf-stream.js';
import { saveAnnotationsToJsonText, saveProjectToJsonText } from './project-session.js';

export const WSS_G19_HOOK_KEY = '__wssG19' as const;

export interface G19E2eHookState {
  fileCount: number;
  activeFileId?: string;
  sampleCount?: string;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  annotationCount: number;
  treeLabels: string[];
  lastRow?: ImportStreamRow;
  companionSchema?: string;
}

export interface G19E2eHookApi {
  listAllowedDemoPaths(): string[];
  /** Import SigMF meta+data length (+ optional companion json) into session. */
  importSigmf(input: {
    metaText: string;
    dataByteLength: number;
    companionJsonText?: string;
    path?: string;
    displayName?: string;
    mode?: 'append' | 'replace';
    fileId?: string;
  }): G19E2eHookState;
  getState(): G19E2eHookState;
  getTree(): EngineeringTreeNode[];
  exportProjectJson(): string | null;
  exportAnnotationsJson(): string | null;
  clear(): void;
  readonly lastResult: ImportSigmfStreamResult | null;
}

function toState(result: ImportSigmfStreamResult | null): G19E2eHookState {
  if (!result) {
    return { fileCount: 0, annotationCount: 0, treeLabels: [] };
  }
  const file = result.project.files[0];
  const folder = result.tree[0]?.children?.[0];
  const labels =
    folder?.children?.map((n) => n.label) ??
    result.tree.map((n) => n.label);
  return {
    fileCount: result.project.files.length,
    activeFileId: result.project.activeFileId,
    sampleCount: file?.metadata.sampleCount,
    sampleRateHz: file?.metadata.sampleRateHz,
    centerFrequencyHz: file?.metadata.centerFrequencyHz,
    annotationCount: result.annotations.annotations.length,
    treeLabels: labels,
    lastRow: result.row,
    companionSchema: result.companionSchema,
  };
}

export function createG19E2eHook(): G19E2eHookApi {
  let last: ImportSigmfStreamResult | null = null;
  const api: G19E2eHookApi = {
    get lastResult() {
      return last;
    },
    listAllowedDemoPaths: () => listAllowedDemoIqPaths(),
    importSigmf(input) {
      last = importSigmfStream({
        metaText: input.metaText,
        dataByteLength: input.dataByteLength,
        companionJsonText: input.companionJsonText,
        path: input.path ?? SIGMF_DEMO_META_PATH,
        displayName: input.displayName,
        mode: input.mode ?? (last?.project ? 'append' : 'replace'),
        project: input.mode === 'replace' ? undefined : last?.project,
        fileId: input.fileId,
        enforceDemoPath: true,
      });
      return toState(last);
    },
    getState: () => toState(last),
    getTree: () => (last ? engineeringTreeFromProject(last.project) : []),
    exportProjectJson: () => (last ? saveProjectToJsonText(last.project) : null),
    exportAnnotationsJson: () => (last ? saveAnnotationsToJsonText(last.annotations) : null),
    clear() {
      last = null;
    },
  };
  return api;
}

export function installG19E2eHook(target: {
  [WSS_G19_HOOK_KEY]?: G19E2eHookApi;
}): G19E2eHookApi {
  const hook = createG19E2eHook();
  target[WSS_G19_HOOK_KEY] = hook;
  return hook;
}

/** Convenience constants for Bot-B Playwright path assertions. */
export const G19_DEMO_PATHS = {
  meta: SIGMF_DEMO_META_PATH,
  data: SIGMF_DEMO_DATA_PATH,
  json: SIGMF_DEMO_JSON_PATH,
} as const;
