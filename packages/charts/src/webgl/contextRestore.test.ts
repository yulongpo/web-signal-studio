import { describe, expect, it, vi } from "vitest";
import {
  nextWebGlUiState,
  planHeatmapContextRestore,
  attachWebGlContextLifecycle,
} from "./contextRestore.js";

describe("contextRestore", () => {
  it("nextWebGlUiState transitions", () => {
    expect(nextWebGlUiState("ok", "lost")).toBe("lost");
    expect(nextWebGlUiState("lost", "restored")).toBe("restored");
    expect(nextWebGlUiState("ok", "init-fail")).toBe("unavailable");
    expect(nextWebGlUiState("unavailable", "init-ok")).toBe("ok");
  });

  it("planHeatmapContextRestore on lost avoids GL dispose", () => {
    const plan = planHeatmapContextRestore("lost", true);
    expect(plan.disposeRenderer).toBe(false);
    expect(plan.createRenderer).toBe(false);
    expect(plan.reuploadTextures).toBe(false);
    expect(plan.uiState).toBe("lost");
  });

  it("planHeatmapContextRestore on restored rebuilds + reuploads", () => {
    const plan = planHeatmapContextRestore("restored", true);
    expect(plan.disposeRenderer).toBe(true);
    expect(plan.createRenderer).toBe(true);
    expect(plan.reuploadTextures).toBe(true);
    expect(plan.uiState).toBe("restored");
  });

  it("attachWebGlContextLifecycle fires hooks", () => {
    const listeners = new Map<string, EventListener>();
    const target = {
      addEventListener: (type: string, fn: EventListener) => {
        listeners.set(type, fn);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
    };
    const onLost = vi.fn();
    const onRestored = vi.fn();
    const detach = attachWebGlContextLifecycle(target as unknown as HTMLCanvasElement, {
      onLost,
      onRestored,
    });
    const lostEv = { preventDefault: vi.fn() } as unknown as Event;
    listeners.get("webglcontextlost")!(lostEv);
    expect(onLost).toHaveBeenCalledTimes(1);
    expect((lostEv as { preventDefault: () => void }).preventDefault).toHaveBeenCalled();
    listeners.get("webglcontextrestored")!(new Event("webglcontextrestored"));
    expect(onRestored).toHaveBeenCalledTimes(1);
    detach();
    expect(listeners.size).toBe(0);
  });
});

