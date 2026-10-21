import { describe, expect, it } from "vitest";
import {
  writePerformanceProbe,
  writeChartsValidationProbe,
  PerformanceProbeSession,
  percentile,
  aggregateMsStats,
  runSyntheticInteractionProbe,
} from "./performanceProbe.js";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("performanceProbe", () => {
  it("writes JSON under artifacts/validation/bot-c", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-probe-"));
    try {
      const result = await writePerformanceProbe(
        { name: "unit", durationMs: 1.5, meta: { ok: true, mode: "preview", dpr: 2 } },
        { repoRoot: root, fileName: "unit_probe.json" },
      );
      expect(result.ok).toBe(true);
      expect(result.path).toContain("artifacts");
      expect(result.path).toContain("bot-c");
      const raw = readFileSync(result.path!, "utf8");
      const json = JSON.parse(raw);
      expect(json.bot).toBe("bot-c");
      expect(json.package).toBe("@wss/charts");
      expect(json.samples[0].name).toBe("unit");
      expect(json.summary.modes).toContain("preview");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("session times and flushes", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-probe-"));
    try {
      const session = new PerformanceProbeSession();
      await session.time("work", async () => 42);
      session.markCharts("paint", {
        frameMs: 3.2,
        extractMs: 1.1,
        dpr: 2,
        mode: "refine",
        outW: 400,
        outH: 200,
      });
      const result = await session.flush({ repoRoot: root, fileName: "session.json" });
      expect(result.ok).toBe(true);
      expect(result.payload.samples.length).toBe(2);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("writeChartsValidationProbe includes frame/extract/dpr/mode", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-probe-"));
    try {
      const result = await writeChartsValidationProbe(
        {
          name: "validation-shape",
          frameMs: 4.5,
          extractMs: 2.1,
          dpr: 1.5,
          mode: "preview",
          bufferWidth: 1200,
          bufferHeight: 600,
        },
        { repoRoot: root, fileName: "charts_shape.json" },
      );
      expect(result.ok).toBe(true);
      const json = JSON.parse(readFileSync(result.path!, "utf8"));
      expect(json.samples[0].meta.frameMs).toBe(4.5);
      expect(json.samples[0].meta.extractMs).toBe(2.1);
      expect(json.samples[0].meta.dpr).toBe(1.5);
      expect(json.samples[0].meta.mode).toBe("preview");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("percentile and aggregateMsStats compute p50/p95", () => {
    expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentile([1, 2, 3, 4, 5], 95)).toBeCloseTo(4.8, 5);
    const stats = aggregateMsStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(stats).not.toBeNull();
    expect(stats!.p50).toBeCloseTo(5.5, 5);
    expect(stats!.p95).toBeCloseTo(9.55, 5);
    expect(stats!.count).toBe(10);
  });

  it("flush summary includes frameMs/extractMs percentiles", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-probe-"));
    try {
      const session = new PerformanceProbeSession();
      for (let i = 1; i <= 20; i++) {
        session.markCharts(`f${i}`, {
          frameMs: i,
          extractMs: i * 0.5,
          dpr: 2,
          mode: i < 15 ? "preview" : "refine",
        });
      }
      const result = await session.flush({ repoRoot: root, fileName: "pct.json" });
      expect(result.payload.summary?.frameMs?.p50).toBeDefined();
      expect(result.payload.summary?.frameMs?.p95).toBeDefined();
      expect(result.payload.summary?.extractMs?.p50).toBeDefined();
      expect(result.payload.summary?.extractMs?.p95).toBeDefined();
      expect(result.payload.summary!.frameMs!.count).toBe(20);
      const live = session.getPercentiles();
      expect(live.frameMs?.p95).toBe(result.payload.summary!.frameMs!.p95);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("runSyntheticInteractionProbe writes real P95 probe under repo artifacts", async () => {
    const repoRoot = join(tmpdir(), `wss-synth-${Date.now()}`);
    // also write into the real worktree artifacts when WSS_PROBE_REPO is set
    const targetRoot = process.env.WSS_PROBE_REPO ?? repoRoot;
    const result = await runSyntheticInteractionProbe({
      previewFrames: 24,
      refineFrames: 8,
      repoRoot: targetRoot,
      fileName: "charts_probe_interaction_p95_2026-10-21.json",
    });
    expect(result.ok).toBe(true);
    expect(result.path).toBeTruthy();
    expect(existsSync(result.path!)).toBe(true);
    const json = JSON.parse(readFileSync(result.path!, "utf8"));
    expect(json.summary.frameMs.p50).toBeGreaterThan(0);
    expect(json.summary.frameMs.p95).toBeGreaterThanOrEqual(json.summary.frameMs.p50);
    expect(json.summary.extractMs.p95).toBeGreaterThan(0);
    expect(json.summary.modes.length).toBeGreaterThan(0);
    expect(json.samples.length).toBe(24 + 8);
    if (targetRoot === repoRoot) {
      rmSync(repoRoot, { recursive: true, force: true });
    }
  });
});
