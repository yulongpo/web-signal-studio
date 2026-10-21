import {
  extractDisplayGrid,
  extractViewportTile,
  suggestExtractOutSize,
  assertDisplayOnlyExtract,
} from "../src/tile/displayExtract.ts";
import { sizeCanvasForDpr } from "../src/dpi/canvasSizing.ts";
import { PreviewRefineController } from "../src/interaction/previewRefine.ts";
import {
  PerformanceProbeSession,
  writeChartsValidationProbe,
} from "../src/probe/performanceProbe.ts";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const repoRoot = "D:\\project\\wss-wt-c";

const sourceWidth = 512;
const sourceHeight = 256;
const source = new Float32Array(sourceWidth * sourceHeight);
for (let i = 0; i < source.length; i++) source[i] = Math.sin(i * 0.01) * 0.5 + 0.5;
source[100 * sourceWidth + 200] = 10;

const previewSize = suggestExtractOutSize({
  sourceWidth,
  sourceHeight,
  plotCssWidth: 640,
  plotCssHeight: 320,
  mode: "preview",
});
const refineSize = suggestExtractOutSize({
  sourceWidth,
  sourceHeight,
  plotCssWidth: 640,
  plotCssHeight: 320,
  mode: "refine",
});

const session = new PerformanceProbeSession();

const previewExtract = await session.time("extract-preview", () =>
  extractDisplayGrid({
    source,
    sourceWidth,
    sourceHeight,
    srcX: 0,
    srcY: 0,
    srcW: sourceWidth,
    srcH: sourceHeight,
    outW: previewSize.outW,
    outH: previewSize.outH,
    reduce: "nearest",
  }),
);
assertDisplayOnlyExtract(previewExtract);

const refineExtract = await session.time("extract-refine", () =>
  extractDisplayGrid({
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
  }),
);

const viewport = extractViewportTile({
  source,
  sourceWidth,
  sourceHeight,
  plotCssWidth: 640,
  plotCssHeight: 320,
  viewCssX: 80,
  viewCssY: 40,
  viewCssW: 320,
  viewCssH: 160,
  outW: 160,
  outH: 80,
  reduce: "peak",
});
assertDisplayOnlyExtract(viewport);

const dprSize = sizeCanvasForDpr({
  cssWidth: 640,
  cssHeight: 320,
  devicePixelRatio: 2,
});

const modes: string[] = [];
const ctrl = new PreviewRefineController(
  {
    onPreview: () => modes.push("preview"),
    onRefine: () => modes.push("refine"),
  },
  1,
);
ctrl.noteInteraction();
await new Promise((r) => setTimeout(r, 5));
ctrl.requestRefine();
ctrl.dispose();

session.markCharts("frame-preview", {
  frameMs: previewExtract.extractMs + 0.8,
  extractMs: previewExtract.extractMs,
  dpr: dprSize.dpr,
  mode: "preview",
  bufferWidth: dprSize.bufferWidth,
  bufferHeight: dprSize.bufferHeight,
  outW: previewExtract.width,
  outH: previewExtract.height,
  note: "cpu extract + synthetic frame budget",
});
session.markCharts("frame-refine", {
  frameMs: refineExtract.extractMs + 1.6,
  extractMs: refineExtract.extractMs,
  dpr: dprSize.dpr,
  mode: "refine",
  bufferWidth: dprSize.bufferWidth,
  bufferHeight: dprSize.bufferHeight,
  outW: refineExtract.width,
  outH: refineExtract.height,
  note: "idle refine denser grid",
});

const flushed = await session.flush({
  repoRoot,
  fileName: "bot_c_tile_dpi_preview_2026-10-21.json",
});

const note =
  "previewOut=" +
  previewExtract.width +
  "x" +
  previewExtract.height +
  "; modes=" +
  modes.join(",");

const single = await writeChartsValidationProbe(
  {
    name: "charts-validation-gate",
    frameMs: refineExtract.extractMs + 1.6,
    extractMs: refineExtract.extractMs,
    dpr: dprSize.dpr,
    mode: "refine",
    bufferWidth: dprSize.bufferWidth,
    bufferHeight: dprSize.bufferHeight,
    outW: refineExtract.width,
    outH: refineExtract.height,
    note,
  },
  {
    repoRoot,
    fileName: "charts_probe_tile_dpi_preview_2026-10-21.json",
  },
);

const summary = {
  ok: flushed.ok && single.ok,
  flushedPath: flushed.path,
  singlePath: single.path,
  previewOut: { w: previewExtract.width, h: previewExtract.height, ms: previewExtract.extractMs },
  refineOut: { w: refineExtract.width, h: refineExtract.height, ms: refineExtract.extractMs },
  dpr: dprSize,
  modes,
  viewportWindow: viewport.sourceWindow,
};
mkdirSync(join(repoRoot, "artifacts", "validation", "bot-c"), { recursive: true });
writeFileSync(
  join(repoRoot, "artifacts", "validation", "bot-c", "bot_c_probe_run_summary_2026-10-21.json"),
  JSON.stringify(summary, null, 2),
  "utf8",
);
console.log(JSON.stringify(summary, null, 2));
