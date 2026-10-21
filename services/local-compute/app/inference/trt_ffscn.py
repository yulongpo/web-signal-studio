"""FFSCN TensorRT detect path. Never invents candidates."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from .trt_common import decode_peaks_1d, execute_engine, load_iq_any, stft_spectrum
from ..tensorrt_runtime import REAL_ENGINE_TRT

log = logging.getLogger("local-compute.inference.trt_ffscn")

FFSCN_INPUT = "spectrum"
FFSCN_OUTS = ["hm", "bw", "off"]


def run_ffscn_trt(
    *,
    weights: Path,
    source_path: Path,
    cancel_cb=None,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if weights.suffix.lower() != ".engine":
        raise ValueError(f"FFSCN TRT path requires .engine, got {weights.suffix}")
    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before FFSCN TRT load")

    p = dict(params or {})
    # Prefer DetectionCard params; env remains fallback. FFT must satisfy engine profile.
    nfft = int(p.get("fftSize") or os.environ.get("LOCAL_COMPUTE_FFSCN_NFFT") or "2048")
    # engine profile requires frequencyMultiple 2048
    if nfft < 2048 or (nfft % 2048) != 0:
        nfft = 2048
    hop = max(1, nfft // 2)
    max_frames = int(
        p.get("modelFrames")
        or os.environ.get("LOCAL_COMPUTE_FFSCN_TRT_FRAMES")
        or "10"
    )

    iq, fs, center = load_iq_any(source_path)
    spectrum = stft_spectrum(iq, nfft=nfft, hop=hop, max_frames=max_frames)

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before FFSCN TRT execute")

    outs = execute_engine(weights, FFSCN_INPUT, spectrum, FFSCN_OUTS)
    thr = float(
        p.get("scoreThreshold")
        if p.get("scoreThreshold") is not None
        else (os.environ.get("LOCAL_COMPUTE_FFSCN_SCORE_THRESHOLD") or "0.3")
    )
    top_k = int(
        p.get("topK")
        if p.get("topK") is not None
        else (os.environ.get("LOCAL_COMPUTE_FFSCN_TOPK") or "64")
    )
    # output stride 4 per manifest
    candidates = decode_peaks_1d(
        outs["hm"],
        outs["bw"],
        outs["off"],
        score_threshold=thr,
        top_k=top_k,
        stride=4,
    )
    return {
        "verifiedForward": True,
        "engine": REAL_ENGINE_TRT,
        "family": "FFSCN",
        "weightsPath": str(weights.resolve()),
        "sourcePath": str(source_path.resolve()),
        "device": "cuda:0",
        "fs": fs,
        "centerHz": center,
        "inputShape": list(spectrum.shape),
        "candidateCount": len(candidates),
        "candidates": candidates,
        "notes": "Real TensorRT FFSCN forward on STFT spectrum; candidates from hm/bw/off peak decode (not fabricated).",
    }
