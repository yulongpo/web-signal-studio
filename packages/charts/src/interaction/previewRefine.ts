export type PreviewRefineMode = "preview" | "refine" | "idle";

export interface PreviewRefineHooks {
  /** Called when entering interactive preview (cheaper extract / coarser grid). */
  onPreview?: () => void;
  /** Called after idleSettleMs with no further interaction — full-res refine. */
  onRefine?: () => void;
  /** Optional idle reset. */
  onIdle?: () => void;
}

/**
 * Interaction policy: preview while dragging/zooming; refine after idle.
 * Does not schedule FFT — callers hook DSP separately.
 */
export class PreviewRefineController {
  private mode: PreviewRefineMode = "idle";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly idleSettleMs: number;
  private readonly hooks: PreviewRefineHooks;
  private disposed = false;

  constructor(hooks: PreviewRefineHooks = {}, idleSettleMs = 180) {
    this.hooks = hooks;
    this.idleSettleMs = idleSettleMs;
  }

  getMode(): PreviewRefineMode {
    return this.mode;
  }

  /** User started pan/zoom/brush — enter preview. */
  noteInteraction(): void {
    if (this.disposed) return;
    this.clearTimer();
    if (this.mode !== "preview") {
      this.mode = "preview";
      this.hooks.onPreview?.();
    }
    this.timer = setTimeout(() => this.enterRefine(), this.idleSettleMs);
  }

  /** Force refine now (e.g. mouseup). */
  requestRefine(): void {
    if (this.disposed) return;
    this.clearTimer();
    this.enterRefine();
  }

  resetIdle(): void {
    if (this.disposed) return;
    this.clearTimer();
    this.mode = "idle";
    this.hooks.onIdle?.();
  }

  dispose(): void {
    this.clearTimer();
    this.disposed = true;
  }

  private enterRefine(): void {
    this.mode = "refine";
    this.hooks.onRefine?.();
  }

  private clearTimer(): void {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
