/**
 * Engineering tree model for project session (G19).
 *
 * Aligns with desktop `ui/project_tree_presentation.h` @ c1f2cce / tip 17471a6:
 * - kinds: project, file, channel, marks, annotationSource, mark, channels, ...
 * - presentation fields: title, detail, badges, count, active, sourceKind
 * - three-source mark groups: ImportedLabel | Manual | Algorithm
 *
 * Bot-B maps this into ProjectTree / uiStore; Bot-F does not edit those UI files.
 */

import {
  ANNOTATION_SOURCE_KINDS,
  type AnnotationJson,
  type AnnotationSourceKind,
  type AnnotationsDocumentJson,
  type ProjectChannelJson,
  type ProjectDocumentJson,
  type ProjectFileJson,
  type ProjectLoadVersion,
} from '@wss/contracts';
import { summarizeLoadedProject, type ProjectSessionSummary } from './project-session.js';

/** Desktop-aligned tree kinds (UserRole strings on native). */
export type EngineeringTreeKind =
  | 'project'
  | 'folder'
  | 'file'
  | 'channel'
  | 'marks'
  | 'annotationSource'
  | 'mark'
  | 'channels'
  | 'detectionRuns'
  | 'metadata';

/** Presentation colors matching native annotationSourceColor (approx hex). */
export const ANNOTATION_SOURCE_TREE_COLORS: Record<AnnotationSourceKind, string> = {
  ImportedLabel: '#65d2bd',
  Manual: '#edc56d',
  Algorithm: '#9aa7ff',
};

export const ANNOTATION_SOURCE_TREE_LABELS: Record<AnnotationSourceKind, string> = {
  ImportedLabel: 'Imported labels',
  Manual: 'Manual marks',
  Algorithm: 'Algorithm results',
};


/** Desktop ChannelSourceRelation display (c1f2cce relationText). */
export type ChannelSourceRelationCode =
  | 'Current'
  | 'Changed'
  | 'Missing'
  | 'Rejected'
  | 'Unconfirmed'
  | 'LegacyNeedsReview';

export const CHANNEL_SOURCE_RELATION_DETAILS: Record<ChannelSourceRelationCode, string> = {
  Current: 'source current',
  Changed: 'source changed; keep create snapshot',
  Missing: 'source deleted or missing',
  Rejected: 'source quality: ignored',
  Unconfirmed: 'legacy segment confirm; keep create snapshot',
  LegacyNeedsReview: 'legacy source needs review',
};

export function normalizeChannelSourceRelation(
  raw: string | undefined,
): ChannelSourceRelationCode | undefined {
  if (!raw) return undefined;
  const key = raw.replace(/[_\s-]+/g, '').toLowerCase();
  const map: Record<string, ChannelSourceRelationCode> = {
    current: 'Current',
    changed: 'Changed',
    missing: 'Missing',
    rejected: 'Rejected',
    unconfirmed: 'Unconfirmed',
    legacyneedsreview: 'LegacyNeedsReview',
  };
  return map[key];
}

export function channelRelationDetail(raw: string | undefined): string | undefined {
  const code = normalizeChannelSourceRelation(raw);
  return code ? CHANNEL_SOURCE_RELATION_DETAILS[code] : undefined;
}

export interface EngineeringTreeNode {
  id: string;
  /** Primary display label (TitleRole). */
  label: string;
  kind: EngineeringTreeKind;
  children?: EngineeringTreeNode[];
  /** Compact second line / tooltip detail (DetailRole). */
  detail?: string;
  /** Short badges (BadgeRole), e.g. source relation. */
  badges?: string[];
  /** Child count for group headers (CountRole). */
  count?: number;
  /** Active file / current mark cue (ActiveRole). */
  active?: boolean;
  /** Selected mark cue. */
  selected?: boolean;
  /** Soft-deleted mark. */
  softDeleted?: boolean;
  /** Three-source kind when kind is annotationSource or mark. */
  sourceKind?: AnnotationSourceKind;
  /** Suggested foreground for marks / source groups. */
  color?: string;
  /** Decimal sampleCount for file nodes. */
  sampleCount?: string;
  path?: string;
  fileId?: string;
  channelId?: string;
  markId?: string;
  /** Full tooltip (PresentedToolTipRole). */
  tooltip?: string;
  /** Underlying source tooltip before presentation rewrite. */
  sourceTooltip?: string;
  /** TitleRole alias (same as label when set). */
  title?: string;
}

export interface EngineeringTreeBuildOptions {
  /** Annotations export/doc; when omitted, mark branches are empty groups. */
  annotations?: AnnotationsDocumentJson | AnnotationsDocumentJson[];
  /** Prefer project.activeFileId when unset. */
  activeFileId?: string;
  activeMarkId?: string;
  selectedMarkIds?: string[];
  /** Include empty three-source groups (default true, matches desktop always-on folders). */
  includeEmptySourceGroups?: boolean;
}

function shortRate(value: number, samples = false): string {
  if (!Number.isFinite(value)) return '?';
  const magnitude = Math.abs(value);
  const scale = magnitude >= 1e9 ? 1e9 : magnitude >= 1e6 ? 1e6 : magnitude >= 1e3 ? 1e3 : 1;
  const prefix = scale === 1e9 ? 'G' : scale === 1e6 ? 'M' : scale === 1e3 ? 'k' : '';
  return `${Number((value / scale).toPrecision(6))} ${prefix}${samples ? 'S/s' : 'Hz'}`;
}

function channelBadges(ch: ProjectChannelJson): string[] {
  const badges: string[] = [];
  const rel = normalizeChannelSourceRelation(ch.sourceRelation);
  if (rel === 'Changed') badges.push('diff');
  else if (rel === 'Missing') badges.push('missing');
  else if (rel === 'Rejected') badges.push('ignored');
  else if (rel === 'Unconfirmed') badges.push('review');
  else if (rel === 'LegacyNeedsReview') badges.push('legacy');
  const proc = (ch.processingState ?? '').replace(/[_\s-]+/g, '').toLowerCase();
  if (proc === 'sourcemissing') badges.push('missing');
  else if (proc === 'invalid') badges.push('invalid');
  else if (proc === 'legacyneedsreview') badges.push('pending');
  // Desktop: unread when sourceTime.end beyond available samples
  const avail = ch.sourceTime?.end;
  // available on metadata checked at file level; channel-only heuristic if end present
  if (avail && avail !== '0') {
    /* keep relation badges primary; unread applied in buildChannelsBranch with file meta */
  }
  return [...new Set(badges)];
}

function fileBadges(file: ProjectFileJson): string[] {
  const badges: string[] = [];
  const available = file.metadata.availableSamples ?? file.metadata.sampleCount;
  const viewEnd = file.view?.time?.end;
  if (viewEnd && available) {
    try {
      if (BigInt(viewEnd) > BigInt(available)) badges.push('unread');
    } catch {
      /* ignore non-decimal */
    }
  }
  return badges;
}

function channelDetail(ch: ProjectChannelJson, file: ProjectFileJson): string {
  const parts: string[] = [];
  if (ch.centerFrequencyHz != null) parts.push(`CF ${shortRate(ch.centerFrequencyHz)}`);
  if (ch.bandwidthHz != null) parts.push(`BW ${shortRate(ch.bandwidthHz)}`);
  if (ch.outputSampleRateHz != null) parts.push(shortRate(ch.outputSampleRateHz, true));
  if (ch.sourceTime) {
    parts.push(`src [${ch.sourceTime.begin}, ${ch.sourceTime.end})`);
  }
  const rel = channelRelationDetail(ch.sourceRelation);
  if (rel) parts.push(rel);
  const snap = ch.sourceSnapshot as { revisionId?: unknown } | undefined;
  if (snap && typeof snap.revisionId === 'string' && snap.revisionId) {
    parts.push(`create rev ${snap.revisionId}`);
  }
  if (parts.length === 0) {
    parts.push(`file ${file.metadata.name}`);
  }
  return parts.join(' | ');
}

function fileDetail(file: ProjectFileJson): string {
  const m = file.metadata;
  const bits = [
    shortRate(m.sampleRateHz, true),
    `CF ${shortRate(m.centerFrequencyHz)}`,
    `${m.sampleCount} samples`,
  ];
  return bits.join(' | ');
}

function markDetail(ann: AnnotationJson): string {
  const start = ann.start ?? '?';
  const end = ann.end ?? '?';
  const hz =
    ann.lowerHz != null && ann.upperHz != null
      ? ` | ${shortRate(ann.lowerHz)}-${shortRate(ann.upperHz)}`
      : '';
  return `[${start}, ${end})${hz}`;
}

function annotationsForFile(
  fileId: string,
  annotations?: AnnotationsDocumentJson | AnnotationsDocumentJson[],
): AnnotationJson[] {
  if (!annotations) return [];
  const docs = Array.isArray(annotations) ? annotations : [annotations];
  const out: AnnotationJson[] = [];
  for (const doc of docs) {
    if (doc.fileId !== fileId) continue;
    out.push(...(doc.annotations ?? []));
  }
  return out;
}

function buildMarksBranch(
  fileId: string,
  marks: AnnotationJson[],
  opts: EngineeringTreeBuildOptions,
): EngineeringTreeNode {
  const includeEmpty = opts.includeEmptySourceGroups !== false;
  const selected = new Set(opts.selectedMarkIds ?? []);
  const sourceChildren: EngineeringTreeNode[] = [];

  for (const kind of ANNOTATION_SOURCE_KINDS) {
    const ofKind = marks.filter((m) => m.sourceKind === kind && m.deleted !== true);
    const softOfKind = marks.filter((m) => m.sourceKind === kind && m.deleted === true);
    if (!includeEmpty && ofKind.length === 0 && softOfKind.length === 0) continue;

    const markNodes: EngineeringTreeNode[] = [...ofKind, ...softOfKind].map((ann) => {
      const detail = markDetail(ann);
      const label = ann.name || ann.id;
      return {
        id: `mark:${fileId}:${ann.id}`,
        label,
        title: label,
        kind: 'mark' as const,
        detail,
        tooltip: `${label} (${kind})\n${detail}`,
        sourceTooltip: kind,
        sourceKind: kind,
        color: ANNOTATION_SOURCE_TREE_COLORS[kind],
        softDeleted: ann.deleted === true,
        selected: selected.has(ann.id),
        active: opts.activeMarkId === ann.id,
        fileId,
        markId: ann.id,
        badges: ann.deleted === true ? ['deleted'] : undefined,
      };
    });

    const srcLabel = ANNOTATION_SOURCE_TREE_LABELS[kind];
    sourceChildren.push({
      id: `src:${fileId}:${kind}`,
      label: srcLabel,
      title: srcLabel,
      kind: 'annotationSource',
      sourceKind: kind,
      color: ANNOTATION_SOURCE_TREE_COLORS[kind],
      count: ofKind.length,
      detail: `${ofKind.length} mark(s)`,
      tooltip: `${srcLabel}: ${ofKind.length} live`,
      fileId,
      children: markNodes.length ? markNodes : undefined,
    });
  }

  const liveCount = marks.filter((m) => m.deleted !== true).length;
  return {
    id: `marks:${fileId}`,
    label: '标注', title: '标注',
    kind: 'marks',
    count: liveCount,
    detail: `${liveCount} mark(s)`,
    fileId,
    children: sourceChildren,
  };
}

function buildChannelsBranch(file: ProjectFileJson): EngineeringTreeNode | undefined {
  const channels = file.channels ?? [];
  if (channels.length === 0) return undefined;
  const available = file.metadata.availableSamples ?? file.metadata.sampleCount;
  return {
    id: `channels:${file.metadata.id}`,
    label: '通道',
    kind: 'channels',
    title: '通道',
    count: channels.length,
    fileId: file.metadata.id,
    children: channels.map((ch) => {
      const badges = channelBadges(ch);
      try {
        if (ch.sourceTime?.end && available && BigInt(ch.sourceTime.end) > BigInt(available)) {
          badges.push('unread');
        }
      } catch {
        /* ignore */
      }
      const detail = channelDetail(ch, file);
      const tooltip = detail;
      return {
        id: ch.id,
        label: ch.name,
        title: ch.name,
        kind: 'channel' as const,
        detail,
        tooltip,
        sourceTooltip: channelRelationDetail(ch.sourceRelation),
        badges: [...new Set(badges)],
        fileId: file.metadata.id,
        channelId: ch.id,
      };
    }),
  };
}

function buildDetectionRunsBranch(file: ProjectFileJson): EngineeringTreeNode | undefined {
  const runs = file.detectionRuns ?? [];
  if (runs.length === 0) return undefined;
  return {
    id: `detectionRuns:${file.metadata.id}`,
    label: '检测运行',
    title: '检测运行',
    kind: 'detectionRuns',
    count: runs.length,
    fileId: file.metadata.id,
    children: runs.map((runId, i) => ({
      id: `run:${file.metadata.id}:${runId}`,
      label: runId,
      title: runId,
      kind: 'metadata' as const,
      detail: `detection run ${i + 1}`,
      fileId: file.metadata.id,
    })),
  };
}

function buildFileNode(
  file: ProjectFileJson,
  opts: EngineeringTreeBuildOptions,
  activeFileId?: string,
): EngineeringTreeNode {
  const fileId = file.metadata.id;
  const marks = annotationsForFile(fileId, opts.annotations);
  const children: EngineeringTreeNode[] = [];
  const wantMarks =
    opts.annotations != null || opts.includeEmptySourceGroups === true;
  if (wantMarks) {
    children.push(
      buildMarksBranch(fileId, marks, {
        ...opts,
        activeMarkId: activeFileId === fileId ? opts.activeMarkId : undefined,
        selectedMarkIds: activeFileId === fileId ? opts.selectedMarkIds : opts.selectedMarkIds,
      }),
    );
  }
  const chBranch = buildChannelsBranch(file);
  if (chBranch) children.push(chBranch);

  const detail = fileDetail(file);
  const runsBranch = buildDetectionRunsBranch(file);
  if (runsBranch) children.push(runsBranch);
  return {
    id: fileId,
    label: file.metadata.name,
    title: file.metadata.name,
    kind: 'file',
    detail,
    tooltip: `${file.metadata.name}\n${detail}\n${file.metadata.path}`,
    sourceTooltip: file.metadata.path,
    badges: fileBadges(file),
    sampleCount: file.metadata.sampleCount,
    path: file.metadata.path,
    active: activeFileId === fileId,
    fileId,
    count: marks.filter((m) => m.deleted !== true).length,
    children,
  };
}

/**
 * Full G19 engineering tree from a loaded project (+ optional annotations).
 * Prefer this over summary-only tree when marks/sources must appear.
 */
export function engineeringTreeFromSession(
  document: ProjectDocumentJson,
  opts: EngineeringTreeBuildOptions = {},
): EngineeringTreeNode[] {
  const activeFileId = opts.activeFileId ?? document.activeFileId;
  const fileActiveMark =
    activeFileId != null
      ? document.files.find((f) => f.metadata.id === activeFileId)?.activeMarkId
      : undefined;
  const fileSelected =
    activeFileId != null
      ? document.files.find((f) => f.metadata.id === activeFileId)?.selectedMarkIds
      : undefined;
  const merged: EngineeringTreeBuildOptions = {
    ...opts,
    activeMarkId: opts.activeMarkId ?? fileActiveMark,
    selectedMarkIds: opts.selectedMarkIds ?? fileSelected,
  };

  const fileNodes = document.files.map((f) => buildFileNode(f, merged, activeFileId));

  return [
    {
      id: 'proj-root',
      label: document.name,
      kind: 'project',
      count: document.files.length,
      detail: `${document.files.length} 个文件`,
      active: true,
      children: [
        {
          id: 'folder-iq',
          label: 'IQ 文件', title: 'IQ 文件',
          kind: 'folder',
          count: fileNodes.length,
          children: fileNodes,
        },
      ],
    },
  ];
}

/** Backward-compatible project-only tree (no mark branches). */
export function engineeringTreeFromProject(document: ProjectDocumentJson): EngineeringTreeNode[] {
  return engineeringTreeFromSession(document, { includeEmptySourceGroups: false, annotations: undefined });
}

export function engineeringTreeFromSummary(
  summary: ProjectSessionSummary,
  document?: ProjectDocumentJson,
): EngineeringTreeNode[] {
  if (document) return engineeringTreeFromProject(document);
  const fileNodes: EngineeringTreeNode[] = summary.files.map((f) => ({
    id: f.id,
    label: `${f.name} (${f.sampleCount} samples, ${f.channelCount} ch)`,
    kind: 'file' as const,
    sampleCount: f.sampleCount,
    path: f.path,
    detail: `${f.sampleCount} samples | ${f.channelCount} ch`,
  }));
  return [
    {
      id: 'proj-root',
      label: summary.name,
      kind: 'project',
      children: [
        {
          id: 'folder-iq',
          label: 'IQ 文件', title: 'IQ 文件',
          kind: 'folder',
          children: fileNodes,
        },
      ],
    },
  ];
}

/** Flatten mark nodes for e2e / host selection wiring. */
export function listMarkNodes(tree: EngineeringTreeNode[]): EngineeringTreeNode[] {
  const out: EngineeringTreeNode[] = [];
  const walk = (n: EngineeringTreeNode) => {
    if (n.kind === 'mark') out.push(n);
    for (const c of n.children ?? []) walk(c);
  };
  for (const root of tree) walk(root);
  return out;
}

export function summarizeLoadedProjectTree(
  document: ProjectDocumentJson,
  opts?: EngineeringTreeBuildOptions,
): { summary: ProjectSessionSummary; tree: EngineeringTreeNode[] } {
  const version = document.version as ProjectLoadVersion;
  const summary = summarizeLoadedProject({ document, version });
  return { summary, tree: engineeringTreeFromSession(document, opts) };
}
