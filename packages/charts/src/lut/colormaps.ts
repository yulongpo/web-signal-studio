/** Independent RGBA8 LUT builders. Colormap/level changes must not touch scalar data. */

export type ColormapName = "viridis" | "magma" | "inferno" | "gray" | "jet";

type Rgb = readonly [number, number, number];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function sampleStops(stops: readonly Rgb[], t: number): Rgb {
  const x = Math.min(1, Math.max(0, t));
  const n = stops.length - 1;
  const f = x * n;
  const i = Math.min(n - 1, Math.floor(f));
  const u = f - i;
  const a = stops[i]!;
  const b = stops[i + 1]!;
  return [
    Math.round(lerp(a[0], b[0], u)),
    Math.round(lerp(a[1], b[1], u)),
    Math.round(lerp(a[2], b[2], u)),
  ];
}

/** Approximate scientific colormaps (control points). */
const STOPS: Record<ColormapName, readonly Rgb[]> = {
  gray: [
    [0, 0, 0],
    [255, 255, 255],
  ],
  viridis: [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ],
  magma: [
    [0, 0, 4],
    [80, 18, 123],
    [182, 54, 121],
    [251, 136, 97],
    [252, 253, 191],
  ],
  inferno: [
    [0, 0, 4],
    [87, 16, 110],
    [188, 55, 84],
    [249, 142, 9],
    [252, 255, 164],
  ],
  jet: [
    [0, 0, 143],
    [0, 0, 255],
    [0, 255, 255],
    [255, 255, 0],
    [255, 0, 0],
    [128, 0, 0],
  ],
};

export const COLORMAPS: readonly ColormapName[] = Object.keys(STOPS) as ColormapName[];

/**
 * Build a 1D RGBA8 LUT texture payload.
 * Length defaults to 256; alpha is always 255.
 */
export function buildLutRgba8(
  name: ColormapName,
  length = 256,
): Uint8Array {
  const stops = STOPS[name];
  if (!stops) throw new Error(`unknown colormap: ${name}`);
  const out = new Uint8Array(length * 4);
  for (let i = 0; i < length; i++) {
    const t = length === 1 ? 0 : i / (length - 1);
    const [r, g, b] = sampleStops(stops, t);
    const o = i * 4;
    out[o] = r;
    out[o + 1] = g;
    out[o + 2] = b;
    out[o + 3] = 255;
  }
  return out;
}

/**
 * Pure helper: map scalar -> LUT index without mutating scalar buffer.
 * Used by unit tests to prove LUT independence.
 */
export function mapScalarThroughLut(
  scalar: Float32Array,
  lut: Uint8Array,
  levels: { min: number; max: number },
): Uint8Array {
  const n = lut.length / 4;
  const span = Math.max(levels.max - levels.min, 1e-12);
  const rgba = new Uint8Array(scalar.length * 4);
  for (let i = 0; i < scalar.length; i++) {
    const t = Math.min(1, Math.max(0, (scalar[i]! - levels.min) / span));
    const idx = Math.min(n - 1, Math.floor(t * (n - 1)));
    const o = idx * 4;
    const d = i * 4;
    rgba[d] = lut[o]!;
    rgba[d + 1] = lut[o + 1]!;
    rgba[d + 2] = lut[o + 2]!;
    rgba[d + 3] = lut[o + 3]!;
  }
  return rgba;
}
