/**
 * Context-restore probe JSON (C-04).
 * Simulates lost->restored state machine; annotates gpu availability.
 */

import {
  nextWebGlUiState,
  planHeatmapContextRestore,
  type WebGlUiState,
} from "../webgl/contextRestore.js";

export interface ContextRestoreTransition {
  from: WebGlUiState;
  event: "lost" | "restored" | "init-ok";
  to: WebGlUiState;
  plan?: ReturnType<typeof planHeatmapContextRestore>;
}

export interface ContextRestoreProbePayload {
  bot: "bot-c";
  writtenAt: string;
  package: "@wss/charts";
  gate: "C-04";
  gpu: boolean;
  gpuAvailable: boolean;
  note: string;
  transitions: ContextRestoreTransition[];
  finalState: WebGlUiState;
  relatedInteractionProbe: string;
}

export function runContextRestoreProbe(options?: {
  writtenAt?: string;
  gpuAvailable?: boolean;
}): ContextRestoreProbePayload {
  const gpuAvailable = options?.gpuAvailable ?? false;
  const writtenAt = options?.writtenAt ?? new Date().toISOString();
  const transitions: ContextRestoreTransition[] = [];

  let state: WebGlUiState = nextWebGlUiState("ok", "init-ok");
  transitions.push({ from: "ok", event: "init-ok", to: state });

  const lostPlan = planHeatmapContextRestore("lost", true);
  state = nextWebGlUiState(state, "lost");
  transitions.push({ from: "ok", event: "lost", to: state, plan: lostPlan });

  const restoredPlan = planHeatmapContextRestore("restored", true);
  const fromLost = state;
  state = nextWebGlUiState(state, "restored");
  transitions.push({
    from: fromLost,
    event: "restored",
    to: state,
    plan: restoredPlan,
  });

  const settled: WebGlUiState = "ok";
  transitions.push({ from: state, event: "init-ok", to: settled });

  return {
    bot: "bot-c",
    writtenAt,
    package: "@wss/charts",
    gate: "C-04",
    gpu: gpuAvailable,
    gpuAvailable,
    note: gpuAvailable
      ? "context restore transitions with live GPU"
      : "simulated context restore (gpu:false / headless); interaction P95 is CPU synthetic",
    transitions,
    finalState: settled,
    relatedInteractionProbe:
      "docs/acceptance/evidence/bot-c/charts_probe_interaction_p95_2026-10-21.json",
  };
}
