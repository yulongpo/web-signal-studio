/**
 * Session hook / store contract for native project open/save.
 *
 * Bot-B Zustand `uiStore` implements `ProjectSessionHookApi` via
 * `asProjectSessionHook(useUiStore.getState())` (defined in uiStore).
 * This module stays a Bot-F thin re-export of types + primitives only.
 *
 * See docs/implementation/BOT_F_WEB_SESSION_CONTRACT.md.
 */
export type { ProjectSessionHookApi } from '@wss/project-io';
export {
  openProjectFromJsonText,
  saveProjectToJsonText,
  summarizeLoadedProject,
} from '@wss/project-io';
