/**
 * G19-G20 testable hook (Bot-F).
 *
 * Bot-B can install on `window.__wssG19` in Playwright / e2e bootstrap:
 *   import { installG19E2eHook } from '@wss/project-io';
 *   installG19E2eHook(window);
 *
 * Does not edit uiStore / ProjectTree 閳?B maps `getTree()` into the left rail.
 * PARITY: also exposes format templates + SigMF/raw preview for Add-signal wiring.
 */

import type { AnnotationsDocumentJson } from '@wss/contracts';
import {
  SIGMF_DEMO_DATA_PATH,
  SIGMF_DEMO_JSON_PATH,
  SIGMF_DEMO_META_PATH,
  listAllowedDemoIqPaths,
} from './demo-iq-paths.js';
import {
  engineeringTreeFromSession,
  listMarkNodes,
  type EngineeringTreeNode,
} from './engineering-tree.js';
import {
  listBuiltinFormatTemplates,
  type FormatTemplate,
} from './format-templates.js';
import {
  describeRawIqWithTemplate,
  previewSigmfImport,
  type ImportPreviewRow,
  type SourceSuggestionsJson,
} from './import-preview.js';
import {
  importSigmfStream,
  type ImportSigmfStreamResult,
  type ImportStreamRow,
} from './import-sigmf-stream.js';
import {
  importRawStream,
  importRawWithTemplate as commitRawWithTemplate,
  type ImportRawStreamResult,
} from './import-raw-stream.js';
import { saveAnnotationsToJsonText, saveProjectToJsonText } from './project-session.js';

export const WSS_G19_HOOK_KEY = '__wssG19' as const;

export interface G19E2eHookState {
  fileCount: number;
  activeFileId?: string;
  sampleCount?: string;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  annotationCount: number;
  markNodeCount: number;
  sourceGroupLabels: string[];
  treeLabels: string[];
  lastRow?: ImportStreamRow;
  companionSchema?: string;
  warnings?: string[];
}

export interface G19E2eHookApi {
  listAllowedDemoPaths(): string[];
  /** Desktop builtin format templates for Add-signal. */
  listFormatTemplates(): FormatTemplate[];
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
  /** Preview only 閳?no project mutation (Add-signal form). */
  previewSigmf(input: {
    metaText: string;
    dataByteLength?: number;
    companionJsonText?: string;
    path?: string;
    displayName?: string;
    fileId?: string;
  }): { suggestions: SourceSuggestionsJson; row: ImportPreviewRow };
  /** Raw IQ preview via builtin/user template id. */
  previewRawWithTemplate(input: {
    path: string;
    dataByteLength: number;
    sampleRateHz: number;
    centerFrequencyHz: number;
    templateId: string;
    confirmed?: boolean;
    declaredBandwidthHz?: number;
    fileId?: string;
  }): ImportPreviewRow;
  /** Commit RAW IQ (explicit sampleFormat) into project/session/tree. */
  importRaw(input: {
    path: string;
    dataByteLength: number;
    sampleFormat: import('@wss/contracts').SampleFormatDescriptor;
    sampleRateHz: number;
    centerFrequencyHz: number;
    declaredBandwidthHz?: number;
    templateId?: string;
    confirmed?: boolean;
    displayName?: string;
    mode?: 'append' | 'replace';
    fileId?: string;
  }): G19E2eHookState;
  /** Commit RAW via builtin/user template id. */
  importRawWithTemplate(input: {
    path: string;
    dataByteLength: number;
    sampleRateHz: number;
    centerFrequencyHz: number;
    templateId: string;
    confirmed?: boolean;
    declaredBandwidthHz?: number;
    displayName?: string;
    mode?: 'append' | 'replace';
    fileId?: string;
    headerBytes?: string;
    trailerBytes?: string;
  }): G19E2eHookState;
  /** Replace annotations doc used for three-source tree (host/B wiring). */
  setAnnotations(doc: AnnotationsDocumentJson | null): G19E2eHookState;
  getState(): G19E2eHookState;
  /** Full tree including Marks / ImportedLabel|Manual|Algorithm groups. */
  getTree(): EngineeringTreeNode[];
  listMarks(): EngineeringTreeNode[];
  exportProjectJson(): string | null;
  exportAnnotationsJson(): string | null;
  clear(): void;
  readonly lastResult: ImportSigmfStreamResult | ImportRawStreamResult | null;
}

function collectSourceLabels(tree: EngineeringTreeNode[]): string[] {
  const out: string[] = [];
  const walk = (n: EngineeringTreeNode) => {
    if (n.kind === 'annotationSource' && n.sourceKind) out.push(n.sourceKind);
    for (const c of n.children ?? []) walk(c);
  };
  for (const r of tree) walk(r);
  return out;
}

function toState(
  result: ImportSigmfStreamResult | ImportRawStreamResult | null,
  annotationsOverride: AnnotationsDocumentJson | null,
): G19E2eHookState {
  if (!result) {
    return {
      fileCount: 0,
      annotationCount: 0,
      markNodeCount: 0,
      sourceGroupLabels: [],
      treeLabels: [],
    };
  }
  const annotations = annotationsOverride ?? result.annotations;
  const tree = engineeringTreeFromSession(result.project, {
    annotations,
    includeEmptySourceGroups: true,
  });
  const file = result.project.files[0];
  const iq = tree[0]?.children?.[0];
  const labels = iq?.children?.map((n) => n.label) ?? tree.map((n) => n.label);
  return {
    fileCount: result.project.files.length,
    activeFileId: result.project.activeFileId,
    sampleCount: file?.metadata.sampleCount,
    sampleRateHz: file?.metadata.sampleRateHz,
    centerFrequencyHz: file?.metadata.centerFrequencyHz,
    annotationCount: annotations.annotations.length,
    markNodeCount: listMarkNodes(tree).length,
    sourceGroupLabels: collectSourceLabels(tree),
    treeLabels: labels,
    lastRow: result.row,
    companionSchema: result.companionSchema,
    warnings: result.warnings,
  };
}

export function createG19E2eHook(): G19E2eHookApi {
  let last: ImportSigmfStreamResult | ImportRawStreamResult | null = null;
  let annotationsOverride: AnnotationsDocumentJson | null = null;
  const api: G19E2eHookApi = {
    get lastResult() {
      return last;
    },
    listAllowedDemoPaths: () => listAllowedDemoIqPaths(),
    listFormatTemplates: () => listBuiltinFormatTemplates(),
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
      annotationsOverride = null;
      return toState(last, annotationsOverride);
    },
    previewSigmf(input) {
      return previewSigmfImport({
        metaText: input.metaText,
        dataByteLength: input.dataByteLength,
        companionJsonText: input.companionJsonText,
        path: input.path ?? SIGMF_DEMO_META_PATH,
        displayName: input.displayName,
        fileId: input.fileId,
      });
    },
    previewRawWithTemplate(input) {
      return describeRawIqWithTemplate({
        path: input.path,
        dataByteLength: input.dataByteLength,
        sampleRateHz: input.sampleRateHz,
        centerFrequencyHz: input.centerFrequencyHz,
        templateId: input.templateId,
        confirmed: input.confirmed ?? true,
        declaredBandwidthHz: input.declaredBandwidthHz,
        fileId: input.fileId,
      });
    },
    importRaw(input) {
      last = importRawStream({
        path: input.path,
        dataByteLength: input.dataByteLength,
        sampleFormat: input.sampleFormat,
        sampleRateHz: input.sampleRateHz,
        centerFrequencyHz: input.centerFrequencyHz,
        declaredBandwidthHz: input.declaredBandwidthHz,
        templateId: input.templateId,
        confirmed: input.confirmed ?? true,
        displayName: input.displayName,
        mode: input.mode ?? (last?.project ? 'append' : 'replace'),
        project: input.mode === 'replace' ? undefined : last?.project,
        fileId: input.fileId,
      });
      annotationsOverride = null;
      return toState(last, annotationsOverride);
    },
    importRawWithTemplate(input) {
      last = commitRawWithTemplate({
        path: input.path,
        dataByteLength: input.dataByteLength,
        sampleRateHz: input.sampleRateHz,
        centerFrequencyHz: input.centerFrequencyHz,
        templateId: input.templateId,
        confirmed: input.confirmed ?? true,
        declaredBandwidthHz: input.declaredBandwidthHz,
        displayName: input.displayName,
        mode: input.mode ?? (last?.project ? 'append' : 'replace'),
        project: input.mode === 'replace' ? undefined : last?.project,
        fileId: input.fileId,
        headerBytes: input.headerBytes,
        trailerBytes: input.trailerBytes,
      });
      annotationsOverride = null;
      return toState(last, annotationsOverride);
    },
    setAnnotations(doc) {
      annotationsOverride = doc;
      return toState(last, annotationsOverride);
    },
    getState: () => toState(last, annotationsOverride),
    getTree: () => {
      if (!last) return [];
      return engineeringTreeFromSession(last.project, {
        annotations: annotationsOverride ?? last.annotations,
        includeEmptySourceGroups: true,
      });
    },
    listMarks: () => listMarkNodes(api.getTree()),
    exportProjectJson: () => (last ? saveProjectToJsonText(last.project) : null),
    exportAnnotationsJson: () => {
      if (!last) return null;
      return saveAnnotationsToJsonText(annotationsOverride ?? last.annotations);
    },
    clear() {
      last = null;
      annotationsOverride = null;
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
