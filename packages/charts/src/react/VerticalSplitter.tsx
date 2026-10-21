import {
  useCallback,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

export interface VerticalSplitterProps {
  /** Current size of the pane above the splitter (CSS px). */
  sizePx: number;
  minPx?: number;
  maxPx?: number;
  /** Double-click restores this height (desktop enforceLayout default). */
  defaultPx?: number;
  onChange: (nextPx: number) => void;
  orientation?: "horizontal"; // horizontal bar → vertical resize of panes
  testId?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Horizontal drag handle between vertically stacked chart panes (G05).
 * Double-click restores defaultPx.
 */
export function VerticalSplitter(props: VerticalSplitterProps) {
  const {
    sizePx,
    minPx = 48,
    maxPx = 800,
    defaultPx = 205,
    onChange,
    testId = "vertical-splitter",
    className,
    style,
  } = props;

  const drag = useRef<{ pointerId: number; startY: number; startSize: number } | null>(
    null,
  );

  const onPointerDown = useCallback(
    (ev: ReactPointerEvent<HTMLDivElement>) => {
      if (ev.button !== 0) return;
      ev.currentTarget.setPointerCapture(ev.pointerId);
      drag.current = {
        pointerId: ev.pointerId,
        startY: ev.clientY,
        startSize: sizePx,
      };
    },
    [sizePx],
  );

  const onPointerMove = useCallback(
    (ev: ReactPointerEvent<HTMLDivElement>) => {
      const d = drag.current;
      if (!d || d.pointerId !== ev.pointerId) return;
      const dy = ev.clientY - d.startY;
      const next = Math.min(maxPx, Math.max(minPx, d.startSize + dy));
      onChange(next);
    },
    [maxPx, minPx, onChange],
  );

  const end = useCallback((ev: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId === ev.pointerId) drag.current = null;
  }, []);

  const onDoubleClick = useCallback(() => {
    onChange(defaultPx);
  }, [defaultPx, onChange]);

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-valuenow={Math.round(sizePx)}
      data-testid={testId}
      data-size-px={Math.round(sizePx)}
      className={className}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={onDoubleClick}
      title="Drag to resize · double-click to reset"
      style={{
        height: 6,
        cursor: "row-resize",
        background: "#1a2433",
        borderTop: "1px solid #293f56",
        borderBottom: "1px solid #293f56",
        flex: "0 0 auto",
        touchAction: "none",
        ...style,
      }}
    />
  );
}
