/**
 * Dual-write Bot-C probe/evidence files to:
 *   docs/acceptance/evidence/bot-c/   (tracked review path)
 *   artifacts/validation/bot-c/       (runtime / CI upload path)
 */
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

export const DOCS_EVIDENCE_REL = "docs/acceptance/evidence/bot-c";
export const ARTIFACTS_EVIDENCE_REL = "artifacts/validation/bot-c";

export interface DualWriteOptions {
  /** Repo root. Default: process.cwd() */
  repoRoot?: string;
}

function resolveRoot(repoRoot?: string): string {
  return repoRoot ?? process.cwd();
}

export function evidenceDirs(repoRoot?: string): { docs: string; artifacts: string } {
  const root = resolveRoot(repoRoot);
  return {
    docs: join(root, DOCS_EVIDENCE_REL),
    artifacts: join(root, ARTIFACTS_EVIDENCE_REL),
  };
}

export function ensureEvidenceDirs(repoRoot?: string): { docs: string; artifacts: string } {
  const dirs = evidenceDirs(repoRoot);
  mkdirSync(dirs.docs, { recursive: true });
  mkdirSync(dirs.artifacts, { recursive: true });
  return dirs;
}

/** Write the same bytes/string to both evidence directories. Returns both absolute paths. */
export function dualWriteEvidenceFile(
  fileName: string,
  data: string | Buffer,
  options: DualWriteOptions = {},
): { docsPath: string; artifactsPath: string } {
  const dirs = ensureEvidenceDirs(options.repoRoot);
  const docsPath = join(dirs.docs, fileName);
  const artifactsPath = join(dirs.artifacts, fileName);
  if (typeof data === "string") {
    writeFileSync(docsPath, data, "utf8");
    writeFileSync(artifactsPath, data, "utf8");
  } else {
    writeFileSync(docsPath, data);
    writeFileSync(artifactsPath, data);
  }
  return { docsPath, artifactsPath };
}

export function dualWriteEvidenceJson(
  fileName: string,
  value: unknown,
  options: DualWriteOptions = {},
): { docsPath: string; artifactsPath: string } {
  return dualWriteEvidenceFile(fileName, JSON.stringify(value, null, 2) + "\n", options);
}

/** Copy an existing file into both evidence dirs under the given name. */
export function dualCopyEvidenceFile(
  fileName: string,
  fromPath: string,
  options: DualWriteOptions = {},
): { docsPath: string; artifactsPath: string } {
  const dirs = ensureEvidenceDirs(options.repoRoot);
  const docsPath = join(dirs.docs, fileName);
  const artifactsPath = join(dirs.artifacts, fileName);
  if (!existsSync(fromPath)) {
    throw new Error(`dualCopyEvidenceFile: source missing: ${fromPath}`);
  }
  copyFileSync(fromPath, docsPath);
  copyFileSync(fromPath, artifactsPath);
  return { docsPath, artifactsPath };
}

/** Resolve WSS_PROBE_REPO or walk up from cwd looking for packages/charts. */
export function resolveProbeRepoRoot(start?: string): string | null {
  const env = process.env.WSS_PROBE_REPO;
  if (env && existsSync(join(env, "packages", "charts"))) return env;
  let cur = start ?? process.cwd();
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(cur, "packages", "charts")) && existsSync(join(cur, "docs"))) {
      return cur;
    }
    const parent = dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return null;
}
