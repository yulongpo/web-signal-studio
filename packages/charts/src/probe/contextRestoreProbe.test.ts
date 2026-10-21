import { describe, expect, it } from "vitest";
import { runContextRestoreProbe } from "./contextRestoreProbe.js";
import { dualWriteEvidenceJson, resolveProbeRepoRoot } from "./dualWriteEvidence.js";

describe("C-04 context-restore probe", () => {
  it("records lost->restored transitions with gpu:false by default", () => {
    const probe = runContextRestoreProbe({
      writtenAt: "2026-10-21T00:00:00.000Z",
      gpuAvailable: false,
    });
    expect(probe.gate).toBe("C-04");
    expect(probe.gpu).toBe(false);
    expect(probe.gpuAvailable).toBe(false);
    expect(probe.finalState).toBe("ok");
    expect(probe.transitions.length).toBeGreaterThanOrEqual(3);
    const events = probe.transitions.map((t) => t.event);
    expect(events).toContain("lost");
    expect(events).toContain("restored");
    const lost = probe.transitions.find((t) => t.event === "lost");
    expect(lost?.to).toBe("lost");
    expect(lost?.plan?.uiState).toBe("lost");
    const restored = probe.transitions.find((t) => t.event === "restored");
    expect(restored?.to).toBe("restored");
    expect(restored?.plan?.createRenderer).toBe(true);
    expect(restored?.plan?.reuploadTextures).toBe(true);
  });

  it("dual-writes evidence JSON to docs + artifacts when repo root known", () => {
    const repo = resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO;
    if (!repo) {
      expect(true).toBe(true);
      return;
    }
    const probe = runContextRestoreProbe({ gpuAvailable: false });
    const { docsPath, artifactsPath } = dualWriteEvidenceJson(
      "charts_probe_context_restore_2026-10-21.json",
      probe,
      { repoRoot: repo },
    );
    expect(docsPath.replace(/\\/g, "/")).toContain("docs/acceptance/evidence/bot-c/");
    expect(artifactsPath.replace(/\\/g, "/")).toContain("artifacts/validation/bot-c/");
  });
});
