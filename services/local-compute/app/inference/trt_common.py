"""Shared TensorRT execute helpers + SigMF/IQ loaders. Never invents candidates."""

from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any

import numpy as np

log = logging.getLogger("local-compute.inference.trt_common")


def load_sigmf_iq(path: Path) -> tuple[np.ndarray, float, float]:
    """Load complex64 little-endian IQ from a .sigmf-data / .sigmf-meta / stem.

    Returns (iq complex64, sample_rate_hz, center_hz).
    """
    path = Path(path)
    if path.suffix.lower() == ".sigmf-meta":
        meta_path = path
        data_path = path.with_suffix(".sigmf-data")
        if not data_path.is_file():
            # some packs use stem.sigmf-data alongside stem.sigmf-meta
            data_path = path.parent / (path.stem.replace(".sigmf", "") + ".sigmf-data")
            if not data_path.is_file():
                data_path = path.parent / f"{path.name[:-11]}.sigmf-data"
    elif path.suffix.lower() == ".sigmf-data":
        data_path = path
        meta_path = path.with_suffix(".sigmf-meta")
        if not meta_path.is_file():
            meta_path = path.parent / (path.stem + ".sigmf-meta")
    else:
        # bare stem or .json sibling
        meta_path = path if path.suffix.lower() == ".sigmf-meta" else path.parent / f"{path.stem}.sigmf-meta"
        data_path = path.parent / f"{path.stem}.sigmf-data"
        if not data_path.is_file() and path.is_file() and path.suffix.lower() in {".iq", ".c64", ".bin"}:
            data_path = path
            meta_path = path.with_suffix(".sigmf-meta")

    if not data_path.is_file():
        raise FileNotFoundError(f"SigMF data missing for {path} (tried {data_path})")

    sample_rate = 0.0
    center_hz = 0.0
    datatype = "cf32_le"
    if meta_path.is_file():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        g = meta.get("global") or {}
        sample_rate = float(g.get("core:sample_rate") or 0.0)
        datatype = str(g.get("core:datatype") or datatype)
        caps = meta.get("captures") or []
        if caps:
            center_hz = float((caps[0] or {}).get("core:frequency") or 0.0)

    raw = np.fromfile(str(data_path), dtype=np.complex64)
    if datatype not in {"cf32_le", "cf32"}:
        # still try complex64; refuse silent reinterpret of other types as success
        if datatype.startswith("ci16"):
            inter = np.fromfile(str(data_path), dtype=np.int16).astype(np.float32)
            if inter.size % 2:
                raise ValueError(f"odd ci16 sample count in {data_path}")
            raw = inter.reshape(-1, 2)
            raw = raw[:, 0] + 1j * raw[:, 1]
        else:
            raise ValueError(f"unsupported SigMF datatype {datatype} at {meta_path}")
    return raw.astype(np.complex64, copy=False), sample_rate, center_hz


def load_iq_any(path: Path) -> tuple[np.ndarray, float, float]:
    path = Path(path)
    suf = path.suffix.lower()
    if suf in {".sigmf-meta", ".sigmf-data"} or (path.parent / f"{path.stem}.sigmf-data").is_file():
        return load_sigmf_iq(path)
    if suf == ".wav":
        import wave

        with wave.open(str(path), "rb") as wf:
            nch = wf.getnchannels()
            sw = wf.getsampwidth()
            rate = float(wf.getframerate())
            nframes = wf.getnframes()
            frames = wf.readframes(nframes)
        if sw != 2:
            raise ValueError(f"wav sample width {sw} not supported (want 16-bit)")
        samples = np.frombuffer(frames, dtype=np.int16).astype(np.float32)
        if nch >= 2:
            samples = samples.reshape(-1, nch)
            iq = samples[:, 0] + 1j * samples[:, 1]
        else:
            iq = samples.astype(np.complex64)
        return iq.astype(np.complex64), rate, 0.0
    raise ValueError(f"unsupported IQ source {path} (want SigMF under sigmf_data_demo or stereo wav)")


def psd_from_iq(iq: np.ndarray, n_bins: int = 32768) -> np.ndarray:
    """Simple |FFT| PSD, length n_bins (center crop/pad). Real compute, not a stub score."""
    x = np.asarray(iq, dtype=np.complex64).reshape(-1)
    if x.size == 0:
        raise ValueError("empty IQ")
    # use a power-of-two FFT window near n_bins
    nfft = int(2 ** int(np.ceil(np.log2(max(n_bins, 2)))))
    if x.size >= nfft:
        start = (x.size - nfft) // 2
        chunk = x[start : start + nfft]
    else:
        chunk = np.zeros(nfft, dtype=np.complex64)
        chunk[: x.size] = x
    spec = np.fft.fftshift(np.fft.fft(chunk, n=nfft))
    psd = np.abs(spec).astype(np.float32)
    # normalize
    psd = psd / (float(psd.max()) + 1e-12)
    if psd.size > n_bins:
        start = (psd.size - n_bins) // 2
        psd = psd[start : start + n_bins]
    elif psd.size < n_bins:
        out = np.zeros(n_bins, dtype=np.float32)
        start = (n_bins - psd.size) // 2
        out[start : start + psd.size] = psd
        psd = out
    return psd


def stft_spectrum(iq: np.ndarray, nfft: int = 2048, hop: int = 1024, max_frames: int = 10) -> np.ndarray:
    """Magnitude STFT -> (1,1,T,F) float32 for FFSCN spectrum input."""
    x = np.asarray(iq, dtype=np.complex64).reshape(-1)
    if x.size < nfft:
        pad = np.zeros(nfft, dtype=np.complex64)
        pad[: x.size] = x
        x = pad
    window = np.hanning(nfft).astype(np.float32)
    frames = []
    for start in range(0, max(1, x.size - nfft + 1), hop):
        frame = x[start : start + nfft]
        if frame.size < nfft:
            break
        spec = np.fft.fftshift(np.fft.fft(frame * window, n=nfft))
        mag = np.abs(spec).astype(np.float32)
        mag = mag / (float(mag.max()) + 1e-12)
        frames.append(mag)
        if len(frames) >= max_frames:
            break
    if not frames:
        raise ValueError("STFT produced no frames")
    # FFSCN expects frequency dim multiple of 2048; nfft==2048 is fine
    arr = np.stack(frames, axis=0)  # T,F
    return arr.reshape(1, 1, arr.shape[0], arr.shape[1]).astype(np.float32)


def decode_peaks_1d(
    hm: np.ndarray,
    bw: np.ndarray,
    off: np.ndarray,
    *,
    score_threshold: float = 0.3,
    top_k: int = 64,
    stride: int = 4,
) -> list[dict[str, Any]]:
    """Peak decode from 1D heads. Uses real head values only — no invented scores."""
    hm = np.asarray(hm, dtype=np.float32).reshape(-1)
    bw = np.asarray(bw, dtype=np.float32).reshape(-1)
    off = np.asarray(off, dtype=np.float32).reshape(-1)
    n = min(hm.size, bw.size, off.size)
    hm, bw, off = hm[:n], bw[:n], off[:n]
    # heatmap may be raw logits or probabilities; treat values as scores as-is
    idx = np.where(hm >= score_threshold)[0]
    if idx.size == 0:
        # also try sigmoid if raw looks like logits
        prob = 1.0 / (1.0 + np.exp(-np.clip(hm, -50, 50)))
        idx = np.where(prob >= score_threshold)[0]
        scores = prob
    else:
        scores = hm
    if idx.size == 0:
        return []
    order = idx[np.argsort(scores[idx])[::-1]]
    order = order[:top_k]
    out: list[dict[str, Any]] = []
    for i, j in enumerate(order):
        center = (float(j) + float(off[j])) * float(stride)
        half = max(0.5, float(bw[j]) * 0.5)
        left = max(0.0, center - half)
        right = center + half
        out.append(
            {
                "index": i,
                "peak_bin": int(j),
                "fmin_bin": left,
                "fmax_bin": right,
                "center_bin": center,
                "bw_bins": max(0.0, right - left),
                "score": float(scores[j]),
            }
        )
    return out


def execute_engine(
    engine_path: Path,
    input_name: str,
    input_nchw: np.ndarray,
    output_names: list[str],
) -> dict[str, np.ndarray]:
    """Deserialize + execute TensorRT engine with torch CUDA buffers."""
    import tensorrt as trt
    import torch

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA not available for TensorRT execute")

    logger = trt.Logger(trt.Logger.WARNING)
    runtime = trt.Runtime(logger)
    engine = runtime.deserialize_cuda_engine(engine_path.read_bytes())
    if engine is None:
        raise RuntimeError(f"deserialize failed: {engine_path}")
    context = engine.create_execution_context()
    arr = np.ascontiguousarray(input_nchw, dtype=np.float32)
    shape = tuple(arr.shape)
    if not context.set_input_shape(input_name, shape):
        # fixed-shape engines may reject set; verify match
        cur = tuple(context.get_tensor_shape(input_name))
        if cur != shape and any(d > 0 for d in cur):
            raise RuntimeError(f"input shape {shape} rejected; engine wants {cur}")

    bufs: dict[str, torch.Tensor] = {}
    # inputs
    tin = torch.from_numpy(arr).to("cuda")
    bufs[input_name] = tin
    context.set_tensor_address(input_name, tin.data_ptr())
    # outputs
    for name in output_names:
        sh = tuple(context.get_tensor_shape(name))
        if any(d < 0 for d in sh):
            raise RuntimeError(f"output {name} still dynamic: {sh}")
        t = torch.empty(sh, dtype=torch.float32, device="cuda")
        bufs[name] = t
        context.set_tensor_address(name, t.data_ptr())

    stream = torch.cuda.Stream()
    ok = context.execute_async_v3(stream_handle=stream.cuda_stream)
    stream.synchronize()
    if not ok:
        raise RuntimeError("TensorRT execute_async_v3 returned False")
    return {name: bufs[name].detach().float().cpu().numpy() for name in output_names}
