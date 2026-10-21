import {
  PROJECT_SCHEMA,
  PROJECT_WRITE_VERSION,
  sampleIndexToDecimal,
  type ProjectDocumentJson,
  type ProjectDocumentV6Json,
  type TimeRange,
  type TimeRangeJson,
  type ViewRange,
  type ViewRangeJson,
} from '@wss/contracts';
import { ProjectIoError } from './load-project.js';

export function encodeTimeRangeJson(range: TimeRange): TimeRangeJson {
  return {
    begin: sampleIndexToDecimal(range.begin),
    end: sampleIndexToDecimal(range.end),
  };
}

export function encodeViewRangeJson(range: ViewRange): ViewRangeJson {
  return {
    time: encodeTimeRangeJson(range.time),
    frequency: { lowerHz: range.frequency.lowerHz, upperHz: range.frequency.upperHz },
  };
}

/** Normalize a document to writeable v6 (schema + version forced). */
export function toProjectV6Document(document: ProjectDocumentJson): ProjectDocumentV6Json {
  return {
    ...document,
    schema: PROJECT_SCHEMA,
    version: PROJECT_WRITE_VERSION,
    name: document.name,
    files: document.files ?? [],
  };
}

export function serializeProjectJson(document: ProjectDocumentJson, pretty = true): string {
  const v6 = toProjectV6Document(document);
  if (v6.schema !== PROJECT_SCHEMA) {
    throw new ProjectIoError(`Refusing to write non-native schema: ${JSON.stringify(v6.schema)}`);
  }
  if (v6.version !== PROJECT_WRITE_VERSION) {
    throw new ProjectIoError(`Refusing to write non-v6 version: ${v6.version}`);
  }
  return pretty ? `${JSON.stringify(v6, null, 2)}\n` : JSON.stringify(v6);
}
