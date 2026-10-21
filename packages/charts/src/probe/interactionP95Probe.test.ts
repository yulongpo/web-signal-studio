import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  runIdleSettleInteractionP95Probe,
  solidifyInteractionP95Evidence,
  IDLE_REFINE_EVIDENCE_FILE,
  INTERACTION_P95_CONDENSED_FILE,
} from "./interactionP95Probe.js";
import { resolveProbeRepoRoot } from "./dualWriteEvidence.js";

describe("C-P3 interaction p95 + idle settle probe", () => {
  it("idle settle path enters refine via timer and writes real p95", async () => {
    const root = mkdtempSync(join(tmpdir(), "wss-p95-idle-"));
    try {
      const { p95, idleEvidence, condensedPaths, idlePaths } =
        await runIdleSettleInteractionP95Probe({
          repoRoot: root,
          previewFrames: 16,
          refineFrames: 6,
          idleSettleMs: 20,
          write: true,
        });
      expect(p95.ok).toBe(true);
      expect(p95.payload.summary?.frameMs?.p95).toBeGreaterThan(0);
      expect(p95.payload.summary?.modes).toContain("preview");
      expect(p95.payload.summary?.modes).toContain("refine");
      expect(idleEvidence.refinedViaIdleTimer).toBe(true);
      expect(idleEvidence.modeAfterIdleWait).toBe("refine");
      expect((idleEvidence.settleObservedMs as number)).toBeGreaterThanOrEqual(15);
      expect(condensedPaths).toBeTruthy();
      expect(idlePaths).toBeTruthy();
      expect(existsSync(join(root, "artifacts/validation/bot-c", IDLE_REFINE_EVIDENCE_FILE))).toBe(
        true,
      );
      expect(
        existsSync(join(root, "artifacts/validation/bot-c", INTERACTION_P95_CONDENSED_FILE)),
      ).toBe(true);
      const idle = JSON.parse(
        readFileSync(join(root, "artifacts/validation/bot-c", IDLE_REFINE_EVIDENCE_FILE), "utf8"),
      );
      expect(idle.kind).toBe("idle-settle-refine-evidence");
      expect(idle.status).toBe("WIP");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("solidifyInteractionP95Evidence dual-writes condensed when repo set", async () => {
    const repo = resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO;
    if (!repo) {
      expect(true).toBe(true);
      return;
    }
    const { p95, condensedPaths } = await solidifyInteractionP95Evidence({
      repoRoot: repo,
      previewFrames: 24,
      refineFrames: 8,
    });
    expect(p95.ok).toBe(true);
    expect(p95.payload.summary?.frameMs?.p50).toBeGreaterThan(0);
    expect(condensedPaths).toBeTruthy();

    const idle = await runIdleSettleInteractionP95Probe({
      repoRoot: repo,
      previewFrames: 32,
      refineFrames: 8,
      idleSettleMs: 25,
      write: true,
    });
    expect(idle.p95.ok).toBe(true);
    expect(idle.idleEvidence.refinedViaIdleTimer).toBe(true);
    expect(idle.idlePaths).toBeTruthy();
    expect(existsSync(idle.idlePaths!.artifactsPath)).toBe(true);
    expect(existsSync(idle.idlePaths!.docsPath)).toBe(true);
  });
});
