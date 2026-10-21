/**
 * Minimal I/Q scatter canvas for G06 modulation constellation (Bot-D).
 * Display only — points come from constellationFromIq on real DDC IQ.
 */
import { useEffect, useRef } from 'react';
import {
  constellationBounds,
  type ConstellationPoint,
} from '../dsp/constellationFromIq';

export function ConstellationCanvas({
  points,
  testId = 'nb-chart-constellation',
}: {
  points: ConstellationPoint[];
  testId?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const w = Math.max(1, wrap.clientWidth);
      const h = Math.max(1, wrap.clientHeight);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, w, h);

      const pad = 28;
      const bounds = constellationBounds(points);
      const iSpan = Math.max(1e-9, bounds.iMax - bounds.iMin);
      const qSpan = Math.max(1e-9, bounds.qMax - bounds.qMin);

      // Axes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      const zx =
        pad + ((0 - bounds.iMin) / iSpan) * (w - pad * 2);
      const zy =
        h -
        pad -
        ((0 - bounds.qMin) / qSpan) * (h - pad * 2);
      ctx.beginPath();
      ctx.moveTo(pad, zy);
      ctx.lineTo(w - pad, zy);
      ctx.moveTo(zx, pad);
      ctx.lineTo(zx, h - pad);
      ctx.stroke();

      ctx.fillStyle = '#7dd3fc';
      const r = 1.5;
      for (const p of points) {
        const x = pad + ((p.i - bounds.iMin) / iSpan) * (w - pad * 2);
        const y =
          h - pad - ((p.q - bounds.qMin) / qSpan) * (h - pad * 2);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      ctx.fillText('I', w - pad + 4, zy - 4);
      ctx.fillText('Q', zx + 4, pad - 4);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [points]);

  return (
    <div
      ref={wrapRef}
      className="nb-constellation-wrap"
      data-testid={testId}
      data-nb-constellation-points={points.length}
      style={{ width: '100%', height: '100%', minHeight: 120 }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
