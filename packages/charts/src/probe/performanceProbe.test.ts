import { describe, expect, it } from "vitest";
import { writePerformanceProbe, PerformanceProbeSession } from "./performanceProbe.js";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("performanceProbe", () => {
  it("writes JSON under artifacts/validation/bot-c", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-probe-"));
    try {
      const result = await writePerformanceProbe(
        { name: "unit", durationMs: 1.5, meta: { ok: true } },
        { repoRoot: root, fileName: "unit_probe.json" },
      );
      expect(result.ok).toBe(true);
      expect(result.path).toContain("artifacts");
      expect(result.path).toContain("bot-c");
      const raw = readFileSync(result.path!, "utf8");
      const json = JSON.parse(raw);
      expect(json.bot).toBe("bot-c");
      expect(json.samples[0].name).toBe("unit");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("session times and flushes", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-probe-"));
    try {
      const session = new PerformanceProbeSession();
      await session.time("work", async () => 42);
      const result = await session.flush({ repoRoot: root, fileName: "session.json" });
      expect(result.ok).toBe(true);
      expect(result.payload.samples.length).toBe(1);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
