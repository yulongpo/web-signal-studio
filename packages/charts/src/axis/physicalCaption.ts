/**
 * Charts-side physical axis caption helpers (G02).
 * Mirrors desktop plot_widget displayUnit / axisScale label shape @ 17471a6.
 * Not Bot-B ChartControlStrip / f9f05bb chrome — those stay on the strip host.
 */

export type PhysicalKind = "frequency" | "time" | "other";

export type ScaledUnit = { name: string; scale: number };

export type FormattedPhysicalRange = {
  kind: PhysicalKind;
  /** Desktop-style axis name (zh frequency/time), or the provided label. */
  title: string;
  /** Auto-scaled unit name (MHz, ms, ...). */
  unitName: string;
  /** Values already multiplied by scale. */
  minScaled: number;
  maxScaled: number;
  /** Single-line caption fragment. */
  text: string;
};

const TITLE_FREQ = "频率";
const TITLE_TIME = "时间";
const TITLE_OTHER = "轴";
const EN_DASH = "\u2013";

function inferKind(unit?: string, label?: string): PhysicalKind {
  const u = (unit ?? "").toLowerCase();
  const l = (label ?? "").toLowerCase();
  if (
    u === "hz" ||
    u === "khz" ||
    u === "mhz" ||
    l.includes("freq") ||
    l.includes(TITLE_FREQ)
  ) {
    return "frequency";
  }
  if (
    u === "s" ||
    u === "ms" ||
    u === "us" ||
    u === "\u00b5s" ||
    l.includes("time") ||
    l.includes(TITLE_TIME)
  ) {
    return "time";
  }
  return "other";
}

/** Desktop displayUnit(frequency, span). Input span is in base Hz or seconds. */
export function displayUnit(kind: PhysicalKind, span: number): ScaledUnit {
  const abs = Math.abs(span);
  if (kind === "frequency") {
    if (abs >= 1e6) return { name: "MHz", scale: 1e-6 };
    if (abs >= 1e3) return { name: "kHz", scale: 1e-3 };
    return { name: "Hz", scale: 1 };
  }
  if (kind === "time") {
    if (abs >= 1) return { name: "s", scale: 1 };
    if (abs >= 1e-3) return { name: "ms", scale: 1e3 };
    return { name: "us", scale: 1e6 };
  }
  return { name: "", scale: 1 };
}

function baseSpan(min: number, max: number, unit?: string): number {
  const span = Math.abs(max - min);
  const u = (unit ?? "").toLowerCase();
  if (u === "mhz") return span * 1e6;
  if (u === "khz") return span * 1e3;
  if (u === "ms") return span * 1e-3;
  if (u === "us" || u === "\u00b5s") return span * 1e-6;
  return span;
}

function toBase(value: number, unit?: string): number {
  const u = (unit ?? "").toLowerCase();
  if (u === "mhz") return value * 1e6;
  if (u === "khz") return value * 1e3;
  if (u === "ms") return value * 1e-3;
  if (u === "us" || u === "\u00b5s") return value * 1e-6;
  return value;
}

function decimalsFor(stepScaled: number): number {
  if (!(stepScaled > 0) || !Number.isFinite(stepScaled)) return 2;
  if (stepScaled >= 100) return 0;
  if (stepScaled >= 10) return 1;
  if (stepScaled >= 1) return 2;
  if (stepScaled >= 0.1) return 3;
  return 4;
}

function formatScaled(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return String(value);
  const fixed = value.toFixed(decimals);
  if (decimals <= 0) return fixed;
  return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function formatPhysicalRange(
  min: number,
  max: number,
  opts: { unit?: string; label?: string } = {},
): FormattedPhysicalRange {
  const kind = inferKind(opts.unit, opts.label);
  const lo = Math.min(toBase(min, opts.unit), toBase(max, opts.unit));
  const hi = Math.max(toBase(min, opts.unit), toBase(max, opts.unit));
  const span = baseSpan(min, max, opts.unit);
  const scaled = displayUnit(
    kind,
    span > 0 ? span : Math.max(Math.abs(lo), Math.abs(hi), 1),
  );
  const minScaled = lo * scaled.scale;
  const maxScaled = hi * scaled.scale;
  const decimals = decimalsFor(Math.abs(maxScaled - minScaled) / 5);
  const title =
    kind === "frequency"
      ? TITLE_FREQ
      : kind === "time"
        ? TITLE_TIME
        : (opts.label ?? opts.unit ?? TITLE_OTHER);
  const unitName = scaled.name || opts.unit || "";
  const a = formatScaled(minScaled, decimals);
  const b = formatScaled(maxScaled, decimals);
  const head = unitName ? `${title} (${unitName})` : title;
  const text = `${head}: ${a}${EN_DASH}${b}`;
  return { kind, title, unitName, minScaled, maxScaled, text };
}

export function formatPhysicalCaptionPair(
  x: { min: number; max: number; unit?: string; label?: string },
  y: { min: number; max: number; unit?: string; label?: string },
): { x: FormattedPhysicalRange; y: FormattedPhysicalRange; text: string } {
  const xf = formatPhysicalRange(x.min, x.max, x);
  const yf = formatPhysicalRange(y.min, y.max, y);
  return { x: xf, y: yf, text: `${xf.text} | ${yf.text}` };
}
