/**
 * WebGL UI state + restore orchestration for HeatmapCanvas.
 * Pure helpers are unit-tested without a real GPU.
 */

export type WebGlUiState = "ok" | "lost" | "restored" | "unavailable";

export type WebGlUiEvent = "init-ok" | "init-fail" | "lost" | "restored";

/** Deterministic state machine for data-webgl-state attribute. */
export function nextWebGlUiState(
  prev: WebGlUiState,
  event: WebGlUiEvent,
): WebGlUiState {
  switch (event) {
    case "init-ok":
      return "ok";
    case "init-fail":
      return "unavailable";
    case "lost":
      return "lost";
    case "restored":
      // After restore we briefly report "restored" so hosts/tests can observe recovery.
      return prev === "lost" || prev === "restored" ? "restored" : "restored";
    default:
      return prev;
  }
}

export interface HeatmapRestorePlan {
  /** Dispose previous renderer resources (no-op if none). */
  disposeRenderer: boolean;
  /** Construct a fresh HeatmapRenderer against the restored GL. */
  createRenderer: boolean;
  /** Re-upload scalar + LUT on the next paint. */
  reuploadTextures: boolean;
  /** Next UI state attribute value. */
  uiState: WebGlUiState;
}

/** Plan what HeatmapCanvas must do after a context event. */
export function planHeatmapContextRestore(
  event: "lost" | "restored",
  hadRenderer: boolean,
): HeatmapRestorePlan {
  if (event === "lost") {
    return {
      disposeRenderer: false, // GL objects are already invalid; avoid GL calls
      createRenderer: false,
      reuploadTextures: false,
      uiState: "lost",
    };
  }
  return {
    disposeRenderer: hadRenderer,
    createRenderer: true,
    reuploadTextures: true,
    uiState: "restored",
  };
}

export interface ContextLifecycleCallbacks {
  onLost?: () => void;
  onRestored?: () => void;
}

/**
 * Attach loss/restore listeners (mirrors createWebGL2Context hooks).
 * Returns detach fn. Used by tests with EventTarget stand-ins.
 */
export function attachWebGlContextLifecycle(
  target: Pick<HTMLCanvasElement, "addEventListener" | "removeEventListener">,
  callbacks: ContextLifecycleCallbacks,
): () => void {
  const lose = (ev: Event) => {
    if ("preventDefault" in ev && typeof ev.preventDefault === "function") {
      ev.preventDefault();
    }
    callbacks.onLost?.();
  };
  const restore = () => {
    callbacks.onRestored?.();
  };
  target.addEventListener("webglcontextlost", lose, false);
  target.addEventListener("webglcontextrestored", restore, false);
  return () => {
    target.removeEventListener("webglcontextlost", lose, false);
    target.removeEventListener("webglcontextrestored", restore, false);
  };
}
