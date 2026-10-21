import { describe, expect, it } from "vitest";
import {
  collectGpuWebglProbe,
  collectGpuWebglProbeFromEnvironment,
} from "./gpuWebglProbe.js";
import { dualWriteEvidenceJson, resolveProbeRepoRoot } from "./dualWriteEvidence.js";

const SCHEMA_KEYS = [
  "bot", "writtenAt", "package", "gate", "gpuAvailable", "webglVersion",
  "textureFormat", "lutSize", "lutFormat", "rendererVendor", "rendererRenderer",
  "maxTextureSize", "note",
] as const;

describe("C-01 GPU/WebGL2/LUT probe schema", () => {
  it("emits full schema with gpuAvailable:false when no GL", () => {
    const probe = collectGpuWebglProbe({ gl: null, writtenAt: "2026-10-21T00:00:00.000Z" });
    expect(probe.gate).toBe("C-01");
    expect(probe.gpuAvailable).toBe(false);
    expect(probe.lutSize).toBe(256);
    expect(probe.lutFormat).toBe("RGBA8");
    expect(probe.webglVersion).toBeNull();
    expect(probe.textureFormat).toBeNull();
    for (const k of SCHEMA_KEYS) expect(probe).toHaveProperty(k);
  });

  it("environment helper is safe in Node (no GPU)", () => {
    const probe = collectGpuWebglProbeFromEnvironment();
    expect(probe.gpuAvailable).toBe(false);
    expect(probe.package).toBe("@wss/charts");
  });

  it("dual-writes evidence JSON to docs + artifacts when repo root known", () => {
    const repo = resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO;
    if (!repo) {
      expect(true).toBe(true);
      return;
    }
    const probe = collectGpuWebglProbe({ gl: null });
    const { docsPath, artifactsPath } = dualWriteEvidenceJson(
      "charts_probe_gpu_webgl_lut_2026-10-21.json",
      probe,
      { repoRoot: repo },
    );
    expect(docsPath.replace(/\\/g, "/")).toContain("docs/acceptance/evidence/bot-c/");
    expect(artifactsPath.replace(/\\/g, "/")).toContain("artifacts/validation/bot-c/");
    expect(probe.gpuAvailable).toBe(false);
  });
});
