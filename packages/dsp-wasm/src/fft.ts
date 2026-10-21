/**
 * In-place radix-2 Cooley–Tukey FFT over interleaved complex Float64
 * [re0, im0, re1, im1, ...]. Length of complex samples must be power of two.
 * WASM port comes later; this is the portable reference kernel.
 */

export function isPowerOfTwo(n: number): boolean {
  return Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;
}

export function fftRadix2(interleaved: Float64Array, inverse = false): void {
  const nComplex = interleaved.length / 2;
  if (!isPowerOfTwo(nComplex)) {
    throw new RangeError(`FFT length must be power of two, got ${nComplex}`);
  }
  if (interleaved.length !== nComplex * 2) {
    throw new RangeError('interleaved buffer length must be 2 * n');
  }

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < nComplex; i++) {
    let bit = nComplex >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const ir = i * 2;
      const jr = j * 2;
      const tr = interleaved[ir]!;
      const ti = interleaved[ir + 1]!;
      interleaved[ir] = interleaved[jr]!;
      interleaved[ir + 1] = interleaved[jr + 1]!;
      interleaved[jr] = tr;
      interleaved[jr + 1] = ti;
    }
  }

  const sign = inverse ? 1 : -1;
  for (let len = 2; len <= nComplex; len <<= 1) {
    const ang = (sign * (2 * Math.PI)) / len;
    const wlenRe = Math.cos(ang);
    const wlenIm = Math.sin(ang);
    for (let i = 0; i < nComplex; i += len) {
      let wRe = 1;
      let wIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const uIndex = (i + j) * 2;
        const vIndex = (i + j + len / 2) * 2;
        const uRe = interleaved[uIndex]!;
        const uIm = interleaved[uIndex + 1]!;
        const vRe0 = interleaved[vIndex]!;
        const vIm0 = interleaved[vIndex + 1]!;
        const vRe = vRe0 * wRe - vIm0 * wIm;
        const vIm = vRe0 * wIm + vIm0 * wRe;
        interleaved[uIndex] = uRe + vRe;
        interleaved[uIndex + 1] = uIm + vIm;
        interleaved[vIndex] = uRe - vRe;
        interleaved[vIndex + 1] = uIm - vIm;
        const nextWRe = wRe * wlenRe - wIm * wlenIm;
        wIm = wRe * wlenIm + wIm * wlenRe;
        wRe = nextWRe;
      }
    }
  }

  if (inverse) {
    const scale = 1 / nComplex;
    for (let i = 0; i < interleaved.length; i++) interleaved[i]! *= scale;
  }
}

/** Complex magnitude-squared spectrum (length nComplex). */
export function powerSpectrum(interleaved: Float64Array): Float64Array {
  const n = interleaved.length / 2;
  const out = new Float64Array(n);
  for (let k = 0; k < n; k++) {
    const re = interleaved[k * 2]!;
    const im = interleaved[k * 2 + 1]!;
    out[k] = re * re + im * im;
  }
  return out;
}

/** Baseband bin centre frequency for DFT bin k (unshifted, bin 0 = DC). */
export function binFrequencyHz(bin: number, fftSize: number, sampleRateHz: number): number {
  if (bin < 0 || bin >= fftSize) throw new RangeError('bin out of range');
  if (bin <= fftSize / 2) return (bin * sampleRateHz) / fftSize;
  return ((bin - fftSize) * sampleRateHz) / fftSize;
}

export function frequencyToBin(frequencyHz: number, sampleRateHz: number, fftSize: number): number {
  const raw = Math.round((frequencyHz / sampleRateHz) * fftSize);
  return ((raw % fftSize) + fftSize) % fftSize;
}

/** Find top-K peak bins by power (excluding duplicates within excludeRadius). */
export function findPeakBins(power: Float64Array, k: number, excludeRadius = 2): number[] {
  const peaks: number[] = [];
  const used = new Uint8Array(power.length);
  for (let n = 0; n < k; n++) {
    let best = -1;
    let bestVal = -Infinity;
    for (let i = 0; i < power.length; i++) {
      if (used[i]) continue;
      const v = power[i]!;
      if (v > bestVal) {
        bestVal = v;
        best = i;
      }
    }
    if (best < 0) break;
    peaks.push(best);
    const lo = Math.max(0, best - excludeRadius);
    const hi = Math.min(power.length - 1, best + excludeRadius);
    for (let i = lo; i <= hi; i++) used[i] = 1;
  }
  return peaks;
}
