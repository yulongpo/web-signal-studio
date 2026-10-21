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
