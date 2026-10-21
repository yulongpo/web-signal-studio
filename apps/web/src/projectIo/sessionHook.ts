/**
 * Session hook / store contract for native project open/save.
 *
 * Bot-B Zustand `uiStore` (and any future React hook) should implement
 * `ProjectSessionHookApi`. Bot-F only publishes the type + primitives in
 * `@wss/project-io`; do not put shell UI here.
 */
export type { ProjectSessionHookApi } from '@wss/project-io';