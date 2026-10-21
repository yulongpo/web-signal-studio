export type PreviewRefineMode = "preview" | "refine" | "idle";

export interface PreviewRefineHooks {
  /** Called when entering interactive preview (cheaper extract / coarser grid). */
  onPreview?: () => void;
  /** Called after idleSettleMs with no further interaction — full-res refine. */
  onRefine?: () => void;
  /** Optional idle reset. */
  onIdle?: () => void;
  /** Fired on every mode transition (including re-entry to the same logical path). */
  onModeChange?: (mode: PreviewRefineMode, prev: PreviewRefineMode) => void;
}

export interface PreviewRefineOptions {
  idleSettleMs?: number;
  /** Inject timers for tests. */
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
}

/**
 * Interaction policy: preview while dragging/zooming; refine after idle.
 * Does not schedule FFT — callers hook DSP separately.
 *
 * Bot-B wiring:
 * ```ts
 * const ctrl = new PreviewRefineController({
 *   onPreview: () => setExtractMode("preview"),
 *   onRefine: () => setExtractMode("refine"),
 *   onModeChange: (m) => probe.mark("mode", 0, { mode: m }),
 * }, 180);
 * chartEl.addEventListener("pointermove", () => ctrl.noteInteraction());
 * chartEl.addEventListener("pointerup", () => ctrl.requestRefine());
 * ```
 */
export class PreviewRefineController {
  private mode: PreviewRefineMode = "idle";
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly idleSettleMs: number;
  private readonly hooks: PreviewRefineHooks;
  private readonly setTimeoutFn: typeof setTimeout;
  private readonly clearTimeoutFn: typeof clearTimeout;
  private disposed = false;

  constructor(hooks: PreviewRefineHooks = {}, idleSettleMsOrOpts: number | PreviewRefineOptions = 180) {
    this.hooks = hooks;
    const boundSetTimeout: typeof setTimeout = ((
      fn: TimerHandler,
      ms?: number,
      ...args: unknown[]
    ) => setTimeout(fn, ms, ...args)) as typeof setTimeout;
    const boundClearTimeout: typeof clearTimeout = ((
      id?: ReturnType<typeof setTimeout> | string | number | undefined,
    ) => clearTimeout(id as ReturnType<typeof setTimeout>)) as typeof clearTimeout;
    if (typeof idleSettleMsOrOpts === "number") {
      this.idleSettleMs = idleSettleMsOrOpts;
      this.setTimeoutFn = boundSetTimeout;
      this.clearTimeoutFn = boundClearTimeout;
    } else {
      this.idleSettleMs = idleSettleMsOrOpts.idleSettleMs ?? 180;
      this.setTimeoutFn = idleSettleMsOrOpts.setTimeoutFn ?? boundSetTimeout;
      this.clearTimeoutFn = idleSettleMsOrOpts.clearTimeoutFn ?? boundClearTimeout;
    }
  }

  getMode(): PreviewRefineMode {
    return this.mode;
  }

  getIdleSettleMs(): number {
    return this.idleSettleMs;
  }

  isPreviewing(): boolean {
    return this.mode === "preview";
  }

  isRefining(): boolean {
    return this.mode === "refine";
  }

  /** User started pan/zoom/brush — enter preview and (re)arm idle refine. */
  noteInteraction(): void {
    if (this.disposed) return;
    this.clearTimer();
    this.setMode("preview");
    this.timer = this.setTimeoutFn(() => this.enterRefine(), this.idleSettleMs) as ReturnType<
      typeof setTimeout
    >;
  }

  /** Force refine now (e.g. mouseup / pointerleave after gesture). */
  requestRefine(): void {
    if (this.disposed) return;
    this.clearTimer();
    this.enterRefine();
  }

  resetIdle(): void {
    if (this.disposed) return;
    this.clearTimer();
    this.setMode("idle");
  }

  dispose(): void {
    this.clearTimer();
    this.disposed = true;
  }

  private enterRefine(): void {
    this.timer = null;
    this.setMode("refine");
  }

  private setMode(next: PreviewRefineMode): void {
    const prev = this.mode;
    if (prev === next) {
      // Still notify preview re-entry so hosts can refresh cheap extract.
      if (next === "preview") this.hooks.onPreview?.();
      return;
    }
    this.mode = next;
    if (next === "preview") this.hooks.onPreview?.();
    if (next === "refine") this.hooks.onRefine?.();
    if (next === "idle") this.hooks.onIdle?.();
    this.hooks.onModeChange?.(next, prev);
  }

  private clearTimer(): void {
    if (this.timer != null) {
      this.clearTimeoutFn(this.timer);
      this.timer = null;
    }
  }
}

/** Factory preferred by Bot-B when configuring settle ms + hooks together. */
export function createPreviewRefineController(
  hooks: PreviewRefineHooks = {},
  options: PreviewRefineOptions = {},
): PreviewRefineController {
  return new PreviewRefineController(hooks, options);
}
