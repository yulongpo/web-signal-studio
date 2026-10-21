import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PreviewRefineController,
  createPreviewRefineController,
} from "./previewRefine.js";

describe("PreviewRefineController", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("enters preview on interaction and refine after idle", () => {
    vi.useFakeTimers();
    const modes: string[] = [];
    const ctrl = new PreviewRefineController(
      {
        onPreview: () => modes.push("preview"),
        onRefine: () => modes.push("refine"),
        onModeChange: (m) => modes.push(`chg:${m}`),
      },
      { idleSettleMs: 100 },
    );
    expect(ctrl.getMode()).toBe("idle");
    ctrl.noteInteraction();
    expect(ctrl.getMode()).toBe("preview");
    expect(ctrl.isPreviewing()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(ctrl.getMode()).toBe("refine");
    expect(ctrl.isRefining()).toBe(true);
    expect(modes).toContain("preview");
    expect(modes).toContain("refine");
    ctrl.dispose();
  });

  it("retriggers idle timer on continued interaction", () => {
    vi.useFakeTimers();
    const onRefine = vi.fn();
    const ctrl = createPreviewRefineController(
      { onRefine },
      { idleSettleMs: 50 },
    );
    ctrl.noteInteraction();
    vi.advanceTimersByTime(40);
    ctrl.noteInteraction();
    vi.advanceTimersByTime(40);
    expect(onRefine).not.toHaveBeenCalled();
    vi.advanceTimersByTime(20);
    expect(onRefine).toHaveBeenCalledTimes(1);
    ctrl.dispose();
  });

  it("requestRefine bypasses settle wait", () => {
    vi.useFakeTimers();
    const onRefine = vi.fn();
    const ctrl = new PreviewRefineController({ onRefine }, 500);
    ctrl.noteInteraction();
    ctrl.requestRefine();
    expect(onRefine).toHaveBeenCalledTimes(1);
    expect(ctrl.getMode()).toBe("refine");
    ctrl.dispose();
  });
});
