import {
  PROJECT_SCHEMA,
  isSupportedProjectLoadVersion,
  sampleIndexFromDecimal,
  type ProjectDocumentJson,
  type ProjectLoadVersion,
  type TimeRange,
  type TimeRangeJson,
  type ViewRange,
  type ViewRangeJson,
} from '@wss/contracts';

export class ProjectIoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectIoError';
  }
}

export interface LoadedProject {
  version: ProjectLoadVersion;
  document: ProjectDocumentJson;
}

/**
 * Parse native project JSON text.
 *
 * Important: sample indexes must be canonical decimal **strings** on the wire.
 * JSON.parse of a numeric literal past Number.MAX_SAFE_INTEGER loses
 * precision irreversibly - a reviver cannot restore rounded digits. Do not emit
 * bare JSON Numbers for sampleCount / begin / end / start / end indexes.
 */
export function parseProjectJson(text: string): LoadedProject {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch (err) {
    throw new ProjectIoError(
      `Project JSON parse failed: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ProjectIoError('Project root must be a JSON object');
  }
  const root = raw as Record<string, unknown>;
  if (root.schema !== PROJECT_SCHEMA) {
    throw new ProjectIoError(
      `Unsupported project schema (want ${PROJECT_SCHEMA}, got ${JSON.stringify(root.schema)})`,
    );
  }
  const version = root.version;
  if (typeof version !== 'number' || !isSupportedProjectLoadVersion(version)) {
    throw new ProjectIoError(`Unsupported native project version: ${JSON.stringify(version)}`);
  }
  if (typeof root.name !== 'string') {
    throw new ProjectIoError('Project name must be a string');
  }
  if (!Array.isArray(root.files)) {
    throw new ProjectIoError('Project files must be an array');
  }
  return { version, document: root as unknown as ProjectDocumentJson };
}

export function decodeTimeRangeJson(range: TimeRangeJson): TimeRange {
  return {
    begin: sampleIndexFromDecimal(range.begin),
    end: sampleIndexFromDecimal(range.end),
  };
}

export function decodeViewRangeJson(range: ViewRangeJson): ViewRange {
  return {
    time: decodeTimeRangeJson(range.time),
    frequency: { lowerHz: range.frequency.lowerHz, upperHz: range.frequency.upperHz },
  };
}
