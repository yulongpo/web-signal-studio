/**
 * Draws M-06 marks on the main chart using the live physical view.
 * G13: Ctrl/Shift multi-select + four corner handles with live resize.
 * Continuous create stays with the marker tool on MainChartHost (data-continuous-create).
 */
import { useEffect, useState } from 'react';
import type { AnnotationJson } from '@wss/contracts';
import {
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
};

type MarkRow = AnnotationJson & { id: string };
type Corner = 'nw' | 'ne' | 'sw' | 'se';

function readMarks(): { marks: MarkRow[]; selected: string[]; active: string | null } {
  const hook = window.__wssM06;
  if (!hook) return { marks: [], selected: [], active: null };
  const state = hook.getState();
  const marks = (hook.session.annotations.annotations ?? []).filter(
    (mark) => !mark.deleted,
  ) as MarkRow[];
  return {
    marks,
    selected: state.selectedMarkIds ?? [],
    active: state.activeMarkId ?? null,
  };
}

const CORNERS: { id: Corner; left: (w: number) => number; top: (h: number) => number }[] = [
  { id: 'nw', left: () => 0, top: () => 0 },
  { id: 'ne', left: (w) => w, top: () => 0 },
  { id: 'sw', left: () => 0, top: (h) => h },
  { id: 'se', left: (w) => w, top: (h) => h },
];

export function ChartMarkOverlay({
  cssW,
  cssH,
  mode,
  sampleRateHz,
  xDomain,
  yDomain,
}: Props) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, []);
  void tick;

  if (!(cssW > 0) || !(cssH > 0) || !(sampleRateHz > 0)) return null;
  const { marks, selected, active } = readMarks();
  const axes = plotAxes(cssW, cssH, mode, xDomain, yDomain);

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

  const applyCorner = (
    mark: MarkRow,
    box: NonNullable<ReturnType<typeof rectFor>>,
    corner: Corner,
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
    if (corner === 'nw' || corner === 'sw') nextT0 = time;
    if (corner === 'ne' || corner === 'se') nextT1 = time;
    if (corner === 'nw' || corner === 'ne') nextF1 = freq;
    if (corner === 'sw' || corner === 'se') nextF0 = freq;
    // STFT: higher freq is visually "up" (invert); nw/ne are top = higher freq when invert.
    // Use pointer physical mapping directly via freqAt; swap if needed.
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

  return (
    <div
      className="chart-mark-layer"
      data-testid="chart-mark-layer"
      data-mark-count={marks.length}
      data-selected-count={selected.length}
      data-handle-count="4"
      data-g13-handles="true"
    >
      {marks.map((mark) => {
        const box = rectFor(mark);
        if (!box) return null;
        const isActive = active === mark.id || selected.includes(mark.id);
        return (
          <div
            key={mark.id}
            className="chart-mark-rect"
            data-testid={`chart-mark-${mark.id}`}
            data-start={String(mark.start)}
            data-end={String(mark.end)}
            data-selected={isActive ? 'true' : 'false'}
            style={{ left: box.left, top: box.top, width: box.width, height: box.height }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              selectMark(mark.id, event.ctrlKey || event.metaKey || event.shiftKey);
            }}
          >
            {active === mark.id
              ? CORNERS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="chart-mark-handle"
                    data-testid={c.id === 'se' ? 'chart-mark-handle' : `chart-mark-handle-${c.id}`}
                    data-corner={c.id}
                    aria-label={`resize mark ${c.id}`}
                    style={{ left: c.left(box.width), top: c.top(box.height) }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      const handle = event.currentTarget;
                      const layer = handle.closest('[data-testid="chart-mark-layer"]');
                      if (!layer) return;
                      handle.setPointerCapture(event.pointerId);
                      const onMove = (ev: PointerEvent) => {
                        applyCorner(mark, box, c.id, ev.clientX, ev.clientY, layer);
                      };
                      const onUp = (ev: PointerEvent) => {
                        applyCorner(mark, box, c.id, ev.clientX, ev.clientY, layer);
                        window.removeEventListener('pointermove', onMove);
                        window.removeEventListener('pointerup', onUp);
                      };
                      window.addEventListener('pointermove', onMove);
                      window.addEventListener('pointerup', onUp);
                    }}
                  />
                ))
              : null}
          </div>
        );
      })}
    </div>
  );
}
