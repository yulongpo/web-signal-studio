import { describe, expect, it } from "vitest";
import {
  writePerformanceProbe,
  writeChartsValidationProbe,
  PerformanceProbeSession,
} from "./performanceProbe.js";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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
});
