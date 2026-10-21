/**
 * G19–G20 validation: only these IQ demo paths may be used for Bot-F ui-parity
 * evidence on HH-laptop. Rebuild tree is READ-ONLY — never write there.
 */

/** Canonical demo directory (Windows). */
export const SIGMF_DEMO_DIR =
  'D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo';

export const SIGMF_DEMO_BASENAME = '0000000';

export const SIGMF_DEMO_META_PATH = `${SIGMF_DEMO_DIR}\\0000000.sigmf-meta`;
export const SIGMF_DEMO_DATA_PATH = `${SIGMF_DEMO_DIR}\\0000000.sigmf-data`;
export const SIGMF_DEMO_JSON_PATH = `${SIGMF_DEMO_DIR}\\0000000.json`;

const ALLOWED = new Set(
  [SIGMF_DEMO_META_PATH, SIGMF_DEMO_DATA_PATH, SIGMF_DEMO_JSON_PATH].map(normalizePath),
);

export function normalizePath(path: string): string {
  return path.replace(/\//g, '\\').replace(/\\+/g, '\\').toLowerCase();
}

/** Returns true when path is one of the three allowed demo files. */
export function isAllowedDemoIqPath(path: string): boolean {
  return ALLOWED.has(normalizePath(path));
}

export function assertAllowedDemoIqPath(path: string): string {
  if (!isAllowedDemoIqPath(path)) {
    throw new RangeError(
      `IQ open path not allowed for G19/G20 validation (want ${SIGMF_DEMO_DIR}\\0000000.sigmf-*|json): ${JSON.stringify(path)}`,
    );
  }
  return path;
}

export function listAllowedDemoIqPaths(): string[] {
  return [SIGMF_DEMO_META_PATH, SIGMF_DEMO_DATA_PATH, SIGMF_DEMO_JSON_PATH];
}
