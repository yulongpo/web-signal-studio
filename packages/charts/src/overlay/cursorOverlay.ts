export interface CursorOverlayState {
  /** CSS pixel within the overlay canvas; null hides cursor. */
  xCss: number | null;
  yCss: number | null;
  /** Optional readout strings near the crosshair. */
  labelX?: string;
  labelY?: string;
  visible?: boolean;
}

export interface CursorOverlayDrawInput {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  state: CursorOverlayState;
  strokeStyle?: string;
  labelStyle?: string;
}

/**
 * Independent cursor / crosshair overlay layer (2D canvas).
 * Kept separate from WebGL heatmap so Bot-B can compose freely.
 */
export class CursorOverlay {
  draw(input: CursorOverlayDrawInput): void {
    const {
      ctx,
      width,
      height,
      margin,
      state,
      strokeStyle = "rgba(255,220,120,0.9)",
      labelStyle = "rgba(255,240,200,0.95)",
    } = input;

    ctx.clearRect(0, 0, width, height);
    if (state.visible === false) return;
    if (state.xCss == null || state.yCss == null) return;

    const plotL = margin.left;
    const plotT = margin.top;
    const plotR = width - margin.right;
    const plotB = height - margin.bottom;
    const x = Math.min(plotR, Math.max(plotL, state.xCss));
    const y = Math.min(plotB, Math.max(plotT, state.yCss));

    ctx.save();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(x, plotT);
    ctx.lineTo(x, plotB);
    ctx.moveTo(plotL, y);
    ctx.lineTo(plotR, y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = labelStyle;
    ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    const parts = [state.labelX, state.labelY].filter(Boolean);
    if (parts.length) {
      const text = parts.join("  ");
      const tx = Math.min(plotR - 4, x + 8);
      const ty = Math.max(plotT + 14, y - 6);
      const metrics = ctx.measureText(text);
      ctx.fillStyle = "rgba(20,24,32,0.75)";
      ctx.fillRect(tx - 2, ty - 12, metrics.width + 4, 14);
      ctx.fillStyle = labelStyle;
      ctx.fillText(text, tx, ty);
    }
    ctx.restore();
  }
}
