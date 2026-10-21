import {
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
  type AnnotationChannelSnapshotJson,
  type AnnotationSourceKind,
  type ChannelBindingKind,
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
