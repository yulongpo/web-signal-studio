import {
  ANNOTATIONS_EXPORT_SCHEMA,
  ANNOTATION_SOURCE_KINDS,
  sampleIndexFromDecimal,
  sampleIndexToDecimal,
  type AnnotationJson,
  type AnnotationRange,
  type AnnotationRangeJson,
  type AnnotationSourceKind,
  type AnnotationsDocumentJson,
  type AnnotationSourceSetJson,
} from '@wss/contracts';
import { ProjectIoError } from './load-project.js';

export function isAnnotationSourceKind(value: unknown): value is AnnotationSourceKind {
  return typeof value === 'string' && (ANNOTATION_SOURCE_KINDS as readonly string[]).includes(value);
}

export function decodeAnnotationRangeJson(range: AnnotationRangeJson): AnnotationRange {
  return {
    start: sampleIndexFromDecimal(range.start),
    end: sampleIndexFromDecimal(range.end),
    lowerHz: range.lowerHz,
    upperHz: range.upperHz,
  };
}

export function encodeAnnotationRangeJson(range: AnnotationRange): AnnotationRangeJson {
  return {
    start: sampleIndexToDecimal(range.start),
    end: sampleIndexToDecimal(range.end),
    lowerHz: range.lowerHz,
    upperHz: range.upperHz,
  };
}

export function parseAnnotationsJson(text: string): AnnotationsDocumentJson {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch (err) {
    throw new ProjectIoError(
      `Annotations JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ProjectIoError('Annotations root must be a JSON object');
  }
  const root = raw as Record<string, unknown>;
  if (root.schema !== ANNOTATIONS_EXPORT_SCHEMA) {
    throw new ProjectIoError(
      `Unsupported annotations schema (want ${ANNOTATIONS_EXPORT_SCHEMA}, got ${JSON.stringify(root.schema)})`,
    );
  }
  if (typeof root.fileId !== 'string') {
    throw new ProjectIoError('Annotations fileId must be a string');
  }
  if (!Array.isArray(root.sourceSets) || !Array.isArray(root.annotations)) {
    throw new ProjectIoError('Annotations sourceSets/annotations must be arrays');
  }
  for (const set of root.sourceSets as AnnotationSourceSetJson[]) {
    if (!isAnnotationSourceKind(set.sourceKind)) {
      throw new ProjectIoError(`Invalid sourceSet.sourceKind: ${JSON.stringify(set.sourceKind)}`);
    }
  }
  for (const ann of root.annotations as AnnotationJson[]) {
    if (!isAnnotationSourceKind(ann.sourceKind)) {
      throw new ProjectIoError(`Invalid annotation.sourceKind: ${JSON.stringify(ann.sourceKind)}`);
    }
  }
  return root as unknown as AnnotationsDocumentJson;
}

export function serializeAnnotationsJson(document: AnnotationsDocumentJson, pretty = true): string {
  const out: AnnotationsDocumentJson = {
    schema: ANNOTATIONS_EXPORT_SCHEMA,
    fileId: document.fileId,
    sourceSets: document.sourceSets ?? [],
    annotations: document.annotations ?? [],
  };
  return pretty ? `${JSON.stringify(out, null, 2)}\n` : JSON.stringify(out);
}
