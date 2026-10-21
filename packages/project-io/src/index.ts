export {
  ProjectIoError,
  parseProjectJson,
  decodeTimeRangeJson,
  decodeViewRangeJson,
  type LoadedProject,
} from './load-project.js';

export {
  encodeTimeRangeJson,
  encodeViewRangeJson,
  toProjectV6Document,
  serializeProjectJson,
} from './save-project.js';

export {
  isAnnotationSourceKind,
  decodeAnnotationRangeJson,
  encodeAnnotationRangeJson,
  parseAnnotationsJson,
  serializeAnnotationsJson,
} from './annotations.js';

export {
  encodeChannelSnapshotJson,
  decodeChannelSnapshotJson,
  isAnnotationChannelSnapshotJson,
  attachChannelSnapshot,
  readChannelSnapshot,
  makeLocatedSegmentSnapshot,
  viewRangeJsonFromDecimals,
  type AnnotationChannelSnapshot,
} from './channel-snapshot.js';

/**
 * Bot-B web shell: prefer openProjectFromJsonText / saveProjectToJsonText
 * (and annotation counterparts) over hand-rolled JSON.
 */
export {
  openProjectFromJsonText,
  saveProjectToJsonText,
  openAnnotationsFromJsonText,
  saveAnnotationsToJsonText,
  summarizeLoadedProject,
  type OpenProjectResult,
  type SaveProjectOptions,
  type ProjectSessionSummary,
} from './project-session.js';

/**
 * Type-only store/hook surface. Bot-B uiStore should implement ProjectSessionHookApi
 * by calling the project-session primitives above.
 */
export type { ProjectSessionHookApi } from './session-hook-contract.js';
export {
  M06MarkSession,
  type M06SessionSnapshot,
  type M06MarkSessionOptions,
} from './m06-mark-session.js';

export {
  WSS_M06_HOOK_KEY,
  createM06E2eHook,
  installM06E2eHook,
  type M06E2eHookApi,
} from './m06-e2e-hook.js';

export {
  SIGMF_DEMO_DIR,
  SIGMF_DEMO_BASENAME,
  SIGMF_DEMO_META_PATH,
  SIGMF_DEMO_DATA_PATH,
  SIGMF_DEMO_JSON_PATH,
  normalizePath,
  isAllowedDemoIqPath,
  assertAllowedDemoIqPath,
  listAllowedDemoIqPaths,
} from './demo-iq-paths.js';

export {
  engineeringTreeFromProject,
  engineeringTreeFromSummary,
  engineeringTreeFromSession,
  listMarkNodes,
  summarizeLoadedProjectTree,
  ANNOTATION_SOURCE_TREE_COLORS,
  ANNOTATION_SOURCE_TREE_LABELS,
  type EngineeringTreeKind,
  type EngineeringTreeNode,
  type EngineeringTreeBuildOptions,
} from './engineering-tree.js';

export {
  importSigmfStream,
  type ImportStreamMode,
  type ImportStreamStatus,
  type ImportStreamRow,
  type ImportSigmfStreamInput,
  type ImportSigmfStreamResult,
} from './import-sigmf-stream.js';

export {
  WSS_G19_HOOK_KEY,
  createG19E2eHook,
  installG19E2eHook,
  G19_DEMO_PATHS,
  type G19E2eHookApi,
  type G19E2eHookState,
} from './g19-e2e-hook.js';
