/**
 * Draws M-06 marks on the main chart using the live physical view.
 * Selection and one corner handle go through the existing __wssM06 session.
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
      anchorTime: Math.min(t0, t1),
      anchorFreq: Math.min(f0, f1),
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

  return (
    <div
      className="chart-mark-layer"
      data-testid="chart-mark-layer"
      data-mark-count={marks.length}
      data-selected-count={selected.length}
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
            {active === mark.id ? (
              <button
                type="button"
                className="chart-mark-handle"
                data-testid="chart-mark-handle"
                aria-label="调整标记"
                style={{ left: box.width, top: 0 }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  const handle = event.currentTarget;
                  const layer = handle.closest('[data-testid="chart-mark-layer"]');
                  const commit = (ev: PointerEvent) => {
                    if (!layer) return;
                    const host = layer.getBoundingClientRect();
                    const time = box.timeAt(ev.clientX - host.left);
                    const freq = box.freqAt(ev.clientY - host.top);
                    const start = secondsToSampleIndex(Math.min(box.anchorTime, time), sampleRateHz);
                    const endRaw = secondsToSampleIndex(Math.max(box.anchorTime, time), sampleRateHz);
                    const end = start && endRaw ? halfOpenEnd(start, endRaw) : null;
                    if (!start || !end) return;
                    const hook = window.__wssM06;
                    const current = hook?.session.annotations.annotations.find((item) => item.id === mark.id);
                    if (!hook || !current) return;
                    hook.session.replaceMark({
                      ...current,
                      start,
                      end,
                      lowerHz: Math.min(box.anchorFreq, freq),
                      upperHz: Math.max(box.anchorFreq, freq),
                    });
                    setTick((n) => n + 1);
                  };
                  const up = (ev: PointerEvent) => {
                    commit(ev);
                    window.removeEventListener('pointerup', up);
                  };
                  window.addEventListener('pointerup', up);
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
