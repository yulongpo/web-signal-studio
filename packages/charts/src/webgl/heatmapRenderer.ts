import { HEATMAP_FRAG, HEATMAP_VERT, linkProgram } from "./shaders.js";

export type HeatmapOrientation = "stft" | "waterfall";

export interface HeatmapScalarUpload {
  /** Row-major Float32 intensities; length = width * height. */
  data: Float32Array;
  width: number;
  height: number;
}

export interface HeatmapLutUpload {
  /** RGBA8, length = size * 4. */
  rgba: Uint8Array;
  size: number;
}

export interface HeatmapDrawOptions {
  /** Scalar min/max mapped into LUT (does not mutate scalar texture). */
  levels: { min: number; max: number };
  /** UV sub-rect of scalar texture [x0,y0,x1,y1], default full. */
  uvRect?: [number, number, number, number];
  clear?: boolean;
  clearColor?: [number, number, number, number];
}

/**
 * WebGL2 heatmap: R32F (or R16F/R8 fallback) scalar texture + independent 1D LUT.
 * Changing colormap/levels only re-uploads LUT / uniforms — never the scalar buffer.
 */
export class HeatmapRenderer {
  readonly gl: WebGL2RenderingContext;
  readonly orientation: HeatmapOrientation;

  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private quad: WebGLBuffer;
  private scalarTex: WebGLTexture;
  private lutTex: WebGLTexture;
  private scalarW = 0;
  private scalarH = 0;
  private scalarRevision = 0;
  private lutRevision = 0;
  private disposed = false;

  private readonly locUvRect: WebGLUniformLocation;
  private readonly locLevels: WebGLUniformLocation;
  private readonly locScalar: WebGLUniformLocation;
  private readonly locLut: WebGLUniformLocation;

  /** Last uploaded scalar reference (not owned); for independence tests. */
  private lastScalarRef: Float32Array | null = null;

  constructor(gl: WebGL2RenderingContext, orientation: HeatmapOrientation = "stft") {
    this.gl = gl;
    this.orientation = orientation;
    this.program = linkProgram(gl, HEATMAP_VERT, HEATMAP_FRAG);

    const locUvRect = gl.getUniformLocation(this.program, "u_uvRect");
    const locLevels = gl.getUniformLocation(this.program, "u_levels");
    const locScalar = gl.getUniformLocation(this.program, "u_scalar");
    const locLut = gl.getUniformLocation(this.program, "u_lut");
    if (!locUvRect || !locLevels || !locScalar || !locLut) {
      throw new Error("HeatmapRenderer: missing uniforms");
    }
    this.locUvRect = locUvRect;
    this.locLevels = locLevels;
    this.locScalar = locScalar;
    this.locLut = locLut;

    const vao = gl.createVertexArray();
    const quad = gl.createBuffer();
    const scalarTex = gl.createTexture();
    const lutTex = gl.createTexture();
    if (!vao || !quad || !scalarTex || !lutTex) {
      throw new Error("HeatmapRenderer: GPU object alloc failed");
    }
    this.vao = vao;
    this.quad = quad;
    this.scalarTex = scalarTex;
    this.lutTex = lutTex;

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    // Full-screen triangle strip in clip space
    const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    // LUT defaults
    gl.bindTexture(gl.TEXTURE_2D, lutTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, scalarTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_2D, null);
  }

  getScalarRevision(): number {
    return this.scalarRevision;
  }

  getLutRevision(): number {
    return this.lutRevision;
  }

  getLastScalarRef(): Float32Array | null {
    return this.lastScalarRef;
  }

  /** Upload / replace scalar intensity texture only. */
  uploadScalar(upload: HeatmapScalarUpload): void {
    this.assertLive();
    const { gl } = this;
    const { data, width, height } = upload;
    if (data.length < width * height) {
      throw new Error("HeatmapRenderer.uploadScalar: data too short");
    }
    gl.bindTexture(gl.TEXTURE_2D, this.scalarTex);
    if (width !== this.scalarW || height !== this.scalarH) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.R32F,
        width,
        height,
        0,
        gl.RED,
        gl.FLOAT,
        data,
      );
      this.scalarW = width;
      this.scalarH = height;
    } else {
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        width,
        height,
        gl.RED,
        gl.FLOAT,
        data,
      );
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.lastScalarRef = data;
    this.scalarRevision += 1;
  }

  /** Upload independent LUT; does not touch scalar texture or revision. */
  uploadLut(upload: HeatmapLutUpload): void {
    this.assertLive();
    const { gl } = this;
    const { rgba, size } = upload;
    if (rgba.length < size * 4) {
      throw new Error("HeatmapRenderer.uploadLut: rgba too short");
    }
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      size,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba,
    );
    gl.bindTexture(gl.TEXTURE_2D, null);
    this.lutRevision += 1;
  }

  draw(opts: HeatmapDrawOptions): void {
    this.assertLive();
    if (this.scalarW === 0 || this.scalarH === 0) return;
    const { gl } = this;
    const {
      levels,
      uvRect = [0, 0, 1, 1],
      clear = true,
      clearColor = [0, 0, 0, 1],
    } = opts;

    if (clear) {
      gl.clearColor(...clearColor);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    gl.useProgram(this.program);
    gl.uniform4f(this.locUvRect, uvRect[0], uvRect[1], uvRect[2], uvRect[3]);
    gl.uniform2f(this.locLevels, levels.min, levels.max);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.scalarTex);
    gl.uniform1i(this.locScalar, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.uniform1i(this.locLut, 1);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    if (this.disposed) return;
    const { gl } = this;
    gl.deleteBuffer(this.quad);
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.scalarTex);
    gl.deleteTexture(this.lutTex);
    gl.deleteProgram(this.program);
    this.disposed = true;
  }

  private assertLive(): void {
    if (this.disposed) throw new Error("HeatmapRenderer disposed");
    if (this.gl.isContextLost()) throw new Error("HeatmapRenderer: WebGL context lost");
  }
}
