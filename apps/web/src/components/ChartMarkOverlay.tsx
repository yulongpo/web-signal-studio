/**
 * Draws M-06 marks on the main chart using the live physical view.
 * G13: Ctrl/Shift multi-select + eight handles (4 corners + 4 edge midpoints).
 * G11 mark-edge: cursors match PlotWidget::edgeCursor @ 17471a6
 * (SizeFDiag/SizeBDiag/SizeHor/SizeVer). Continuous create stays with the
 * marker tool on MainChartHost (data-continuous-create).
 * G11 body-drag: selected mark body Move uses SizeAll (hover) / ClosedHand
 * (grabbing) while dragging, matching PlotWidget updateHover + MarkEdit Move.
 * Unselected mark hover uses PointingHand (pointer); Move only when already selected.
 * Unselected polish @ 17471a6: dashed stroke + low fill; hover tip name · click-to-select.
 * Body/edge Move clamps to file fullRange (navFullTime x spectrogram freq),
 * not only the current zoomed view (desktop MarkEdit fullRange).
 * sourceKind stroke/fill: ImportedLabel #65d2bd / Manual #edc56d / Algorithm #51c4e9
 * (PlotWidget @ 17471a6). Hover via setHoveredMark syncs bottom annotation table.
 */
import { useEffect, useState } from 'react';
import type { AnnotationJson } from '@wss/contracts';
import { resolveMarkEdgeCursor, resolveMarkBodyHoverCursor, type MarkEdge } from '@wss/charts';
import {
  applyMarkBodyDelta,
  clampMarkRangeToFull,
  cssToValue,
  halfOpenEnd,
  plotAxes,
  secondsToSampleIndex,
  valueToCss,
} from './chartGesture';

type Domain = { min: number; max: number };

type Props = {
  cssW: number;
  cssH: number;
  mode: 'stft' | 'waterfall';
  sampleRateHz: number;
  xDomain: Domain;
  yDomain: Domain;
  /** File full time extent (seconds). Clamp target; falls back to view time. */
  fullTime?: Domain;
  /** File full frequency extent (Hz). Clamp target; falls back to view freq. */
  fullFreq?: Domain;
};

type MarkRow = AnnotationJson & { id: string };
type HandleId = Exclude<MarkEdge, 'move'>;

type BodyDrag = {
  id: string;
  startX: number;
  startY: number;
  t0: number;
  t1: number;
  f0: number;
  f1: number;
};

/** Desktop PlotWidget sourceColor @ 17471a6. */
const SOURCE_KIND_STROKE: Record<string, string> = {
  ImportedLabel: '#65d2bd',
  Manual: '#edc56d',
  Algorithm: '#51c4e9',
};

function sourceStroke(kind: string | undefined): string {
  return (kind && SOURCE_KIND_STROKE[kind]) || SOURCE_KIND_STROKE.Algorithm;
}

function readMarks(): {
  marks: MarkRow[];
  selected: string[];
  active: string | null;
  hovered: string | null;
} {
  const hook = window.__wssM06;
  if (!hook) return { marks: [], selected: [], active: null, hovered: null };
  const state = hook.getState();
  const marks = (hook.session.annotations.annotations ?? []).filter(
    (mark) => !mark.deleted,
  ) as MarkRow[];
  return {
    marks,
    selected: state.selectedMarkIds ?? [],
    active: state.activeMarkId ?? null,
    hovered: state.hoveredMarkId ?? null,
  };
}

function setHoveredMark(id: string | null) {
  const hook = window.__wssM06;
  if (!hook?.setHoveredMark) return;
  hook.setHoveredMark(id);
}

/** Desktop PlotWidget::handles order: corners + edge midpoints. */
const HANDLES: {
  id: HandleId;
  left: (w: number) => number;
  top: (h: number) => number;
}[] = [
  { id: 'nw', left: () => 0, top: () => 0 },
  { id: 'n', left: (w) => w / 2, top: () => 0 },
  { id: 'ne', left: (w) => w, top: () => 0 },
  { id: 'e', left: (w) => w, top: (h) => h / 2 },
  { id: 'se', left: (w) => w, top: (h) => h },
  { id: 's', left: (w) => w / 2, top: (h) => h },
  { id: 'sw', left: () => 0, top: (h) => h },
  { id: 'w', left: () => 0, top: (h) => h / 2 },
];

export function ChartMarkOverlay({
  cssW,
  cssH,
  mode,
  sampleRateHz,
  xDomain,
  yDomain,
  fullTime,
  fullFreq,
}: Props) {
  const [tick, setTick] = useState(0);
  const [bodyDrag, setBodyDrag] = useState<BodyDrag | null>(null);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, []);
  void tick;

  if (!(cssW > 0) || !(cssH > 0) || !(sampleRateHz > 0)) return null;
  const { marks, selected, active, hovered: hoveredId } = readMarks();
  const axes = plotAxes(cssW, cssH, mode, xDomain, yDomain);
  // G11: clamp to file fullRange (desktop MarkEdit), not the zoomed view domain.
  const fileTime = fullTime ?? { min: axes.time.min, max: axes.time.max };
  const fileFreq = fullFreq ?? { min: axes.freq.min, max: axes.freq.max };


  const rectFor = (mark: MarkRow) => {
    const startN = Number(mark.start);
    const endN = Number(mark.end);
    if (!Number.isFinite(startN) || !Number.isFinite(endN)) return null;
    const t0 = startN / sampleRateHz;
    const t1 = endN / sampleRateHz;
    const f0 = mark.lowerHz ?? axes.freq.min;
    const f1 = mark.upperHz ?? axes.freq.max;
    const x0 = valueToCss(t0, axes.time.pixelMin, axes.time.pixelMax, axes.time.min, axes.time.max, axes.time.invert);
    const x1 = valueToCss(t1, axes.time.pixelMin, axes.time.pixelMax, axes.time.min, axes.time.max, axes.time.invert);
    const y0 = valueToCss(f0, axes.freq.pixelMin, axes.freq.pixelMax, axes.freq.min, axes.freq.max, axes.freq.invert);
    const y1 = valueToCss(f1, axes.freq.pixelMin, axes.freq.pixelMax, axes.freq.min, axes.freq.max, axes.freq.invert);
    const left = Math.min(x0, x1);
    const top = Math.min(y0, y1);
    return {
      left,
      top,
      width: Math.max(2, Math.abs(x1 - x0)),
      height: Math.max(2, Math.abs(y1 - y0)),
      timeAt: (css: number) =>
        cssToValue(css, axes.time.pixelMin, axes.time.pixelMax, axes.time.min, axes.time.max, axes.time.invert),
      freqAt: (css: number) =>
        cssToValue(css, axes.freq.pixelMin, axes.freq.pixelMax, axes.freq.min, axes.freq.max, axes.freq.invert),
      t0: Math.min(t0, t1),
      t1: Math.max(t0, t1),
      f0: Math.min(f0, f1),
      f1: Math.max(f0, f1),
    };
  };

  const selectMark = (id: string, additive: boolean) => {
    const hook = window.__wssM06;
    if (!hook) return;
    const current = hook.getState().selectedMarkIds ?? [];
    const next = additive
      ? current.includes(id)
        ? current.filter((item) => item !== id)
        : current.concat(id)
      : [id];
    hook.setSelection({
      activeFileId: 'file-1',
      activeMarkId: id,
      selectedMarkIds: next,
    });
    setTick((n) => n + 1);
  };

  const commitRange = (
    mark: MarkRow,
    nextT0: number,
    nextT1: number,
    nextF0: number,
    nextF1: number,
  ) => {
    const start = secondsToSampleIndex(Math.min(nextT0, nextT1), sampleRateHz);
    const endRaw = secondsToSampleIndex(Math.max(nextT0, nextT1), sampleRateHz);
    const end = start && endRaw ? halfOpenEnd(start, endRaw) : null;
    if (!start || !end) return;
    const hook = window.__wssM06;
    const current = hook?.session.annotations.annotations.find((item) => item.id === mark.id);
    if (!hook || !current) return;
    hook.session.replaceMark({
      ...current,
      start,
      end,
      lowerHz: Math.min(nextF0, nextF1),
      upperHz: Math.max(nextF0, nextF1),
    });
    setTick((n) => n + 1);
  };

  const applyHandle = (
    mark: MarkRow,
    box: NonNullable<ReturnType<typeof rectFor>>,
    handle: HandleId,
    clientX: number,
    clientY: number,
    layer: Element,
  ) => {
    const host = layer.getBoundingClientRect();
    const time = box.timeAt(clientX - host.left);
    const freq = box.freqAt(clientY - host.top);
    let nextT0 = box.t0;
    let nextT1 = box.t1;
    let nextF0 = box.f0;
    let nextF1 = box.f1;
    if (handle === 'nw' || handle === 'sw' || handle === 'w') nextT0 = time;
    if (handle === 'ne' || handle === 'se' || handle === 'e') nextT1 = time;
    if (handle === 'nw' || handle === 'ne' || handle === 'n') nextF1 = freq;
    if (handle === 'sw' || handle === 'se' || handle === 's') nextF0 = freq;
    const clamped = clampMarkRangeToFull({
      t0: nextT0,
      t1: nextT1,
      f0: nextF0,
      f1: nextF1,
      tMin: fileTime.min,
      tMax: fileTime.max,
      fMin: fileFreq.min,
      fMax: fileFreq.max,
    });
    commitRange(mark, clamped.t0, clamped.t1, clamped.f0, clamped.f1);
  };

  const applyBodyMove = (
    mark: MarkRow,
    drag: BodyDrag,
    clientX: number,
    clientY: number,
    layer: Element,
  ) => {
    const host = layer.getBoundingClientRect();
    const tStart = cssToValue(
      drag.startX - host.left,
      axes.time.pixelMin,
      axes.time.pixelMax,
      axes.time.min,
      axes.time.max,
      axes.time.invert,
    );
    const tNow = cssToValue(
      clientX - host.left,
      axes.time.pixelMin,
      axes.time.pixelMax,
      axes.time.min,
      axes.time.max,
      axes.time.invert,
    );
    const fStart = cssToValue(
      drag.startY - host.top,
      axes.freq.pixelMin,
      axes.freq.pixelMax,
      axes.freq.min,
      axes.freq.max,
      axes.freq.invert,
    );
    const fNow = cssToValue(
      clientY - host.top,
      axes.freq.pixelMin,
      axes.freq.pixelMax,
      axes.freq.min,
      axes.freq.max,
      axes.freq.invert,
    );
    const next = applyMarkBodyDelta({
      t0: drag.t0,
      t1: drag.t1,
      f0: drag.f0,
      f1: drag.f1,
      dtSec: tNow - tStart,
      dfHz: fNow - fStart,
      // File-fullRange clamp (desktop MarkEdit Move — not view-only).
      tMin: fileTime.min,
      tMax: fileTime.max,
      fMin: fileFreq.min,
      fMax: fileFreq.max,
    });
    commitRange(mark, next.t0, next.t1, next.f0, next.f1);
  };

  return (
    <div
      className="chart-mark-layer"
      data-testid="chart-mark-layer"
      data-mark-count={marks.length}
      data-selected-count={selected.length}
      data-handle-count="8"
      data-g13-handles="true"
      data-g11-mark-edge="true"
      data-g11-body-drag="true"
      data-g11-bounds-clamp="true"
      data-g11-file-fullrange-clamp="true"
      data-g11-unselected-pointer="true"
      data-g11-unselected-polish="true" data-g11-source-kind="true" data-g11-hover-sync="true"
      data-body-dragging={bodyDrag ? 'true' : 'false'}
      data-body-drag-mark={bodyDrag?.id ?? ''}
    >
      {marks.map((mark) => {
        const box = rectFor(mark);
        if (!box) return null;
        const isSelected = selected.includes(mark.id);
        const isCurrent = active === mark.id;
        const draggingThis = bodyDrag?.id === mark.id;
        const kind = mark.sourceKind ?? "Algorithm";
        const stroke = sourceStroke(kind);
        // Desktop updateHover @ 17471a6: selected -> SizeAll/edge; else hit -> PointingHand.
        const bodyCursor = resolveMarkBodyHoverCursor({
          selected: isSelected,
          draggingMove: draggingThis,
        });
        return (
          <div
            key={mark.id}
            className={`chart-mark-rect${isCurrent ? ' chart-mark-current' : ''}${isSelected ? ' chart-mark-selected' : ''}`}
            data-testid={`chart-mark-${mark.id}`}
            data-start={String(mark.start)}
            data-end={String(mark.end)}
            data-selected={isSelected ? 'true' : 'false'}
            data-current={isCurrent ? 'true' : 'false'}
            data-unselected={!isSelected ? 'true' : 'false'}
            data-hovered={hoveredId === mark.id ? 'true' : 'false'}
            data-body-dragging={draggingThis ? 'true' : 'false'}
            data-body-drag-cursor={bodyCursor ?? ''}
            data-source-kind={kind}
            data-g11-source-stroke="true"
            data-annotation-paint="desktop-multi"
            title={
              !isSelected
                ? `${mark.name || mark.id}：单击选中 · 拖动空白区域放大`
                : `${mark.name || mark.id}：拖动移动 · 边线和顶点调整`
            }
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
              cursor: bodyCursor,
              // Desktop PlotWidget sourceColor stroke/fill (alpha via CSS).
              ["--mark-source" as string]: stroke,
              borderColor: stroke,
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              const additive = event.ctrlKey || event.metaKey || event.shiftKey;
              const alreadySelected = isSelected;
              selectMark(mark.id, additive);
              // Desktop: MarkEdit Move only when already-selected hit and not additive.
              if (additive || !alreadySelected) return;
              const layer = event.currentTarget.closest('[data-testid="chart-mark-layer"]');
              if (!layer) return;
              const origin = rectFor(mark);
              if (!origin) return;
              const drag: BodyDrag = {
                id: mark.id,
                startX: event.clientX,
                startY: event.clientY,
                t0: origin.t0,
                t1: origin.t1,
                f0: origin.f0,
                f1: origin.f1,
              };
              setBodyDrag(drag);
              event.currentTarget.setPointerCapture(event.pointerId);
              const target = event.currentTarget;
              const onMove = (ev: PointerEvent) => {
                applyBodyMove(mark, drag, ev.clientX, ev.clientY, layer);
              };
              const onUp = (ev: PointerEvent) => {
                applyBodyMove(mark, drag, ev.clientX, ev.clientY, layer);
                setBodyDrag(null);
                window.removeEventListener('pointermove', onMove);
                window.removeEventListener('pointerup', onUp);
                try {
                  target.releasePointerCapture(ev.pointerId);
                } catch {
                  /* already released */
                }
              };
              window.addEventListener('pointermove', onMove);
              window.addEventListener('pointerup', onUp);
            }}
            onPointerEnter={() => {
              setHoveredMark(mark.id);
              setTick((n) => n + 1);
            }}
            onPointerLeave={() => {
              const hook = window.__wssM06;
              if (hook?.getState()?.hoveredMarkId === mark.id) {
                setHoveredMark(null);
                setTick((n) => n + 1);
              }
            }}
          >
            {!isSelected && hoveredId === mark.id ? (
              <span
                className="chart-mark-hover-tip"
                data-testid="chart-mark-hover-tip"
                data-mark-id={mark.id}
              >
                {`${mark.name || mark.id} · 点击选中`}
              </span>
            ) : null}
            {isCurrent
              ? HANDLES.map((c) => {
                  const cursor = resolveMarkEdgeCursor({ edge: c.id });
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`chart-mark-handle chart-mark-handle-${c.id}`}
                      data-testid={
                        c.id === 'se' ? 'chart-mark-handle' : `chart-mark-handle-${c.id}`
                      }
                      data-corner={c.id}
                      data-edge={c.id}
                      data-mark-edge-cursor={cursor}
                      aria-label={`resize mark ${c.id}`}
                      style={{
                        left: c.left(box.width),
                        top: c.top(box.height),
                        cursor,
                      }}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        const handle = event.currentTarget;
                        const layer = handle.closest('[data-testid="chart-mark-layer"]');
                        if (!layer) return;
                        handle.setPointerCapture(event.pointerId);
                        const onMove = (ev: PointerEvent) => {
                          applyHandle(mark, box, c.id, ev.clientX, ev.clientY, layer);
                        };
                        const onUp = (ev: PointerEvent) => {
                          applyHandle(mark, box, c.id, ev.clientX, ev.clientY, layer);
                          window.removeEventListener('pointermove', onMove);
                          window.removeEventListener('pointerup', onUp);
                        };
                        window.addEventListener('pointermove', onMove);
                        window.addEventListener('pointerup', onUp);
                      }}
                    />
                  );
                })
              : null}
          </div>
        );
      })}
    </div>
  );
}
