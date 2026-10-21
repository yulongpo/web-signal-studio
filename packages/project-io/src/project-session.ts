/**
 * Web shell open/save wiring contract (Bot-F).
 *
 * Bot-B (apps/web) should call these helpers instead of hand-rolling
 * JSON.parse/stringify for native project / annotations documents.
 * Pure data — no React, no uiStore.
 *
 * Sample indexes on the wire are canonical decimal strings. Never emit
 * JSON Number for indexes that may exceed Number.MAX_SAFE_INTEGER:
 * JSON.parse of a numeric literal past 2^53-1 loses precision irreversibly;
 * a reviver cannot recover digits already rounded away.
 */

import type {
  AnnotationsDocumentJson,
  ProjectDocumentJson,
  ProjectLoadVersion,
} from '@wss/contracts';
import {
  parseAnnotationsJson,
  serializeAnnotationsJson,
} from './annotations.js';
import { parseProjectJson, type LoadedProject } from './load-project.js';
import { serializeProjectJson } from './save-project.js';

export interface OpenProjectResult {
  document: ProjectDocumentJson;
  version: ProjectLoadVersion;
}

export interface SaveProjectOptions {
  /** Pretty-print (default true). */
  pretty?: boolean;
}

/**
 * Open a native project from JSON text (schema + version validated).
 * Forces callers through parseProjectJson so decimal sample strings stay strings.
 */
export function openProjectFromJsonText(text: string): OpenProjectResult {
  const loaded: LoadedProject = parseProjectJson(text);
  return { document: loaded.document, version: loaded.version };
}

/**
 * Save a project document to JSON text. Always writes schema + version 6.
 */
export function saveProjectToJsonText(
  document: ProjectDocumentJson,
  opts?: SaveProjectOptions,
): string {
  return serializeProjectJson(document, opts?.pretty ?? true);
}

export function openAnnotationsFromJsonText(text: string): AnnotationsDocumentJson {
  return parseAnnotationsJson(text);
}

export function saveAnnotationsToJsonText(
  document: AnnotationsDocumentJson,
  opts?: SaveProjectOptions,
): string {
  return serializeAnnotationsJson(document, opts?.pretty ?? true);
}

/**
 * Pure status-bar / tree summary for the web shell.
 * All sample counts and ranges stay decimal strings on this surface.
 */
export interface ProjectSessionSummary {
  name: string;
  version: ProjectLoadVersion;
  activeFileId?: string;
  activeChannelId?: string;
  fileCount: number;
  files: Array<{
    id: string;
    name: string;
    /** Canonical decimal uint64 sample count. */
    sampleCount: string;
    path: string;
    channelCount: number;
  }>;
}

export function summarizeLoadedProject(opened: OpenProjectResult): ProjectSessionSummary {
  const { document, version } = opened;
  return {
    name: document.name,
    version,
    activeFileId: document.activeFileId,
    activeChannelId: document.activeChannelId,
    fileCount: document.files.length,
    files: document.files.map((f) => ({
      id: f.metadata.id,
      name: f.metadata.name,
      sampleCount: f.metadata.sampleCount,
      path: f.metadata.path,
      channelCount: f.channels?.length ?? 0,
    })),
  };
}
