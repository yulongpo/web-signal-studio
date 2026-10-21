/**
 * Shared contracts.
 * Bot-F owns: sample-index, project-v6, annotation / channel-snapshot.
 * Bot-D owns: formats, chunk, spectral (re-exported here for one import path).
 */

export type { SampleIndex } from './sample-index.js';
export {
  SAMPLE_INDEX_MAX,
  isCanonicalSampleIndexDecimal,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
  assertSampleIndex,
  validateSampleIndexDecimal,
  compareSampleIndex,
  clampSampleIndex,
} from './sample-index.js';

export {
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  PROJECT_LOAD_VERSIONS,
  isSupportedProjectLoadVersion,
  type ProjectSchema,
  type ProjectWriteVersion,
  type ProjectLoadVersion,
  type TimeRangeJson,
  type TimeRange,
  type FrequencyRange,
  type ViewRangeJson,
  type ViewRange,
  type LoadStatus,
  type FileAvailabilityJson,
  type FileMetadataJson,
  type ProjectFileJson,
  type ProjectChannelJson,
  type ProjectDocumentJson,
  type ProjectDocumentV6Json,
} from './project-v6.js';

export {
  ANNOTATIONS_EXPORT_SCHEMA,
  ANNOTATION_STORE_SCHEMAS,
  ANNOTATION_SOURCE_KINDS,
  annotationRangeToViewRange,
  viewRangeToAnnotationRangeJson,
  timeRangeToJson,
  type AnnotationSourceKind,
  type ReviewStatus,
  type FrequencyFrame,
  type ChannelBindingKind,
  type TimeQuality,
  type FrequencyQuality,
  type AnnotationRangeJson,
  type AnnotationSegmentJson,
  type SourceIdentityJson,
  type AnnotationSourceSetJson,
  type AnnotationJson,
  type AnnotationChannelSnapshotJson,
  type AnnotationsDocumentJson,
  type AnnotationRange,
} from './annotation.js';

export * from './formats.js';
export {
  type ChunkReadRequest,
  type ChunkReadResponse,
  type AvailablePrefix,
  type CancelToken,
  abortSignalToCancelToken,
} from './chunk.js';
// DEFAULT_CHUNK_BYTES already exported from formats.js
export * from './spectral.js';

/** @deprecated Prefer AnnotationSourceKind PascalCase wire values. */
export type MarkerSource = 'sample_label' | 'manual' | 'algorithm';

/** @deprecated Prefer TimeRange / ViewRange from project-v6. */
export interface HalfOpenRange {
  begin: string;
  end: string;
}

/** @deprecated Prefer ProjectDocumentV6Json. */
export interface ProjectV6Meta {
  format: 'signal-studio-native-project';
  version: 6;
}
