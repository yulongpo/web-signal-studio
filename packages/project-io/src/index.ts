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