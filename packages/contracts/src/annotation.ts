/**
 * Annotation / three-source / channel-snapshot contracts.
 * Annotation JSON ranges use start/end (NOT begin/end) as decimal strings + lowerHz/upperHz.
 * Export/document schema: signalstudio-annotations-v1
 */

import type { SampleFormatDescriptor } from './formats.js';
import type {
  FrequencyRange,
  TimeRange,
  TimeRangeJson,
  ViewRange,
  ViewRangeJson,
} from './project-v6.js';
import type { SampleIndex } from './sample-index.js';

export const ANNOTATIONS_EXPORT_SCHEMA = 'signalstudio-annotations-v1' as const;

/** Store shard schemas (content-addressed annotation store). */
export const ANNOTATION_STORE_SCHEMAS = {
  index: 'signal-studio-annotation-index',
  bundle: 'signal-studio-annotations',
  source: 'signal-studio-annotation-source',
} as const;

export type AnnotationSourceKind = 'ImportedLabel' | 'Manual' | 'Algorithm';
export const ANNOTATION_SOURCE_KINDS: readonly AnnotationSourceKind[] = [
  'ImportedLabel',
  'Manual',
  'Algorithm',
] as const;

export type ReviewStatus = 'Pending' | 'Accepted' | 'Rejected';
export type FrequencyFrame = 'RF' | 'Baseband' | 'RealOneSided';
export type ChannelBindingKind = 'LocatedSegment' | 'UserRange';

export type TimeQuality =
  | 'SampleLabel'
  | 'RoundedLabel'
  | 'AlgorithmEstimated'
  | 'Manual'
  | 'WindowObservation'
  | 'Unknown';

export type FrequencyQuality =
  | 'NominalLabel'
  | 'ModelEstimated'
  | 'Refined'
  | 'Manual'
  | 'Unknown';

/** Annotation wire range: start/end decimal strings (not begin/end). */
export interface AnnotationRangeJson {
  start: string;
  end: string;
  lowerHz: number;
  upperHz: number;
}

export interface AnnotationSegmentJson {
  id: string;
  start: string;
  end: string;
  lowerHz: number;
  upperHz: number;
  timeQuality?: TimeQuality;
  frequencyQuality?: FrequencyQuality;
  confirmed?: boolean;
  uncertaintySamples?: string;
  frequencyFrame?: FrequencyFrame;
  clippedAtRoi?: boolean;
}

export interface SourceIdentityJson {
  projectGeneration?: string;
  formatRevision?: string;
  fileId: string;
  path?: string;
  quickFingerprint?: string;
  contentHash?: string;
  selectedSampleChannel?: string;
  sampleFormat?: SampleFormatDescriptor;
  sampleRateHz?: number;
  centerFrequencyHz?: number;
  effectiveFrequency?: FrequencyRange;
  physicalSamples?: string;
  availableSamples?: string;
  hashedRange?: { start: string; end: string };
}

export interface AnnotationSourceSetJson {
  id: string;
  fileId: string;
  sampleChannel?: string;
  sourceKind: AnnotationSourceKind;
  formatId?: string;
  parserId?: string;
  parserVersion?: string;
  profileId?: string;
  profileVersion?: string;
  originalPath?: string;
  originalText?: string;
  sourceHash?: string;
  supplementalOriginalText?: string;
  supplementalHash?: string;
  coordinateInterpretation?: string;
  runId?: string;
  sourceIdentity?: SourceIdentityJson;
  diagnostics?: Array<Record<string, unknown>>;
  deleted?: boolean;
}

export interface AnnotationJson {
  id: string;
  name: string;
  /** Compatibility projection; prefer segments. */
  start?: string;
  end?: string;
  lowerHz?: number;
  upperHz?: number;
  fileId?: string;
  sourceSetId?: string;
  originRecordId?: string;
  sourceKind: AnnotationSourceKind;
  classLabel?: string | null;
  note?: string;
  activeSegmentId?: string;
  revisionId?: string;
  segments?: AnnotationSegmentJson[];
  observation?: AnnotationRangeJson;
  observationFrequencyFrame?: FrequencyFrame;
  observationTimeQuality?: TimeQuality;
  originEvidence?: Record<string, unknown>;
  reviewStatus?: ReviewStatus;
  reviewRevisionId?: string;
  reviewHistory?: Array<Record<string, unknown>>;
  revisions?: Array<Record<string, unknown>>;
  derivedFrom?: string[];
  deleted?: boolean;
}

/**
 * Channel snapshot (v6): boundRange required on write.
 * bindingKind: LocatedSegment | UserRange
 */
export interface AnnotationChannelSnapshotJson {
  annotationId: string;
  segmentId: string;
  revisionId: string;
  name: string;
  /** ViewRange wire: time.begin/end + frequency.lowerHz/upperHz (project convention). */
  range: ViewRangeJson;
  bindingKind: ChannelBindingKind;
  /** Required for v6 writes; pre-v6 load may fall back to range. */
  boundRange: ViewRangeJson;
  sourceKind: AnnotationSourceKind;
  reviewStatus: ReviewStatus;
  sourceIdentity: SourceIdentityJson;
}

export interface AnnotationsDocumentJson {
  schema: typeof ANNOTATIONS_EXPORT_SCHEMA;
  fileId: string;
  sourceSets: AnnotationSourceSetJson[];
  annotations: AnnotationJson[];
}

/** In-memory helpers (bigint indexes). */
export interface AnnotationRange {
  start: SampleIndex;
  end: SampleIndex;
  lowerHz: number;
  upperHz: number;
}

export function annotationRangeToViewRange(range: AnnotationRange): ViewRange {
  return {
    time: { begin: range.start, end: range.end },
    frequency: { lowerHz: range.lowerHz, upperHz: range.upperHz },
  };
}

export function viewRangeToAnnotationRangeJson(range: ViewRange): AnnotationRangeJson {
  return {
    start: range.time.begin.toString(10),
    end: range.time.end.toString(10),
    lowerHz: range.frequency.lowerHz,
    upperHz: range.frequency.upperHz,
  };
}

export function timeRangeToJson(range: TimeRange): TimeRangeJson {
  return { begin: range.begin.toString(10), end: range.end.toString(10) };
}
