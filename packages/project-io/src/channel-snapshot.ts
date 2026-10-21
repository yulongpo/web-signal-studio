import {
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
  type AnnotationChannelSnapshotJson,
  type AnnotationSourceKind,
  type ChannelBindingKind,
  type ProjectChannelJson,
  type ReviewStatus,
  type SourceIdentityJson,
  type ViewRange,
  type ViewRangeJson,
} from '@wss/contracts';
import { isAnnotationSourceKind } from './annotations.js';
import { decodeViewRangeJson, ProjectIoError } from './load-project.js';
import { encodeViewRangeJson } from './save-project.js';

const BINDING_KINDS: readonly ChannelBindingKind[] = ['LocatedSegment', 'UserRange'];
const REVIEW_STATUSES: readonly ReviewStatus[] = ['Pending', 'Accepted', 'Rejected'];

export interface AnnotationChannelSnapshot {
  annotationId: string;
  segmentId: string;
  revisionId: string;
  name: string;
  range: ViewRange;
  bindingKind: ChannelBindingKind;
  boundRange: ViewRange;
  sourceKind: AnnotationSourceKind;
  reviewStatus: ReviewStatus;
  sourceIdentity: SourceIdentityJson;
}

export function encodeChannelSnapshotJson(
  snapshot: AnnotationChannelSnapshot,
): AnnotationChannelSnapshotJson {
  return {
    annotationId: snapshot.annotationId,
    segmentId: snapshot.segmentId,
    revisionId: snapshot.revisionId,
    name: snapshot.name,
    range: encodeViewRangeJson(snapshot.range),
    bindingKind: snapshot.bindingKind,
    boundRange: encodeViewRangeJson(snapshot.boundRange),
    sourceKind: snapshot.sourceKind,
    reviewStatus: snapshot.reviewStatus,
    sourceIdentity: snapshot.sourceIdentity,
  };
}

export function decodeChannelSnapshotJson(
  json: AnnotationChannelSnapshotJson,
  projectVersion = 6,
): AnnotationChannelSnapshot {
  if (!BINDING_KINDS.includes(json.bindingKind)) {
    throw new ProjectIoError(`Invalid bindingKind: ${JSON.stringify(json.bindingKind)}`);
  }
  if (!isAnnotationSourceKind(json.sourceKind)) {
    throw new ProjectIoError(`Invalid sourceKind: ${JSON.stringify(json.sourceKind)}`);
  }
  if (!REVIEW_STATUSES.includes(json.reviewStatus)) {
    throw new ProjectIoError(`Invalid reviewStatus: ${JSON.stringify(json.reviewStatus)}`);
  }
  const range = decodeViewRangeJson(json.range);
  let boundRange: ViewRange;
  if (json.boundRange) {
    boundRange = decodeViewRangeJson(json.boundRange);
  } else if (projectVersion < 6) {
    boundRange = range;
  } else {
    throw new ProjectIoError('v6 channel snapshot requires boundRange');
  }
  for (const id of [json.annotationId, json.segmentId, json.revisionId] as const) {
    if (typeof id !== 'string' || id.length === 0) {
      throw new ProjectIoError('channel snapshot annotationId/segmentId/revisionId required');
    }
  }
  return {
    annotationId: json.annotationId,
    segmentId: json.segmentId,
    revisionId: json.revisionId,
    name: json.name,
    range,
    bindingKind: json.bindingKind,
    boundRange,
    sourceKind: json.sourceKind,
    reviewStatus: json.reviewStatus,
    sourceIdentity: json.sourceIdentity,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Narrow an unknown embedded object to AnnotationChannelSnapshotJson shape (ids + range present). */
export function isAnnotationChannelSnapshotJson(
  value: unknown,
): value is AnnotationChannelSnapshotJson {
  if (!isPlainObject(value)) return false;
  return (
    typeof value.annotationId === 'string' &&
    typeof value.segmentId === 'string' &&
    typeof value.revisionId === 'string' &&
    typeof value.name === 'string' &&
    isPlainObject(value.range) &&
    typeof value.bindingKind === 'string' &&
    typeof value.sourceKind === 'string' &&
    typeof value.reviewStatus === 'string' &&
    isPlainObject(value.sourceIdentity)
  );
}

/**
 * Attach a typed in-memory snapshot onto a project channel for v6 persistence.
 * Sets sourceSnapshot (wire JSON with decimal sample strings) plus related id fields.
 */
export function attachChannelSnapshot(
  channel: ProjectChannelJson,
  snapshot: AnnotationChannelSnapshot,
): ProjectChannelJson {
  const encoded = encodeChannelSnapshotJson(snapshot);
  return {
    ...channel,
    annotationId: snapshot.annotationId,
    segmentId: snapshot.segmentId,
    revisionId: snapshot.revisionId,
    sourceSnapshot: encoded as unknown as Record<string, unknown>,
    sourceIdentity: { ...snapshot.sourceIdentity } as Record<string, unknown>,
  };
}

/**
 * Read/decode a channel's embedded sourceSnapshot.
 * Returns undefined when no snapshot is present.
 * v6 requires boundRange; pre-v6 falls back to range (via decodeChannelSnapshotJson).
 */
export function readChannelSnapshot(
  channel: ProjectChannelJson,
  projectVersion = 6,
): AnnotationChannelSnapshot | undefined {
  const raw = channel.sourceSnapshot;
  if (raw == null) return undefined;
  if (!isAnnotationChannelSnapshotJson(raw)) {
    throw new ProjectIoError('channel.sourceSnapshot is not a valid AnnotationChannelSnapshotJson');
  }
  return decodeChannelSnapshotJson(raw, projectVersion);
}

export function makeLocatedSegmentSnapshot(input: {
  annotationId: string;
  segmentId: string;
  revisionId: string;
  name: string;
  begin: bigint;
  end: bigint;
  lowerHz: number;
  upperHz: number;
  fileId: string;
  sourceKind?: AnnotationSourceKind;
  reviewStatus?: ReviewStatus;
}): AnnotationChannelSnapshot {
  const view: ViewRange = {
    time: { begin: input.begin, end: input.end },
    frequency: { lowerHz: input.lowerHz, upperHz: input.upperHz },
  };
  return {
    annotationId: input.annotationId,
    segmentId: input.segmentId,
    revisionId: input.revisionId,
    name: input.name,
    range: view,
    bindingKind: 'LocatedSegment',
    boundRange: view,
    sourceKind: input.sourceKind ?? 'Manual',
    reviewStatus: input.reviewStatus ?? 'Accepted',
    sourceIdentity: { fileId: input.fileId },
  };
}

export function viewRangeJsonFromDecimals(
  begin: string,
  end: string,
  lowerHz: number,
  upperHz: number,
): ViewRangeJson {
  return {
    time: {
      begin: sampleIndexToDecimal(sampleIndexFromDecimal(begin)),
      end: sampleIndexToDecimal(sampleIndexFromDecimal(end)),
    },
    frequency: { lowerHz, upperHz },
  };
}

