import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { applyCanvasDpr, resolveDevicePixelRatio } from "../dpi/canvasSizing.js";
import type { ViewDomain } from "../interaction/viewTransform.js";
import {
  resolveNavigationOverviewCursor,
  type NavigationOverviewCursor,
} from "../interaction/chartHitZone.js";

export interface NavigationChartProps {
  /** Full time extent of the capture. */
  fullTime: ViewDomain;
  /** Current linked main-chart time window. */
  windowTime: { min: number; max: number };
  /** Optional overview power envelope (one sample per x). */
  envelope?: Float32Array;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
  testId?: string;
  onWindowChange?: (next: { min: number; max: number }) => void;
}

/**
 * Global time navigation strip (G03) — linked window over full time domain.
 * Display / interaction only.
 *
 * G11 overview OpenHand (17471a6 Kind::Navigation):
 * - hover inside overview window → grab (OpenHandCursor)
 * - drag move inside window → grabbing (ClosedHandCursor)
 * - outside window / create-drag → pointer (PointingHandCursor)
 */
export function NavigationChart(props: NavigationChartProps) {
  const {
    fullTime,
    windowTime,
    envelope,
    height = 82,
    className,
    style,
    testId = "navigation-chart",
    onWindowChange,
  } = props;

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const windowRef = useRef(windowTime);
  windowRef.current = windowTime;
  const drag = useRef<{
    mode: "move" | "create";
    pointerId: number;
    startX: number;
    originMin: number;
    originMax: number;
  } | null>(null);

  const [overviewCursor, setOverviewCursor] =
    useState<NavigationOverviewCursor>("pointer");

  const timeAt = useCallback(
    (cssX: number, cssW: number) => {
      const t = Math.min(1, Math.max(0, cssX / Math.max(1, cssW)));
      return fullTime.min + t * (fullTime.max - fullTime.min);
    },
    [fullTime.min, fullTime.max],
  );

  const insideWindowAt = useCallback(
    (cssX: number, cssW: number, win: { min: number; max: number }) => {
      const t = timeAt(cssX, cssW);
      return t >= win.min && t <= win.max;
    },
    [timeAt],
  );

  const syncCursor = useCallback(
    (cssX: number, cssW: number) => {
      const d = drag.current;
      const win = windowRef.current;
      const inside = insideWindowAt(cssX, cssW, win);
      const next = resolveNavigationOverviewCursor({
        insideWindow: inside,
        draggingWindow: Boolean(d && d.mode === "move"),
      });
      setOverviewCursor(next);
    },
    [insideWindowAt],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const draw = () => {
      const cssW = Math.max(1, wrap.clientWidth);
      const cssH =
        typeof height === "number" ? height : Math.max(1, wrap.clientHeight || 82);
      const dpr = resolveDevicePixelRatio(window.devicePixelRatio);
      applyCanvasDpr(canvas, {
        cssWidth: cssW,
        cssHeight: cssH,
        devicePixelRatio: dpr,
      });
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0b1422";
      ctx.fillRect(0, 0, cssW, cssH);

      const span = fullTime.max - fullTime.min || 1;
      if (envelope && envelope.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#3d5a80";
        ctx.lineWidth = 1;
        for (let i = 0; i < envelope.length; i++) {
          const x = (i / (envelope.length - 1)) * cssW;
          const y = cssH - envelope[i]! * (cssH - 4) - 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      const x0 = ((windowTime.min - fullTime.min) / span) * cssW;
      const x1 = ((windowTime.max - fullTime.min) / span) * cssW;
      ctx.fillStyle = "rgba(96, 165, 250, 0.25)";
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1;
      ctx.fillRect(Math.min(x0, x1), 1, Math.abs(x1 - x0), cssH - 2);
      ctx.strokeRect(Math.min(x0, x1), 1, Math.abs(x1 - x0), cssH - 2);

      // Time readout so the strip is visibly "live", not an empty bar.
      ctx.fillStyle = "#9aa7b5";
      ctx.font = "10px system-ui,sans-serif";
      ctx.fillText(fullTime.min.toFixed(3) + "s", 4, cssH - 4);
      ctx.fillText(
        fullTime.max.toFixed(3) + "s",
        Math.max(4, cssW - 48),
        cssH - 4,
      );
      const mid = (windowTime.min + windowTime.max) / 2;
      const midX = ((mid - fullTime.min) / span) * cssW;
      ctx.fillStyle = "#dbe8f8";
      ctx.fillText(
        windowTime.min.toFixed(3) + "–" + windowTime.max.toFixed(3) + "s",
        Math.min(Math.max(4, midX - 40), cssW - 90),
        12,
      );

      wrap.setAttribute("data-window-min", String(windowTime.min));
      wrap.setAttribute("data-window-max", String(windowTime.max));
      wrap.setAttribute("data-full-min", String(fullTime.min));
      wrap.setAttribute("data-full-max", String(fullTime.max));
    };

    draw();
    const RO = typeof ResizeObserver !== "undefined" ? ResizeObserver : null;
    const ro = RO ? new RO(() => draw()) : null;
    ro?.observe(wrap);
    return () => ro?.disconnect();
  }, [
    fullTime.min,
    fullTime.max,
    windowTime.min,
    windowTime.max,
    envelope,
    height,
  ]);

  const onPointerDown = (ev: ReactPointerEvent<HTMLDivElement>) => {
    if (ev.button !== 0 || !onWindowChange) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    wrap.setPointerCapture(ev.pointerId);
    const rect = wrap.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const t = timeAt(x, rect.width);
    const inside = t >= windowTime.min && t <= windowTime.max;
    drag.current = {
      mode: inside ? "move" : "create",
      pointerId: ev.pointerId,
      startX: x,
      originMin: inside ? windowTime.min : t,
      originMax: inside ? windowTime.max : t,
    };
    syncCursor(x, rect.width);
  };

  const onPointerMove = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ev.clientX - rect.left;
    const d = drag.current;

    if (d && d.pointerId === ev.pointerId && onWindowChange) {
      const t = timeAt(x, rect.width);
      if (d.mode === "move") {
        const dt = t - timeAt(d.startX, rect.width);
        let min = d.originMin + dt;
        let max = d.originMax + dt;
        const w = max - min;
        if (min < fullTime.min) {
          min = fullTime.min;
          max = min + w;
        }
        if (max > fullTime.max) {
          max = fullTime.max;
          min = max - w;
        }
        onWindowChange({ min, max });
      } else {
        onWindowChange({
          min: Math.min(d.originMin, t),
          max: Math.max(d.originMin, t),
        });
      }
    }

    syncCursor(x, rect.width);
  };

  const end = (ev: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const wrap = wrapRef.current;
    if (!d || !wrap || d.pointerId !== ev.pointerId) return;
    // G11: click (no meaningful drag) outside the window pans keeping span.
    if (d.mode === "create" && onWindowChange) {
      const rect = wrap.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const t = timeAt(x, rect.width);
      const moved = Math.abs(x - d.startX);
      if (moved < 4) {
        const span = Math.max(1e-12, windowTime.max - windowTime.min);
        let min = t - span / 2;
        let max = t + span / 2;
        if (min < fullTime.min) {
          min = fullTime.min;
          max = min + span;
        }
        if (max > fullTime.max) {
          max = fullTime.max;
          min = max - span;
        }
        onWindowChange({ min, max });
      }
    }
    drag.current = null;
    const rect = wrap.getBoundingClientRect();
    syncCursor(ev.clientX - rect.left, rect.width);
  };

  const onPointerLeave = () => {
    if (drag.current) return;
    setOverviewCursor("pointer");
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      data-testid={testId}
      data-nav-click-keeps-span="true"
      data-interaction-cursor={overviewCursor}
      data-nav-overview-cursor={overviewCursor}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onPointerLeave={onPointerLeave}
      style={{
        position: "relative",
        width: "100%",
        height: typeof height === "number" ? `${height}px` : height,
        overflow: "hidden",
        touchAction: onWindowChange ? "none" : undefined,
        cursor: overviewCursor,
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
