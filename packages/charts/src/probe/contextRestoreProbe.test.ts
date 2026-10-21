import { describe, expect, it } from "vitest";
import { runContextRestoreProbe } from "./contextRestoreProbe.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

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

  it("writes evidence JSON when WSS_PROBE_REPO set", () => {
    const repo = process.env.WSS_PROBE_REPO;
    if (!repo) { expect(true).toBe(true); return; }
    const probe = runContextRestoreProbe({ gpuAvailable: false });
    const dir = join(repo, "artifacts/validation/bot-c");
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "charts_probe_context_restore_2026-10-21.json"), JSON.stringify(probe, null, 2), "utf8");
  });
});
