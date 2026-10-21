/**
 * Type-only session hook / store surface contract for the web shell (Bot-F).
 *
 * Bot-B (Zustand uiStore) should implement this shape by calling the
 * project-session primitives:
 *   openProjectFromJsonText / saveProjectToJsonText / summarizeLoadedProject
 * (and clear by dropping held document state). This interface is the contract
 * surface - not a React hook implementation.
 *
 * Sample indexes stay canonical decimal strings on the wire and in summaries.
 * Never coerce them to JSON Number past Number.MAX_SAFE_INTEGER.
 */

import type { ProjectDocumentJson } from '@wss/contracts';
import type { ProjectSessionSummary } from './project-session.js';

/**
 * What the web shell session (uiStore / future hook) should expose to UI.
 * Implementation lives in Bot-B; primitives live in `@wss/project-io`.
 */
export interface ProjectSessionHookApi {
  /**
   * Parse + validate native project JSON text via openProjectFromJsonText.
   * On success the store should retain document + summary; on failure return error string.
   */
  openProjectFromText(text: string): { ok: true } | { ok: false; error: string };

  /**
   * Serialize the currently loaded project via saveProjectToJsonText.
   * Returns null when no project is loaded.
   */
  saveProjectJsonText(): string | null;

  /** Drop loaded project document + summary from session state. */
  clearProject(): void;

  /** Readonly view of summarizeLoadedProject when a project is loaded. */
  readonly projectSummary: ProjectSessionSummary | null;

  /** Readonly currently loaded ProjectDocumentJson, or null. */
  readonly projectDocument: ProjectDocumentJson | null;
}