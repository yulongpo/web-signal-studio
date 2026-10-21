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
  /** Effective DPR after clamp (bufferWidth / cssWidth). */
  dpr: number;
  /** True when backing store was clamped by maxDimension. */
  clamped: boolean;
}

/** Resolve a sane devicePixelRatio (min 1, finite). */
export function resolveDevicePixelRatio(
  override?: number,
  fallback: number = typeof globalThis !== "undefined" &&
    typeof (globalThis as { devicePixelRatio?: number }).devicePixelRatio === "number"
    ? (globalThis as { devicePixelRatio: number }).devicePixelRatio
    : 1,
): number {
  const raw = override ?? fallback;
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  return Math.max(1, raw);
}

/** Size a canvas backing store for devicePixelRatio without exceeding maxDimension. */
export function sizeCanvasForDpr(input: CanvasDprInput): CanvasDprSize {
  const dpr = resolveDevicePixelRatio(input.devicePixelRatio);
  const maxDim = input.maxDimension ?? 8192;
  const cssWidth = Math.max(0, input.cssWidth);
  const cssHeight = Math.max(0, input.cssHeight);
  let bufferWidth = Math.max(1, Math.round(cssWidth * dpr));
  let bufferHeight = Math.max(1, Math.round(cssHeight * dpr));
  let clamped = false;
  const scale = Math.min(1, maxDim / Math.max(bufferWidth, bufferHeight));
  if (scale < 1) {
    bufferWidth = Math.max(1, Math.floor(bufferWidth * scale));
    bufferHeight = Math.max(1, Math.floor(bufferHeight * scale));
    clamped = true;
  }
  return {
    cssWidth,
    cssHeight,
    bufferWidth,
    bufferHeight,
    dpr: bufferWidth / Math.max(cssWidth, 1e-9),
    clamped,
  };
}

/** True when the canvas buffer differs from the desired DPR size. */
export function needsCanvasResize(
  canvas: Pick<HTMLCanvasElement, "width" | "height">,
  size: CanvasDprSize,
): boolean {
  return canvas.width !== size.bufferWidth || canvas.height !== size.bufferHeight;
}

/** Apply CSS + buffer size to an HTMLCanvasElement (idempotent when unchanged). */
export function applyCanvasDpr(
  canvas: HTMLCanvasElement,
  input: CanvasDprInput,
): CanvasDprSize {
  const size = sizeCanvasForDpr(input);
  canvas.style.width = `${size.cssWidth}px`;
  canvas.style.height = `${size.cssHeight}px`;
  if (needsCanvasResize(canvas, size)) {
    canvas.width = size.bufferWidth;
    canvas.height = size.bufferHeight;
  }
  return size;
}

export interface CanvasResizeHandle {
  /** Latest computed size (null before first measure). */
  getSize: () => CanvasDprSize | null;
  /** Force a measure + apply using current client box. */
  resizeNow: () => CanvasDprSize;
  disconnect: () => void;
}

export interface AttachCanvasResizeOptions {
  /** Canvas to size (buffer + CSS). */
  canvas: HTMLCanvasElement;
  /** Element whose clientWidth/Height drive CSS size (defaults to canvas.parentElement). */
  container?: HTMLElement | null;
  devicePixelRatio?: number;
  maxDimension?: number;
  /** Called after each successful resize (including the initial one). */
  onResize?: (size: CanvasDprSize) => void;
  /** Optional ResizeObserver inject for tests. */
  ResizeObserverImpl?: typeof ResizeObserver;
}

/**
 * Keep a canvas backing store matched to container CSS size × DPR.
 * Uses ResizeObserver when available; always runs one initial resize.
 */
export function attachCanvasResize(options: AttachCanvasResizeOptions): CanvasResizeHandle {
  const {
    canvas,
    devicePixelRatio,
    maxDimension,
    onResize,
    ResizeObserverImpl =
      typeof ResizeObserver !== "undefined" ? ResizeObserver : undefined,
  } = options;
  let latest: CanvasDprSize | null = null;
  let observer: ResizeObserver | null = null;

  const measureTarget = (): { w: number; h: number } => {
    const el = options.container ?? canvas.parentElement ?? canvas;
    return {
      w: Math.max(1, el.clientWidth || canvas.clientWidth || 1),
      h: Math.max(1, el.clientHeight || canvas.clientHeight || 1),
    };
  };

  const resizeNow = (): CanvasDprSize => {
    const { w, h } = measureTarget();
    const size = applyCanvasDpr(canvas, {
      cssWidth: w,
      cssHeight: h,
      devicePixelRatio: resolveDevicePixelRatio(devicePixelRatio),
      maxDimension,
    });
    latest = size;
    onResize?.(size);
    return size;
  };

  resizeNow();

  if (ResizeObserverImpl) {
    const el = options.container ?? canvas.parentElement ?? canvas;
    observer = new ResizeObserverImpl(() => {
      resizeNow();
    });
    observer.observe(el);
  }

  return {
    getSize: () => latest,
    resizeNow,
    disconnect: () => {
      observer?.disconnect();
      observer = null;
    },
  };
}
