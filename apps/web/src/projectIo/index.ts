/**
 * Thin re-export surface so apps/web can import project open/save without
 * scattering `@wss/project-io` deep imports. Bot-F owns this folder;
 * Bot-B owns uiStore / shell UI wiring that calls these primitives.
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
  type ProjectSessionHookApi,
  type LoadedProject,
  parseProjectJson,
  serializeProjectJson,
  ProjectIoError,
} from '@wss/project-io';