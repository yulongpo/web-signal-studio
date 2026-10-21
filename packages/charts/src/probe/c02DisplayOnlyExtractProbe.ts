/**
 * C-02 live display-only tile extract probe (not schema-only).
 * Runs real extractDisplayGrid / extractViewportTile / SpectrogramTileSource.extractTile
 * and dual-writes evidence under docs/acceptance/evidence/bot-c + artifacts/validation/bot-c.
 */
import {
  assertDisplayOnlyExtract,
  extractDisplayGrid,
  extractViewportTile,
  FORBIDDEN_DISPLAY_EXTRACT_KEYS,
  suggestExtractOutSize,
  type DisplayExtractResult,
} from "../tile/displayExtract.js";
import { createSpectrogramTileSource } from "../tile/spectrogramGrid.js";
import {
  dualWriteEvidenceJson,
  resolveProbeRepoRoot,
} from "./dualWriteEvidence.js";

export const C02_LIVE_EXTRACT_FILE = "c02_display_only_extract_live_2026-10-21.json";

const FORBIDDEN_JSON_KEYS = [
  "hz",
  "freqHz",
  "frequencyHz",
  "frequency",
  "markerId",
  "marker",
  "markers",
  "detectionId",
  "detection",
  "detections",
  "timeSec",
  "sampleIndex",
  "businessCoords",
] as const;

export interface C02ExtractSummary {
  name: string;
  width: number;
  height: number;
  displayOnly: true;
  reduce: string;
  extractMs: number;
  sourceWindow: { x: number; y: number; w: number; h: number };
  dataLength: number;
  dataPeak: number;
  dataMean: number;
  /** Non-cryptographic fingerprint of display intensities (proves real buffer, not stub). */
  dataFnv1a: number;
}

export interface C02LiveExtractPayload {
  bot: "bot-c";
  gate: "C-02";
  kind: "live-display-only-tile-extract";
  writtenAt: string;
  package: "@wss/charts";
  displayOnly: true;
  status: "WIP";
  note: string;
  allowedKeys: string[];
  forbiddenKeysAssertedAbsent: string[];
  source: {
    grid: { width: number; height: number };
    spectrogram: { binCount: number; frameCount: number; orientation: string };
  };
  extracts: C02ExtractSummary[];
  assertions: {
    allDisplayOnly: boolean;
    noForbiddenKeysOnSummaries: boolean;
    noForbiddenKeysOnLiveResults: boolean;
    previewOutSmallerOrEqualRefine: boolean;
    everyExtractMsPositive: boolean;
    everyDataLengthMatchesWxH: boolean;
  };
  paths: { docs: string; artifacts: string };
}

function fnv1aFloat32(data: Float32Array): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    const buf = new ArrayBuffer(4);
    new Float32Array(buf)[0] = data[i]!;
    const u = new Uint32Array(buf)[0]!;
    h ^= u & 0xff;
    h = Math.imul(h, 0x01000193);
    h ^= (u >>> 8) & 0xff;
    h = Math.imul(h, 0x01000193);
    h ^= (u >>> 16) & 0xff;
    h = Math.imul(h, 0x01000193);
    h ^= (u >>> 24) & 0xff;
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function summarize(name: string, result: DisplayExtractResult): C02ExtractSummary {
  assertDisplayOnlyExtract(result);
  let sum = 0;
  let peak = -Infinity;
  for (let i = 0; i < result.data.length; i++) {
    const v = result.data[i]!;
    sum += v;
    if (v > peak) peak = v;
  }
  return {
    name,
    width: result.width,
    height: result.height,
    displayOnly: true,
    reduce: result.reduce,
    extractMs: result.extractMs,
    sourceWindow: { ...result.sourceWindow },
    dataLength: result.data.length,
    dataPeak: Number.isFinite(peak) ? peak : 0,
    dataMean: result.data.length ? sum / result.data.length : 0,
    dataFnv1a: fnv1aFloat32(result.data),
  };
}

function assertNoForbiddenOnObject(obj: Record<string, unknown>): void {
  for (const key of FORBIDDEN_JSON_KEYS) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      throw new Error(`C-02 live extract: forbidden key on summary JSON: ${key}`);
    }
  }
}

/** Build a deterministic non-trivial STFT-like power grid with a hot peak. */
export function buildLiveProbeSource(opts?: {
  sourceWidth?: number;
  sourceHeight?: number;
  binCount?: number;
  frameCount?: number;
}): {
  sourceWidth: number;
  sourceHeight: number;
  source: Float32Array;
  binCount: number;
  frameCount: number;
  power: Float32Array;
} {
  const sourceWidth = opts?.sourceWidth ?? 512;
  const sourceHeight = opts?.sourceHeight ?? 256;
  const binCount = opts?.binCount ?? 256;
  const frameCount = opts?.frameCount ?? 512;
  const source = new Float32Array(sourceWidth * sourceHeight);
  for (let y = 0; y < sourceHeight; y++) {
    for (let x = 0; x < sourceWidth; x++) {
      source[y * sourceWidth + x] =
        0.15 +
        0.35 * Math.sin(x * 0.031) * Math.cos(y * 0.017) +
        (x > 200 && x < 220 && y > 100 && y < 130 ? 4.5 : 0);
    }
  }
  const power = new Float32Array(binCount * frameCount);
  for (let b = 0; b < binCount; b++) {
    for (let f = 0; f < frameCount; f++) {
      power[b * frameCount + f] =
        0.1 + 0.2 * Math.sin(b * 0.05) * Math.cos(f * 0.02);
    }
  }
  power[128 * frameCount + 256] = 42;
  return { sourceWidth, sourceHeight, source, binCount, frameCount, power };
}

export interface RunC02LiveExtractOptions {
  repoRoot?: string | null;
  fileName?: string;
  /** When false, skip dual-write and only return payload (unit tests). Default true. */
  write?: boolean;
}

/**
 * Live C-02 probe: real CPU extracts (grid, viewport, spectrogram tile preview+refine).
 * Dual-writes when repo root is known.
 */
export function runC02LiveDisplayOnlyExtractProbe(
  options: RunC02LiveExtractOptions = {},
): {
  payload: C02LiveExtractPayload;
  docsPath: string | null;
  artifactsPath: string | null;
  liveResults: DisplayExtractResult[];
} {
  const fileName = options.fileName ?? C02_LIVE_EXTRACT_FILE;
  const { sourceWidth, sourceHeight, source, binCount, frameCount, power } =
    buildLiveProbeSource();

  const plotCssWidth = 800;
  const plotCssHeight = 400;
  const previewSize = suggestExtractOutSize({
    sourceWidth,
    sourceHeight,
    plotCssWidth,
    plotCssHeight,
    mode: "preview",
  });
  const refineSize = suggestExtractOutSize({
    sourceWidth,
    sourceHeight,
    plotCssWidth,
    plotCssHeight,
    mode: "refine",
  });

  const gridFull = extractDisplayGrid({
    source,
    sourceWidth,
    sourceHeight,
    srcX: 0,
    srcY: 0,
    srcW: sourceWidth,
    srcH: sourceHeight,
    outW: refineSize.outW,
    outH: refineSize.outH,
    reduce: "peak",
  });

  const viewportPreview = extractViewportTile({
    source,
    sourceWidth,
    sourceHeight,
    plotCssWidth,
    plotCssHeight,
    viewCssX: 80,
    viewCssY: 40,
    viewCssW: 320,
    viewCssH: 160,
    outW: previewSize.outW,
    outH: previewSize.outH,
    reduce: "nearest",
  });

  const tileSrc = createSpectrogramTileSource({
    power,
    frameCount,
    binCount,
    freqHz: { min: 0, max: 25_600 },
    timeSec: { min: 0, max: 5.12 },
    orientation: "stft",
  });

  const tilePreview = tileSrc.extractTile({
    view: {
      xDomain: { min: 2.0, max: 3.2, unit: "s" },
      yDomain: { min: 10_000, max: 14_000, unit: "Hz" },
    },
    outW: 64,
    outH: 48,
    mode: "preview",
    reduce: "nearest",
    plotCssWidth: 640,
    plotCssHeight: 320,
  });

  const tileRefine = tileSrc.extractTile({
    view: {
      xDomain: { min: 2.0, max: 3.2, unit: "s" },
      yDomain: { min: 10_000, max: 14_000, unit: "Hz" },
    },
    outW: 160,
    outH: 120,
    mode: "refine",
    reduce: "peak",
    plotCssWidth: 640,
    plotCssHeight: 320,
  });

  const liveResults = [gridFull, viewportPreview, tilePreview, tileRefine];
  for (const r of liveResults) assertDisplayOnlyExtract(r);

  const extracts = [
    summarize("grid-full-peak-refine-size", gridFull),
    summarize("viewport-css-preview", viewportPreview),
    summarize("spectrogram-tile-preview", tilePreview),
    summarize("spectrogram-tile-refine", tileRefine),
  ];

  for (const s of extracts) assertNoForbiddenOnObject(s as unknown as Record<string, unknown>);

  let noForbiddenOnLive = true;
  for (const r of liveResults) {
    const rec = r as unknown as Record<string, unknown>;
    for (const key of FORBIDDEN_DISPLAY_EXTRACT_KEYS) {
      if (Object.prototype.hasOwnProperty.call(rec, key) && rec[key] != null) {
        noForbiddenOnLive = false;
      }
    }
    for (const key of FORBIDDEN_JSON_KEYS) {
      if (Object.prototype.hasOwnProperty.call(rec, key)) noForbiddenOnLive = false;
    }
  }

  const previewOut = tilePreview.width * tilePreview.height;
  const refineOut = tileRefine.width * tileRefine.height;

  const payload: C02LiveExtractPayload = {
    bot: "bot-c",
    gate: "C-02",
    kind: "live-display-only-tile-extract",
    writtenAt: new Date().toISOString(),
    package: "@wss/charts",
    displayOnly: true,
    status: "WIP",
    note:
      "Live extractDisplayGrid + extractViewportTile + createSpectrogramTileSource.extractTile (preview+refine). Real buffers + extractMs + sourceWindow (source pixels only). Not schema-only. Dual-written docs+artifacts when repo root known. No PASS claim — WSS-QA-G owns PASS.",
    allowedKeys: [
      "width",
      "height",
      "displayOnly",
      "reduce",
      "extractMs",
      "sourceWindow",
      "dataLength",
      "dataPeak",
      "dataMean",
      "dataFnv1a",
      "name",
    ],
    forbiddenKeysAssertedAbsent: [...FORBIDDEN_JSON_KEYS],
    source: {
      grid: { width: sourceWidth, height: sourceHeight },
      spectrogram: { binCount, frameCount, orientation: "stft" },
    },
    extracts,
    assertions: {
      allDisplayOnly: extracts.every((e) => e.displayOnly === true),
      noForbiddenKeysOnSummaries: true,
      noForbiddenKeysOnLiveResults: noForbiddenOnLive,
      previewOutSmallerOrEqualRefine: previewOut <= refineOut,
      everyExtractMsPositive: extracts.every((e) => e.extractMs > 0),
      everyDataLengthMatchesWxH: extracts.every((e) => e.dataLength === e.width * e.height),
    },
    paths: {
      docs: `docs/acceptance/evidence/bot-c/${fileName}`,
      artifacts: `artifacts/validation/bot-c/${fileName}`,
    },
  };

  const write = options.write !== false;
  const repo =
    options.repoRoot === null
      ? null
      : options.repoRoot ?? resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO ?? null;

  if (!write || !repo) {
    return { payload, docsPath: null, artifactsPath: null, liveResults };
  }

  const { docsPath, artifactsPath } = dualWriteEvidenceJson(fileName, payload, {
    repoRoot: repo,
  });
  return { payload, docsPath, artifactsPath, liveResults };
}
