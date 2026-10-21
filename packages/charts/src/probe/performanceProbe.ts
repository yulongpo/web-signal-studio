/**
 * Performance probe writer for Bot-C validation evidence.
 * Writes JSON under artifacts/validation/bot-c/ when a filesystem is available
 * (Node / tests). In pure browser, returns the payload for the host to persist.
 */

export interface ProbeSample {
  name: string;
  /** Wall time in ms for the measured span. */
  durationMs: number;
  ts?: string;
  meta?: Record<string, number | string | boolean | null>;
}

export interface ProbeWriteOptions {
  /** Absolute or relative directory that contains artifacts/ (repo root). Default: cwd. */
  repoRoot?: string;
  /** Relative to repoRoot. Default: artifacts/validation/bot-c */
  relativeDir?: string;
  /** File name; default auto timestamp. */
  fileName?: string;
  /** Inject fs writer (tests); default tries node:fs. */
  writeFile?: (absPath: string, contents: string) => void | Promise<void>;
  mkdirp?: (absDir: string) => void | Promise<void>;
}

export interface ProbeWriteResult {
  ok: boolean;
  path: string | null;
  payload: {
    bot: "bot-c";
    writtenAt: string;
    samples: ProbeSample[];
  };
  reason?: string;
}

function defaultFileName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `probe_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
}

async function tryNodeFs(): Promise<{
  writeFile: (p: string, c: string) => Promise<void>;
  mkdirp: (d: string) => Promise<void>;
  join: (...parts: string[]) => string;
} | null> {
  try {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    return {
      writeFile: (p, c) => fs.writeFile(p, c, "utf8"),
      mkdirp: (d) => fs.mkdir(d, { recursive: true }).then(() => undefined),
      join: (...parts) => path.join(...parts),
    };
  } catch {
    return null;
  }
}

export async function writePerformanceProbe(
  samples: ProbeSample | ProbeSample[],
  options: ProbeWriteOptions = {},
): Promise<ProbeWriteResult> {
  const list = Array.isArray(samples) ? samples : [samples];
  const writtenAt = new Date().toISOString();
  const normalized = list.map((s) => ({
    ...s,
    ts: s.ts ?? writtenAt,
  }));
  const payload = {
    bot: "bot-c" as const,
    writtenAt,
    samples: normalized,
  };
  const relativeDir = options.relativeDir ?? "artifacts/validation/bot-c";
  const fileName = options.fileName ?? defaultFileName();

  const node = options.writeFile && options.mkdirp
    ? null
    : await tryNodeFs();

  const writeFile = options.writeFile;
  const mkdirp = options.mkdirp;

  if (!writeFile && !node) {
    return {
      ok: false,
      path: null,
      payload,
      reason: "no filesystem adapter (browser); payload returned for host persistence",
    };
  }

  let absPath: string;
  if (node) {
    const root = options.repoRoot ?? process.cwd();
    const dir = node.join(root, relativeDir);
    await node.mkdirp(dir);
    absPath = node.join(dir, fileName);
    await node.writeFile(absPath, JSON.stringify(payload, null, 2));
  } else {
    const root = options.repoRoot ?? "";
    const sep = root.includes("\\") ? "\\" : "/";
    const dir = [root, relativeDir].filter(Boolean).join(sep).replace(/[\\/]+/g, sep);
    absPath = `${dir}${sep}${fileName}`;
    await mkdirp?.(dir);
    await writeFile?.(absPath, JSON.stringify(payload, null, 2));
  }

  return { ok: true, path: absPath, payload };
}

/** Collect timed samples then flush to artifacts/validation/bot-c. */
export class PerformanceProbeSession {
  private samples: ProbeSample[] = [];

  mark(name: string, durationMs: number, meta?: ProbeSample["meta"]): void {
    this.samples.push({
      name,
      durationMs,
      meta,
      ts: new Date().toISOString(),
    });
  }

  async time<T>(name: string, fn: () => T | Promise<T>, meta?: ProbeSample["meta"]): Promise<T> {
    const t0 = performance.now();
    try {
      return await fn();
    } finally {
      this.mark(name, performance.now() - t0, meta);
    }
  }

  getSamples(): readonly ProbeSample[] {
    return this.samples;
  }

  async flush(options?: ProbeWriteOptions): Promise<ProbeWriteResult> {
    const result = await writePerformanceProbe(this.samples, options);
    return result;
  }

  clear(): void {
    this.samples = [];
  }
}
