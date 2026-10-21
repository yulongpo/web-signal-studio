import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  dualWriteEvidenceJson,
  dualWriteEvidenceFile,
  ensureEvidenceDirs,
} from "./dualWriteEvidence.js";

describe("dualWriteEvidence", () => {
  it("writes identical JSON to docs and artifacts trees", () => {
    const root = mkdtempSync(join(tmpdir(), "wss-dual-"));
    try {
      // minimal repo shape not required; dualWrite takes explicit repoRoot
      const payload = { bot: "bot-c", gate: "C-02", ok: true };
      const { docsPath, artifactsPath } = dualWriteEvidenceJson(
        "c02_dual_test.json",
        payload,
        { repoRoot: root },
      );
      expect(existsSync(docsPath)).toBe(true);
      expect(existsSync(artifactsPath)).toBe(true);
      expect(readFileSync(docsPath, "utf8")).toBe(readFileSync(artifactsPath, "utf8"));
      expect(docsPath.replace(/\\/g, "/")).toContain("docs/acceptance/evidence/bot-c/");
      expect(artifactsPath.replace(/\\/g, "/")).toContain("artifacts/validation/bot-c/");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("ensureEvidenceDirs creates both folders", () => {
    const root = mkdtempSync(join(tmpdir(), "wss-dual-dirs-"));
    try {
      const dirs = ensureEvidenceDirs(root);
      expect(existsSync(dirs.docs)).toBe(true);
      expect(existsSync(dirs.artifacts)).toBe(true);
      dualWriteEvidenceFile("note.txt", "hello\n", { repoRoot: root });
      expect(readFileSync(join(dirs.docs, "note.txt"), "utf8")).toBe("hello\n");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
