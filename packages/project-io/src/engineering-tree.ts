/**
 * Engineering tree model for project session (G19).
 * Shape mirrors apps/web ProjectTreeNode so Bot-B can map without rewriting store.
 */

import type { ProjectDocumentJson, ProjectLoadVersion } from '@wss/contracts';
import { summarizeLoadedProject, type ProjectSessionSummary } from './project-session.js';

export type EngineeringTreeKind = 'project' | 'folder' | 'file' | 'channel';

export interface EngineeringTreeNode {
  id: string;
  label: string;
  kind: EngineeringTreeKind;
  children?: EngineeringTreeNode[];
  /** Optional decimal sampleCount for file nodes (wire-safe). */
  sampleCount?: string;
  path?: string;
}

export function engineeringTreeFromProject(document: ProjectDocumentJson): EngineeringTreeNode[] {
  const version = document.version as ProjectLoadVersion;
  const summary = summarizeLoadedProject({ document, version });
  return engineeringTreeFromSummary(summary, document);
}

export function engineeringTreeFromSummary(
  summary: ProjectSessionSummary,
  document?: ProjectDocumentJson,
): EngineeringTreeNode[] {
  const fileNodes: EngineeringTreeNode[] = summary.files.map((f) => {
    const full = document?.files.find((x) => x.metadata.id === f.id);
    const channels = (full?.channels ?? []).map((ch) => ({
      id: ch.id,
      label: ch.name,
      kind: 'channel' as const,
    }));
    return {
      id: f.id,
      label: channels.length
        ? `${f.name} (${f.sampleCount} samples, ${f.channelCount} ch)`
        : `${f.name} (${f.sampleCount} samples)`,
      kind: 'file' as const,
      sampleCount: f.sampleCount,
      path: f.path,
      children: channels.length ? channels : undefined,
    };
  });

  return [
    {
      id: 'proj-root',
      label: summary.name,
      kind: 'project',
      children: [
        {
          id: 'folder-iq',
          label: 'IQ Files',
          kind: 'folder',
          children: fileNodes,
        },
      ],
    },
  ];
}
