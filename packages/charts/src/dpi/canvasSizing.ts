export interface CanvasDprInput {
  cssWidth: number;
  cssHeight: number;
  devicePixelRatio?: number;
  /** Max backing-store dimension on one side (GPU safety). */
  maxDimension?: number;
}

export interface CanvasDprSize {
  cssWidth: number;
  cssHeight: number;
  bufferWidth: number;
  bufferHeight: number;
  dpr: number;
}

/** Size a canvas backing store for devicePixelRatio without exceeding maxDimension. */
export function sizeCanvasForDpr(input: CanvasDprInput): CanvasDprSize {
  const dpr = Math.max(1, input.devicePixelRatio ?? 1);
  const maxDim = input.maxDimension ?? 8192;
  let bufferWidth = Math.max(1, Math.round(input.cssWidth * dpr));
  let bufferHeight = Math.max(1, Math.round(input.cssHeight * dpr));
  const scale = Math.min(1, maxDim / Math.max(bufferWidth, bufferHeight));
  if (scale < 1) {
    bufferWidth = Math.max(1, Math.floor(bufferWidth * scale));
    bufferHeight = Math.max(1, Math.floor(bufferHeight * scale));
  }
  return {
    cssWidth: input.cssWidth,
    cssHeight: input.cssHeight,
    bufferWidth,
    bufferHeight,
    dpr: bufferWidth / Math.max(input.cssWidth, 1e-9),
  };
}

/** Apply CSS + buffer size to an HTMLCanvasElement. */
export function applyCanvasDpr(
  canvas: HTMLCanvasElement,
  input: CanvasDprInput,
): CanvasDprSize {
  const size = sizeCanvasForDpr(input);
  canvas.style.width = `${size.cssWidth}px`;
  canvas.style.height = `${size.cssHeight}px`;
  if (canvas.width !== size.bufferWidth) canvas.width = size.bufferWidth;
  if (canvas.height !== size.bufferHeight) canvas.height = size.bufferHeight;
  return size;
}
