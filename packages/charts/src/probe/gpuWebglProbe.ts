/**
 * Machine-readable GPU / WebGL2 / LUT probe (C-01).
 * Headless Node: gpuAvailable=false with full schema still emitted.
 */

export interface GpuWebglProbeFields {
  bot: "bot-c";
  writtenAt: string;
  package: "@wss/charts";
  gate: "C-01";
  gpuAvailable: boolean;
  webglVersion: string | null;
  textureFormat: string | null;
  lutSize: number;
  lutFormat: "RGBA8";
  rendererVendor: string | null;
  rendererRenderer: string | null;
  maxTextureSize: number | null;
  note: string;
}

export interface CollectGpuWebglProbeOptions {
  gl?: WebGL2RenderingContext | null;
  lutSize?: number;
  writtenAt?: string;
}

function readDebugParam(gl: WebGL2RenderingContext, pname: number): string | null {
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    if (!ext) return null;
    const v = gl.getParameter(pname);
    return typeof v === "string" ? v : null;
  } catch {
    return null;
  }
}

export function collectGpuWebglProbe(
  options: CollectGpuWebglProbeOptions = {},
): GpuWebglProbeFields {
  const lutSize = options.lutSize ?? 256;
  const writtenAt = options.writtenAt ?? new Date().toISOString();
  const base: GpuWebglProbeFields = {
    bot: "bot-c",
    writtenAt,
    package: "@wss/charts",
    gate: "C-01",
    gpuAvailable: false,
    webglVersion: null,
    textureFormat: null,
    lutSize,
    lutFormat: "RGBA8",
    rendererVendor: null,
    rendererRenderer: null,
    maxTextureSize: null,
    note: "no WebGL2 context (headless / Node); schema emitted for QA",
  };
  const gl = options.gl ?? null;
  if (!gl) return base;
  let webglVersion: string | null = null;
  try {
    const v = gl.getParameter(gl.VERSION);
    webglVersion = typeof v === "string" ? v : "WebGL2";
  } catch {
    webglVersion = "WebGL2";
  }
  let maxTextureSize: number | null = null;
  try {
    const m = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    maxTextureSize = typeof m === "number" ? m : null;
  } catch {
    maxTextureSize = null;
  }
  let textureFormat = "R32F";
  try {
    const test = gl.createTexture();
    if (test) {
      gl.bindTexture(gl.TEXTURE_2D, test);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, 1, 1, 0, gl.RED, gl.FLOAT, new Float32Array([0]));
      if (gl.getError() !== gl.NO_ERROR) textureFormat = "R8";
      gl.deleteTexture(test);
    }
  } catch {
    textureFormat = "R8";
  }
  const UNMASKED_VENDOR_WEBGL = 0x9245;
  const UNMASKED_RENDERER_WEBGL = 0x9246;
  return {
    ...base,
    gpuAvailable: true,
    webglVersion,
    textureFormat,
    lutSize,
    lutFormat: "RGBA8",
    rendererVendor: readDebugParam(gl, UNMASKED_VENDOR_WEBGL),
    rendererRenderer: readDebugParam(gl, UNMASKED_RENDERER_WEBGL),
    maxTextureSize,
    note: "WebGL2 scalar + independent RGBA8 LUT (HeatmapRenderer)",
  };
}

export function collectGpuWebglProbeFromEnvironment(
  options: Omit<CollectGpuWebglProbeOptions, "gl"> = {},
): GpuWebglProbeFields {
  try {
    if (typeof document !== "undefined") {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2");
      return collectGpuWebglProbe({ ...options, gl });
    }
  } catch {
    // fall through
  }
  return collectGpuWebglProbe({ ...options, gl: null });
}
