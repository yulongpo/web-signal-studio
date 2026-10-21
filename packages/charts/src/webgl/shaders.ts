/** Heatmap shaders: sample scalar intensity, then independent LUT. */

export const HEATMAP_VERT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 a_pos;
out vec2 v_uv;
uniform vec4 u_uvRect; // x0,y0,x1,y1 in scalar texture space
void main() {
  // a_pos in clip space [-1,1]
  v_uv = mix(u_uvRect.xy, u_uvRect.zw, a_pos * 0.5 + 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

export const HEATMAP_FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 v_uv;
uniform sampler2D u_scalar;
uniform sampler2D u_lut;
uniform vec2 u_levels; // min, max of scalar before LUT
out vec4 outColor;
void main() {
  float s = texture(u_scalar, v_uv).r;
  float t = clamp((s - u_levels.x) / max(u_levels.y - u_levels.x, 1e-12), 0.0, 1.0);
  outColor = texture(u_lut, vec2(t, 0.5));
}
`;

export function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
): WebGLShader {
  const sh = gl.createShader(type);
  if (!sh) throw new Error("createShader failed");
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh) ?? "unknown";
    gl.deleteShader(sh);
    throw new Error(`shader compile: ${info}`);
  }
  return sh;
}

export function linkProgram(
  gl: WebGL2RenderingContext,
  vert: string,
  frag: string,
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag);
  const prog = gl.createProgram();
  if (!prog) throw new Error("createProgram failed");
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog) ?? "unknown";
    gl.deleteProgram(prog);
    throw new Error(`program link: ${info}`);
  }
  return prog;
}
