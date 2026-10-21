import { describe, expect, it } from "vitest";
import { aggregateMsStats } from "./performanceProbe.js";

/** Acceptance packaging: probe summary must expose p50/p95 for QA evidence. */
describe("probe summary keys (acceptance)", () => {
  it("aggregateMsStats returns p50 and p95 keys", () => {
    const stats = aggregateMsStats([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(stats).not.toBeNull();
    expect(Object.keys(stats!)).toEqual(
      expect.arrayContaining(["count", "min", "max", "mean", "p50", "p95"]),
    );
    expect(stats!.p50).toBeDefined();
    expect(stats!.p95).toBeDefined();
  });

  it("synthetic summary shape includes frameMs/extractMs p50/p95", () => {
    const frameMs = aggregateMsStats([1.1, 1.2, 5.0, 1.3]);
    const extractMs = aggregateMsStats([0.9, 1.0, 4.5, 1.1]);
    const summary = { frameMs, extractMs, modes: ["preview", "refine"], dpr: 2 };
    expect(summary.frameMs?.p50).toBeTypeOf("number");
    expect(summary.frameMs?.p95).toBeTypeOf("number");
    expect(summary.extractMs?.p50).toBeTypeOf("number");
    expect(summary.extractMs?.p95).toBeTypeOf("number");
  });
});
