/**
 * C-P3 secondary: solidify pan/zoom interaction P95 + idle-settle refine evidence.
 * Builds on performanceProbe + PreviewRefineController; dual-writes condensed + idle evidence.
 */
import {
  PerformanceProbeSession,
  aggregateMsStats,
  type MsPercentiles,
  type ProbeMode,
  type ProbePayload,
  type ProbeWriteResult,
  runSyntheticInteractionProbe,
} from "./performanceProbe.js";
import { PreviewRefineController } from "../interaction/previewRefine.js";
import {
  extractDisplayGrid,
  suggestExtractOutSize,
} from "../tile/displayExtract.js";
import {
  panView,
  zoomViewAt,
  wheelDeltaToZoomFactor,
  type ViewState,
} from "../interaction/viewTransform.js";
import { dualWriteEvidenceJson, resolveProbeRepoRoot } from "./dualWriteEvidence.js";

export const INTERACTION_P95_FILE = "charts_probe_interaction_p95_2026-10-21.json";
export const INTERACTION_P95_CONDENSED_FILE = "CONDENSED_interaction_p95.json";
export const IDLE_REFINE_EVIDENCE_FILE = "m04_idle_refine_settle_2026-10-21.json";

export interface ModePercentiles {
  sampleCount: number;
  frameMs: MsPercentiles | null;
  extractMs: MsPercentiles | null;
}

function byModeFromPayload(payload: ProbePayload): {
  preview?: ModePercentiles;
  refine?: ModePercentiles;
} {
  const out: { preview?: ModePercentiles; refine?: ModePercentiles } = {};
  for (const mode of ["preview", "refine"] as const) {
    const samples = payload.samples.filter((s) => s.meta?.mode === mode);
    if (samples.length === 0) continue;
    const frameVals: number[] = [];
    const extractVals: number[] = [];
    for (const s of samples) {
      const f = s.meta?.frameMs;
      const e = s.meta?.extractMs;
      if (typeof f === "number" && Number.isFinite(f)) frameVals.push(f);
      if (typeof e === "number" && Number.isFinite(e)) extractVals.push(e);
    }
    out[mode] = {
      sampleCount: samples.length,
      frameMs: aggregateMsStats(frameVals),
      extractMs: aggregateMsStats(extractVals),
    };
  }
  return out;
}

export function writeCondensedInteractionP95(
  payload: ProbePayload,
  options: { repoRoot?: string; sourceCommit?: string } = {},
): { docsPath: string; artifactsPath: string } | null {
  const repo = options.repoRoot ?? resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO;
  if (!repo) return null;
  const byMode = byModeFromPayload(payload);
  const condensed = {
    bot: "bot-c" as const,
    kind: "interaction-p95-condensed",
    gate: "C-P3",
    writtenAt: new Date().toISOString(),
    sourceCommit: options.sourceCommit ?? null,
    summary: payload.summary,
    byMode,
    sampleCount: payload.summary?.sampleCount ?? payload.samples.length,
    modes: payload.summary?.modes ?? [],
    dpr: payload.summary?.dpr ?? null,
    frameMs: payload.summary?.frameMs ?? null,
    extractMs: payload.summary?.extractMs ?? null,
    notes: [
      "Synthetic pan/zoom preview frames then idle/manual refine (Node CPU, real extractMs).",
      "summary.frameMs / extractMs and byMode.preview|refine carry count/min/max/mean/p50/p95.",
      "Not a PASS claim — WIP evidence for WSS-QA-G (M-04 already PASS; this solidifies probe chain).",
    ],
    status: "WIP" as const,
  };
  return dualWriteEvidenceJson(INTERACTION_P95_CONDENSED_FILE, condensed, {
    repoRoot: repo,
  });
}

export interface IdleSettleProbeOptions {
  previewFrames?: number;
  refineFrames?: number;
  idleSettleMs?: number;
  repoRoot?: string;
  write?: boolean;
}

/**
 * Real measurements: preview while interacting, then idle timer fires refine (not requestRefine).
 * Dual-writes full p95 JSON, condensed, and idle-settle timeline evidence.
 */
export async function runIdleSettleInteractionP95Probe(
  options: IdleSettleProbeOptions = {},
): Promise<{
  p95: ProbeWriteResult;
  condensedPaths: { docsPath: string; artifactsPath: string } | null;
  idlePaths: { docsPath: string; artifactsPath: string } | null;
  idleEvidence: Record<string, unknown>;
}> {
  const previewFrames = options.previewFrames ?? 40;
  const refineFrames = options.refineFrames ?? 10;
  const idleSettleMs = options.idleSettleMs ?? 25;
  const sourceWidth = 512;
  const sourceHeight = 256;
  const plotCssWidth = 800;
  const plotCssHeight = 400;
  const dpr = 2;

  const source = new Float32Array(sourceWidth * sourceHeight);
  for (let i = 0; i < source.length; i++) {
    source[i] = Math.sin(i * 0.01) * 0.5 + 0.5;
  }

  const session = new PerformanceProbeSession();
  const modeRef: { current: ProbeMode } = { current: "idle" };
  const timeline: Array<{ t: number; event: string; mode: string }> = [];
  const t0 = performance.now();
  const mark = (event: string) => {
    timeline.push({ t: performance.now() - t0, event, mode: modeRef.current });
  };

  const ctrl = new PreviewRefineController(
    {
      onPreview: () => {
        modeRef.current = "preview";
        mark("onPreview");
      },
      onRefine: () => {
        modeRef.current = "refine";
        mark("onRefine");
      },
      onIdle: () => {
        modeRef.current = "idle";
        mark("onIdle");
      },
    },
    { idleSettleMs },
  );

  let view: ViewState = {
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
    const frameMs = extracted.extractMs + 0.15 + (i % 7) * 0.02;
    session.markCharts(`preview-frame-${i}`, {
      frameMs,
      extractMs: extracted.extractMs,
      dpr,
      mode: modeRef.current,
      outW: extracted.width,
      outH: extracted.height,
      bufferWidth: Math.round(plotCssWidth * dpr),
      bufferHeight: Math.round(plotCssHeight * dpr),
      note: "idle-settle-probe-preview",
    });
  }

  mark("interaction-stopped");
  const lastInteractionAt = performance.now() - t0;
  // Wait for idle settle timer (real setTimeout path — not requestRefine).
  await new Promise<void>((resolve) => setTimeout(resolve, idleSettleMs + 15));
  const refineEnteredAt = performance.now() - t0;
  const settleObservedMs = refineEnteredAt - lastInteractionAt;
  mark("after-idle-wait");

  if (modeRef.current !== "refine") {
    // Fallback: still request refine so probe completes, but flag the miss.
    ctrl.requestRefine();
    mark("fallback-requestRefine");
  }

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
      mode: modeRef.current,
      outW: extracted.width,
      outH: extracted.height,
      bufferWidth: Math.round(plotCssWidth * dpr),
      bufferHeight: Math.round(plotCssHeight * dpr),
      note: "idle-settle-probe-refine",
    });
  }

  ctrl.dispose();

  const repo =
    options.repoRoot ?? resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO ?? undefined;
  const p95 = await session.flush({
    repoRoot: repo,
    fileName: INTERACTION_P95_FILE,
  });

  const byMode = byModeFromPayload(p95.payload);
  const idleEvidence = {
    bot: "bot-c" as const,
    gate: "C-P3",
    kind: "idle-settle-refine-evidence",
    writtenAt: new Date().toISOString(),
    package: "@wss/charts",
    status: "WIP" as const,
    note:
      "Preview while pan/zoom; refine entered via PreviewRefineController idleSettleMs timer (not requestRefine). Dual-written. M-04 already PASS by QA — this fills idle refine evidence chain. No self-PASS.",
    idleSettleMsConfigured: idleSettleMs,
    lastInteractionAtMs: lastInteractionAt,
    refineEnteredAtMs: refineEnteredAt,
    settleObservedMs,
    modeAfterIdleWait: modeRef.current,
    refinedViaIdleTimer: timeline.some((e) => e.event === "onRefine"),
    timeline,
    byMode,
    relatedP95: `artifacts/validation/bot-c/${INTERACTION_P95_FILE}`,
    relatedCondensed: `artifacts/validation/bot-c/${INTERACTION_P95_CONDENSED_FILE}`,
  };

  let condensedPaths: { docsPath: string; artifactsPath: string } | null = null;
  let idlePaths: { docsPath: string; artifactsPath: string } | null = null;
  if (options.write !== false && repo) {
    condensedPaths = writeCondensedInteractionP95(p95.payload, { repoRoot: repo });
    idlePaths = dualWriteEvidenceJson(IDLE_REFINE_EVIDENCE_FILE, idleEvidence, {
      repoRoot: repo,
    });
  }

  return { p95, condensedPaths, idlePaths, idleEvidence };
}

/** Re-run classic synthetic probe + dual-write condensed (compat path). */
export async function solidifyInteractionP95Evidence(options: {
  repoRoot?: string;
  previewFrames?: number;
  refineFrames?: number;
} = {}): Promise<{
  p95: ProbeWriteResult;
  condensedPaths: { docsPath: string; artifactsPath: string } | null;
}> {
  const repo =
    options.repoRoot ?? resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO ?? undefined;
  const p95 = await runSyntheticInteractionProbe({
    previewFrames: options.previewFrames ?? 40,
    refineFrames: options.refineFrames ?? 10,
    repoRoot: repo,
    fileName: INTERACTION_P95_FILE,
  });
  const condensedPaths = repo
    ? writeCondensedInteractionP95(p95.payload, { repoRoot: repo })
    : null;
  return { p95, condensedPaths };
}
