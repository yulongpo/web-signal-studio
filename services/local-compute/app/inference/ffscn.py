"""FFSCN real inference via FFSCN_TEST_GUI sources. Never fabricates candidates."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from types import SimpleNamespace
from typing import Any

log = logging.getLogger("local-compute.inference.ffscn")


def _default_args(nfft: int) -> SimpleNamespace:
    return SimpleNamespace(
        nfft=nfft,
        time_fps=0.001,  # seconds (1 ms)
        window=10,
        hop=5,
        batch_size=2,
        topk=512,
        score_threshold=0.7,
        iou_threshold=0.3,
        match_iou=0.3,
        max_miss=1,
        min_hits=2,
        merge_gap=100.0,
        snr_db=6.0,
        refine_time=True,
        refine_bw=True,
        split_enabled=True,
        split_gap_ms=20.0,
        min_burst_ms=10.0,
        sample_refine=True,
        refine_method="sample",
        edge_frac=0.6,
        min_on_ms=5.0,
        min_off_ms=10.0,
        smooth_ms=1.0,
        fs_override=None,
        eff_bw_hz=None,
        no_truth=True,
    )


def _block_to_dict(block: Any) -> dict[str, Any]:
    if isinstance(block, dict):
        src = block
    else:
        src = getattr(block, "__dict__", {}) or {}
    out: dict[str, Any] = {}
    for key in (
        "fc_hz",
        "bw_hz",
        "fmin_hz",
        "fmax_hz",
        "t_start_s",
        "t_end_s",
        "score",
        "avg_score",
        "confidence",
        "center_hz",
        "bandwidth_hz",
        "t0",
        "t1",
    ):
        if key in src and src[key] is not None:
            val = src[key]
            if hasattr(val, "item"):
                try:
                    val = val.item()
                except Exception:  # noqa: BLE001
                    pass
            if isinstance(val, (int, float, str, bool)):
                out[key] = val
            else:
                try:
                    out[key] = float(val)
                except Exception:  # noqa: BLE001
                    out[key] = str(val)
    # Common GUI block fields
    for key, val in src.items():
        if key.startswith("_"):
            continue
        if key in out:
            continue
        if isinstance(val, (int, float, str, bool)):
            out[key] = val
    return out


def run_ffscn(
    *,
    weights: Path,
    home: Path,
    source_path: Path,
    device: str,
    cancel_cb=None,
) -> dict[str, Any]:
    """Run FFSCN detect_file on wav/iq/psd path. Returns verifiedForward payload."""
    import sys

    if weights.suffix.lower() not in {".pth", ".pt"}:
        raise ValueError(
            f"FFSCN weight {weights.name} is not a PyTorch checkpoint "
            f"(TensorRT .engine / ONNX are N/A); refusing to invent"
        )

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before FFSCN load")

    home_s = str(home.resolve())
    if home_s not in sys.path:
        sys.path.insert(0, home_s)

    from business.detection import load_model, detect_file  # type: ignore
    from algorithm.data_loader import SignalSample  # type: ignore

    nfft = int((os.environ.get("LOCAL_COMPUTE_FFSCN_NFFT") or "1024").strip() or "1024")
    # CLI uses nfft as input_length for load_model; GUI workers pass nfft similarly.
    # Prefer env override; 65536 is GUI default but needs more VRAM — keep 1024 unless set.
    down_nums = int((os.environ.get("LOCAL_COMPUTE_FFSCN_DOWN_NUMS") or "11").strip() or "11")
    detect_nfft = int((os.environ.get("LOCAL_COMPUTE_FFSCN_DETECT_NFFT") or str(nfft)).strip() or str(nfft))

    model = load_model(str(weights), down_nums=down_nums, input_length=detect_nfft, device=device)
    args = _default_args(detect_nfft)

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before FFSCN detect")

    engine = SignalSample(
        home_dir=None,
        data_names=[],
        label_names=[],
        nfft=detect_nfft,
        time_fps=args.time_fps,
        device=device,
    )
    stft_o, freq_hz, times_s, blocks, fs = detect_file(
        engine, model, str(source_path), args, device
    )

    candidates = [_block_to_dict(b) for b in (blocks or [])]
    eng = "PYTORCH_CUDA" if str(device).startswith("cuda") else "PYTORCH_CPU"
    return {
        "verifiedForward": True,
        "engine": eng,
        "family": "FFSCN",
        "weightsPath": str(weights.resolve()),
        "sourcePath": str(source_path.resolve()),
        "device": device,
        "fs": float(fs) if fs is not None else None,
        "nfft": detect_nfft,
        "stftShape": list(stft_o.shape) if hasattr(stft_o, "shape") else None,
        "timeFrames": int(len(times_s)) if times_s is not None else None,
        "candidateCount": len(candidates),
        "candidates": candidates,
        "notes": "Real FFSCN detect_file forward via FFSCN_TEST_GUI.",
    }
