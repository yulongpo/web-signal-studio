/**
 * Performance probe writer for Bot-C validation evidence.
 * Writes JSON under artifacts/validation/bot-c/ when a filesystem is available
 * (Node / tests). In pure browser, returns the payload for the host to persist.
 */

export type ProbeMode = "preview" | "refine" | "idle" | "n/a";

export interface ProbeSample {
  name: string;
  /** Wall time in ms for the measured span. */
  durationMs: number;
  ts?: string;
  meta?: Record<string, number | string | boolean | null>;
}

/** Structured charts probe fields CAO expects under artifacts/validation/bot-c. */
export interface ChartsProbeFields {
  /** Frame / paint time ms (GL draw or composite). */
  frameMs?: number;
  /** Display extract time ms. */
  extractMs?: number;
  /** Effective device pixel ratio used for canvas sizing. */
  dpr?: number;
  /** Interaction policy mode at sample time. */
  mode?: ProbeMode;
  bufferWidth?: number;
  bufferHeight?: number;
  outW?: number;
  outH?: number;
  note?: string;
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

export interface MsPercentiles {
  count: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
}

export interface ProbePayload {
  bot: "bot-c";
  writtenAt: string;
  package: "@wss/charts";
  samples: ProbeSample[];
  summary?: {
    sampleCount: number;
    totalDurationMs: number;
    modes: string[];
    dpr?: number | null;
    /** Aggregated frameMs from sample.meta.frameMs when present. */
    frameMs?: MsPercentiles | null;
    /** Aggregated extractMs from sample.meta.extractMs when present. */
    extractMs?: MsPercentiles | null;
  };
}

export interface ProbeWriteResult {
  ok: boolean;
  path: string | null;
  payload: ProbePayload;
  reason?: string;
}

/** Linear-interpolation percentile on a copy-sorted array. p in [0,100]. */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  const clamped = Math.min(100, Math.max(0, p));
  const idx = (clamped / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  const t = idx - lo;
  return sorted[lo]! * (1 - t) + sorted[hi]! * t;
}

export function aggregateMsStats(values: number[]): MsPercentiles | null {
  const nums = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return {
    count: nums.length,
    min: Math.min(...nums),
    max: Math.max(...nums),
    mean: sum / nums.length,
    p50: percentile(nums, 50),
    p95: percentile(nums, 95),
  };
}

function collectMetaNumbers(
  samples: ProbeSample[],
  key: "frameMs" | "extractMs",
): number[] {
  const out: number[] = [];
  for (const s of samples) {
    const v = s.meta?.[key];
    if (typeof v === "number" && Number.isFinite(v)) out.push(v);
  }
  return out;
}

function defaultFileName(prefix = "probe"): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${prefix}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.json`;
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

function buildPayload(samples: ProbeSample[]): ProbePayload {
  const writtenAt = new Date().toISOString();
  const normalized = samples.map((s) => ({
    ...s,
    ts: s.ts ?? writtenAt,
  }));
  const modes = [
    ...new Set(
      normalized
        .map((s) => (s.meta && typeof s.meta.mode === "string" ? s.meta.mode : null))
        .filter((m): m is string => !!m),
    ),
  ];
  const dprSample = normalized.find((s) => s.meta && typeof s.meta.dpr === "number");
  return {
    bot: "bot-c",
    writtenAt,
    package: "@wss/charts",
    samples: normalized,
    summary: {
      sampleCount: normalized.length,
      totalDurationMs: normalized.reduce((a, s) => a + s.durationMs, 0),
      modes,
      dpr: dprSample ? (dprSample.meta!.dpr as number) : null,
      frameMs: aggregateMsStats(collectMetaNumbers(normalized, "frameMs")),
      extractMs: aggregateMsStats(collectMetaNumbers(normalized, "extractMs")),
    },
  };
}

export async function writePerformanceProbe(
  samples: ProbeSample | ProbeSample[],
  options: ProbeWriteOptions = {},
): Promise<ProbeWriteResult> {
  const list = Array.isArray(samples) ? samples : [samples];
  const payload = buildPayload(list);
  const relativeDir = options.relativeDir ?? "artifacts/validation/bot-c";
  const fileName = options.fileName ?? defaultFileName();

  const node =
    options.writeFile && options.mkdirp ? null : await tryNodeFs();

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

/**
 * Convenience writer for CAO validation: frame / extract / dpr / mode in one shot.
 */
export async function writeChartsValidationProbe(
  fields: ChartsProbeFields & { name?: string },
  options: ProbeWriteOptions = {},
): Promise<ProbeWriteResult> {
  const name = fields.name ?? "charts-validation";
  const sample: ProbeSample = {
    name,
    durationMs: fields.frameMs ?? fields.extractMs ?? 0,
    meta: {
      frameMs: fields.frameMs ?? null,
      extractMs: fields.extractMs ?? null,
      dpr: fields.dpr ?? null,
      mode: fields.mode ?? "n/a",
      bufferWidth: fields.bufferWidth ?? null,
      bufferHeight: fields.bufferHeight ?? null,
      outW: fields.outW ?? null,
      outH: fields.outH ?? null,
      note: fields.note ?? null,
    },
  };
  return writePerformanceProbe(sample, {
    ...options,
    fileName: options.fileName ?? defaultFileName("charts_probe"),
  });
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

  markCharts(name: string, fields: ChartsProbeFields): void {
    this.mark(name, fields.frameMs ?? fields.extractMs ?? 0, {
      frameMs: fields.frameMs ?? null,
      extractMs: fields.extractMs ?? null,
      dpr: fields.dpr ?? null,
      mode: fields.mode ?? "n/a",
      bufferWidth: fields.bufferWidth ?? null,
      bufferHeight: fields.bufferHeight ?? null,
      outW: fields.outW ?? null,
      outH: fields.outH ?? null,
      note: fields.note ?? null,
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

  /** Current P50/P95 aggregates without writing. */
  getPercentiles(): {
    frameMs: MsPercentiles | null;
    extractMs: MsPercentiles | null;
  } {
    return {
      frameMs: aggregateMsStats(collectMetaNumbers(this.samples, "frameMs")),
      extractMs: aggregateMsStats(collectMetaNumbers(this.samples, "extractMs")),
    };
  }

  async flush(options?: ProbeWriteOptions): Promise<ProbeWriteResult> {
    return writePerformanceProbe(this.samples, options);
  }

  clear(): void {
    this.samples = [];
  }
}

export interface SyntheticInteractionLoopOptions {
  /** Number of pan/zoom preview frames. Default 40. */
  previewFrames?: number;
  /** Number of idle refine frames after settle. Default 10. */
  refineFrames?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  plotCssWidth?: number;
  plotCssHeight?: number;
  dpr?: number;
  repoRoot?: string;
  fileName?: string;
}

/**
 * CPU-only synthetic interaction loop: preview extracts while "dragging",
 * then refine extracts. Writes P50/P95 probe JSON under artifacts/validation/bot-c.
 */
export async function runSyntheticInteractionProbe(
  options: SyntheticInteractionLoopOptions = {},
): Promise<ProbeWriteResult> {
  const {
    previewFrames = 40,
    refineFrames = 10,
    sourceWidth = 512,
    sourceHeight = 256,
    plotCssWidth = 800,
    plotCssHeight = 400,
    dpr = 2,
    repoRoot,
    fileName = "charts_probe_interaction_p95_2026-10-21.json",
  } = options;

  const { extractDisplayGrid, suggestExtractOutSize } = await import(
    "../tile/displayExtract.js"
  );
  const { PreviewRefineController } = await import(
    "../interaction/previewRefine.js"
  );
  const { panView, zoomViewAt, wheelDeltaToZoomFactor } = await import(
    "../interaction/viewTransform.js"
  );

  const source = new Float32Array(sourceWidth * sourceHeight);
  for (let i = 0; i < source.length; i++) {
    source[i] = Math.sin(i * 0.01) * 0.5 + 0.5;
  }

  const session = new PerformanceProbeSession();
  let mode: ProbeMode = "idle";
  const ctrl = new PreviewRefineController(
    {
      onPreview: () => {
        mode = "preview";
      },
      onRefine: () => {
        mode = "refine";
      },
      onIdle: () => {
        mode = "idle";
      },
    },
    { idleSettleMs: 1_000_000 }, // manual refine in this loop
  );

  let view: import("../interaction/viewTransform.js").ViewState = {
    xDomain: { min: 0, max: 1, unit: "s", label: "Time" },
    yDomain: { min: -0.5, max: 0.5, unit: "Hz", label: "Frequency" },
  };
  const xSpan = { pixelMin: 52, pixelMax: 52 + plotCssWidth };
  const ySpan = { pixelMin: 10, pixelMax: 10 + plotCssHeight };

  for (let i = 0; i < previewFrames; i++) {
    ctrl.noteInteraction();
    view = panView(view, 4, -2, xSpan, ySpan);
    if (i % 5 === 0) {
      const factor = wheelDeltaToZoomFactor(i % 10 === 0 ? -100 : 100);
      view = zoomViewAt(view, 200, 150, factor, xSpan, ySpan);
    }
    const outSize = suggestExtractOutSize({
      sourceWidth,
      sourceHeight,
      plotCssWidth,
      plotCssHeight,
      mode: "preview",
    });
    const extracted = extractDisplayGrid({
      source,
      sourceWidth,
      sourceHeight,
      srcX: 0,
      srcY: 0,
      srcW: sourceWidth,
      srcH: sourceHeight,
      outW: outSize.outW,
      outH: outSize.outH,
      reduce: "nearest",
    });
    // Synthetic frame cost ~ extract + tiny constant (no GPU in Node).
    const frameMs = extracted.extractMs + 0.15 + (i % 7) * 0.02;
    session.markCharts(`preview-frame-${i}`, {
      frameMs,
      extractMs: extracted.extractMs,
      dpr,
      mode,
      outW: extracted.width,
      outH: extracted.height,
      bufferWidth: Math.round(plotCssWidth * dpr),
      bufferHeight: Math.round(plotCssHeight * dpr),
      note: "synthetic-interaction-preview",
    });
  }

  ctrl.requestRefine();
  for (let i = 0; i < refineFrames; i++) {
    const outSize = suggestExtractOutSize({
      sourceWidth,
      sourceHeight,
      plotCssWidth,
      plotCssHeight,
      mode: "refine",
    });
    const extracted = extractDisplayGrid({
      source,
      sourceWidth,
      sourceHeight,
      srcX: 0,
      srcY: 0,
      srcW: sourceWidth,
      srcH: sourceHeight,
      outW: outSize.outW,
      outH: outSize.outH,
      reduce: "peak",
    });
    const frameMs = extracted.extractMs + 0.35 + (i % 5) * 0.03;
    session.markCharts(`refine-frame-${i}`, {
      frameMs,
      extractMs: extracted.extractMs,
      dpr,
      mode,
      outW: extracted.width,
      outH: extracted.height,
      bufferWidth: Math.round(plotCssWidth * dpr),
      bufferHeight: Math.round(plotCssHeight * dpr),
      note: "synthetic-interaction-refine",
    });
  }

  ctrl.dispose();

  return session.flush({
    repoRoot,
    fileName,
  });
}

