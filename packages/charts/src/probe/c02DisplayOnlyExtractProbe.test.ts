/**
 * C-02: live display-only tile extract (not schema-only) + dual-write.
 */
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  C02_LIVE_EXTRACT_FILE,
  runC02LiveDisplayOnlyExtractProbe,
} from "./c02DisplayOnlyExtractProbe.js";
import { resolveProbeRepoRoot } from "./dualWriteEvidence.js";

describe("C-02 live display-only tile extract probe", () => {
  it("runs real grid/viewport/spectrogram extracts with displayOnly + no forbidden keys", () => {
    const { payload, liveResults } = runC02LiveDisplayOnlyExtractProbe({
      write: false,
      repoRoot: null,
    });
    expect(payload.gate).toBe("C-02");
    expect(payload.kind).toBe("live-display-only-tile-extract");
    expect(payload.displayOnly).toBe(true);
    expect(payload.status).toBe("WIP");
    expect(payload.extracts.length).toBe(4);
    expect(liveResults.length).toBe(4);
    expect(payload.assertions.allDisplayOnly).toBe(true);
    expect(payload.assertions.noForbiddenKeysOnLiveResults).toBe(true);
    expect(payload.assertions.previewOutSmallerOrEqualRefine).toBe(true);
    expect(payload.assertions.everyExtractMsPositive).toBe(true);
    expect(payload.assertions.everyDataLengthMatchesWxH).toBe(true);

    const refine = payload.extracts.find((e) => e.name === "spectrogram-tile-refine");
    expect(refine).toBeTruthy();
    expect(refine!.dataPeak).toBeGreaterThan(1);
    expect(refine!.dataLength).toBe(refine!.width * refine!.height);
    expect(refine!.sourceWindow.w).toBeGreaterThan(0);
    expect(refine!.extractMs).toBeGreaterThan(0);

    for (const key of payload.forbiddenKeysAssertedAbsent) {
      for (const e of payload.extracts) {
        expect(e).not.toHaveProperty(key);
      }
    }
  });

  it("dual-writes live extract evidence to docs + artifacts", () => {
    const root = mkdtempSync(join(tmpdir(), "wss-c02-live-"));
    try {
      // Minimal repo shape for dual-write paths.
      const { payload, docsPath, artifactsPath } = runC02LiveDisplayOnlyExtractProbe({
        repoRoot: root,
        write: true,
      });
      expect(docsPath).toBeTruthy();
      expect(artifactsPath).toBeTruthy();
      expect(existsSync(docsPath!)).toBe(true);
      expect(existsSync(artifactsPath!)).toBe(true);
      const a = readFileSync(docsPath!, "utf8");
      const b = readFileSync(artifactsPath!, "utf8");
      expect(a).toBe(b);
      const json = JSON.parse(a);
      expect(json.gate).toBe("C-02");
      expect(json.kind).toBe("live-display-only-tile-extract");
      expect(json.extracts.length).toBe(4);
      expect(json.status).toBe("WIP");
      expect(payload.paths.docs).toContain(C02_LIVE_EXTRACT_FILE);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("dual-writes into real worktree when WSS_PROBE_REPO / walk-up resolves", () => {
    const repo = resolveProbeRepoRoot() ?? process.env.WSS_PROBE_REPO;
    if (!repo) {
      // CI / isolated runners without monorepo root — skip write, keep assert above.
      expect(true).toBe(true);
      return;
    }
    const { docsPath, artifactsPath, payload } = runC02LiveDisplayOnlyExtractProbe({
      repoRoot: repo,
      write: true,
    });
    expect(docsPath).toBeTruthy();
    expect(artifactsPath).toBeTruthy();
    expect(existsSync(docsPath!)).toBe(true);
    expect(existsSync(artifactsPath!)).toBe(true);
    expect(payload.extracts.every((e) => e.extractMs > 0)).toBe(true);
    const docs = JSON.parse(readFileSync(docsPath!, "utf8"));
    const arts = JSON.parse(readFileSync(artifactsPath!, "utf8"));
    expect(docs.kind).toBe("live-display-only-tile-extract");
    expect(arts.kind).toBe(docs.kind);
    expect(docs.extracts.length).toBe(arts.extracts.length);
  });
});
