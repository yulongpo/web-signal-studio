/** Physical domain <-> pixel mapping for chart axes (independent of WebGL heatmap). */

export type AxisOrientation = "horizontal" | "vertical";

export interface AxisDomain {
  /** Inclusive lower bound in physical units (Hz, s, sample index as number for display only). */
  min: number;
  /** Inclusive upper bound. */
  max: number;
  /** Optional unit label for overlays. */
  unit?: string;
  label?: string;
}

export interface AxisMapping {
  orientation: AxisOrientation;
  domain: AxisDomain;
  /** Pixel rect inside the plot area (CSS pixels). */
  pixelMin: number;
  pixelMax: number;
  /** When true, vertical axis grows upward in physical space (STFT Y=freq). */
  invertPixel?: boolean;
}

export class PhysicalAxis {
  constructor(public mapping: AxisMapping) {}

  get span(): number {
    return this.mapping.domain.max - this.mapping.domain.min;
  }

  /** Physical value -> CSS pixel along the axis line. */
  toPixel(value: number): number {
    const { domain, pixelMin, pixelMax, invertPixel } = this.mapping;
    const span = domain.max - domain.min;
    if (span === 0) return (pixelMin + pixelMax) / 2;
    const t = (value - domain.min) / span;
    if (invertPixel) return pixelMax - t * (pixelMax - pixelMin);
    return pixelMin + t * (pixelMax - pixelMin);
  }

  /** CSS pixel -> physical value. */
  toValue(pixel: number): number {
    const { domain, pixelMin, pixelMax, invertPixel } = this.mapping;
    const pSpan = pixelMax - pixelMin;
    if (pSpan === 0) return domain.min;
    const t = invertPixel
      ? (pixelMax - pixel) / pSpan
      : (pixel - pixelMin) / pSpan;
    return domain.min + t * (domain.max - domain.min);
  }

  /** Nice tick values for overlay drawing. */
  ticks(count = 5): number[] {
    const { min, max } = this.mapping.domain;
    if (!Number.isFinite(min) || !Number.isFinite(max) || count < 2) return [min];
    const span = max - min;
    if (span === 0) return [min];
    const raw = span / (count - 1);
    const pow = 10 ** Math.floor(Math.log10(Math.abs(raw)));
    const err = raw / pow;
    const step =
      err >= 5 ? 5 * pow : err >= 2 ? 2 * pow : pow;
    const start = Math.ceil(min / step) * step;
    const out: number[] = [];
    for (let v = start; v <= max + step * 1e-9; v += step) {
      out.push(Number(v.toPrecision(12)));
      if (out.length > 64) break;
    }
    if (out.length === 0) out.push(min, max);
    return out;
  }

  withDomain(domain: AxisDomain): PhysicalAxis {
    return new PhysicalAxis({ ...this.mapping, domain });
  }

  withPixelRange(pixelMin: number, pixelMax: number): PhysicalAxis {
    return new PhysicalAxis({ ...this.mapping, pixelMin, pixelMax });
  }
}
