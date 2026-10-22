/**
 * Native project JSON v6 types (schema: signal-studio-native-project).
 * Wire form uses begin/end decimal strings inside time; frequency uses lowerHz/upperHz numbers.
 * Write always emits version 6; load accepts versions 1-6.
 */

import type { SampleFormatDescriptor } from './formats.js';
import type { SampleIndex } from './sample-index.js';

export const PROJECT_SCHEMA = 'signal-studio-native-project' as const;
export type ProjectSchema = typeof PROJECT_SCHEMA;

export const PROJECT_WRITE_VERSION = 6 as const;
export type ProjectWriteVersion = typeof PROJECT_WRITE_VERSION;

/** Versions accepted by load (native project_store). */
export const PROJECT_LOAD_VERSIONS = [1, 2, 3, 4, 5, 6] as const;
export type ProjectLoadVersion = (typeof PROJECT_LOAD_VERSIONS)[number];

/** Wire-form time range: sample indexes as canonical decimal strings. */
export interface TimeRangeJson {
  begin: string;
  end: string;
}

/** In-memory time range. */
export interface TimeRange {
  begin: SampleIndex;
  end: SampleIndex;
}

export interface FrequencyRange {
  lowerHz: number;
  upperHz: number;
}

/** Project / channel view range (wire). */
export interface ViewRangeJson {
  time: TimeRangeJson;
  frequency: FrequencyRange;
}

export interface ViewRange {
  time: TimeRange;
  frequency: FrequencyRange;
}

export type LoadStatus = 'ready' | 'loading' | 'partial' | 'failed';

export interface FileAvailabilityJson {
  availableSamples?: string;
  status?: LoadStatus;
  generation?: string;
  fingerprint?: string;
  error?: string;
}

export interface FileMetadataJson {
  id: string;
  name: string;
  path: string;
  sampleRateHz: number;
  centerFrequencyHz: number;
  /** Canonical decimal sample count (uint64). */
  sampleCount: string;
  availableSamples?: string;
  sourceFingerprint?: string;
  demo?: boolean;
  demoSeed?: number;
  declaredBandwidthHz?: number;
  effectiveBandwidthHz?: number;
  sampleFormat?: SampleFormatDescriptor;
}

export interface ProjectFileJson {
  metadata: FileMetadataJson;
  view?: ViewRangeJson;
  /** Opaque display blob. A5: may include spectral_settings_json / spectrogramSettings / stftSize. */
  display?: Record<string, unknown>;
  channels?: ProjectChannelJson[];
  selectedMarkIds?: string[];
  activeMarkId?: string;
  annotationLayers?: [boolean, boolean, boolean];
  annotationFilter?: Record<string, unknown>;
  annotationIndex?: Record<string, unknown>;
  detectionRuns?: string[];
}

export interface ProjectChannelJson {
  id: string;
  name: string;
  sourceMarkId?: string;
  centerFrequencyHz?: number;
  bandwidthHz?: number;
  sourceTime?: TimeRangeJson;
  outputSampleRateHz?: number;
  filter?: string;
  processingState?: string;
  configVersion?: string;
  wholeSource?: boolean;
  preserveSourceTime?: boolean;
  page?: string;
  visibleSourceTime?: TimeRangeJson;
  visibleBasebandFrequency?: FrequencyRange;
  annotationId?: string;
  segmentId?: string;
  revisionId?: string;
  /** Opaque channel snapshot reference / embedded object (v6). */
  sourceSnapshot?: Record<string, unknown>;
  sourceIdentity?: Record<string, unknown>;
  sourceRelation?: string;
  [key: string]: unknown;
}

/**
 * Root project document (wire JSON).
 * schema must be exactly signal-studio-native-project.
 */
export interface ProjectDocumentJson {
  schema: ProjectSchema;
  /** Emit 6 on write; load accepts 1-6. */
  version: number;
  name: string;
  activeFileId?: string;
  activeChannelId?: string;
  narrowbandWorkspaceOpen?: boolean;
  files: ProjectFileJson[];
}

export interface ProjectDocumentV6Json extends ProjectDocumentJson {
  version: ProjectWriteVersion;
}

export function isSupportedProjectLoadVersion(version: number): version is ProjectLoadVersion {
  return (PROJECT_LOAD_VERSIONS as readonly number[]).includes(version);
}

