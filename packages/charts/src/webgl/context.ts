/**
 * WebGL2 context create / loss / restore.
 * Heatmap path requires WebGL2; software fallback is out of Bot-C scope for P2-C.
 */

export interface WebGL2ContextOptions {
  antialias?: boolean;
  alpha?: boolean;
  premultipliedAlpha?: boolean;
  preserveDrawingBuffer?: boolean;
  powerPreference?: WebGLPowerPreference;
  onContextLost?: (ev: Event) => void;
  onContextRestored?: (ev: Event) => void;
}

export interface WebGL2ContextHandle {
  readonly canvas: HTMLCanvasElement;
  readonly gl: WebGL2RenderingContext;
  readonly isLost: boolean;
  /** Re-query context after restore; returns null if still lost. */
  restore(): WebGL2RenderingContext | null;
  dispose(): void;
}

export function createWebGL2Context(
  canvas: HTMLCanvasElement,
  options: WebGL2ContextOptions = {},
): WebGL2ContextHandle {
  const {
    antialias = false,
    alpha = false,
    premultipliedAlpha = false,
    preserveDrawingBuffer = false,
    powerPreference = "high-performance",
    onContextLost,
    onContextRestored,
  } = options;

  let lost = false;

  const loseHandler = (ev: Event) => {
    ev.preventDefault();
    lost = true;
    onContextLost?.(ev);
  };
  const restoreHandler = (ev: Event) => {
    lost = false;
    onContextRestored?.(ev);
  };

  canvas.addEventListener("webglcontextlost", loseHandler, false);
  canvas.addEventListener("webglcontextrestored", restoreHandler, false);

  const gl = canvas.getContext("webgl2", {
    antialias,
    alpha,
    premultipliedAlpha,
    preserveDrawingBuffer,
    powerPreference,
    desynchronized: false,
  });

  if (!gl) {
    canvas.removeEventListener("webglcontextlost", loseHandler);
    canvas.removeEventListener("webglcontextrestored", restoreHandler);
    throw new Error("@wss/charts: WebGL2 not available on this canvas / GPU");
  }

  return {
    canvas,
    gl,
    get isLost() {
      return lost || gl.isContextLost();
    },
    restore() {
      if (gl.isContextLost()) return null;
      lost = false;
      return gl;
    },
    dispose() {
      canvas.removeEventListener("webglcontextlost", loseHandler);
      canvas.removeEventListener("webglcontextrestored", restoreHandler);
      const ext = gl.getExtension("WEBGL_lose_context");
      ext?.loseContext();
    },
  };
}
