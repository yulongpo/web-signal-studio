"""SCN real inference via train_SCN sources. Never fabricates candidates."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

log = logging.getLogger("local-compute.inference.scn")


def run_scn(
    *,
    weights: Path,
    home: Path,
    source_path: Path,
    device: str,
    cancel_cb=None,
) -> dict[str, Any]:
    """Run SCN on a .ptpsd (or torch-saved PSDSample) file.

    Returns a verifiedForward payload with real bands/scores from the model.
    Raises on load/data errors (caller maps to BLOCKED/FAILED).
    """
    import sys
    import torch

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before SCN load")

    home_s = str(home.resolve())
    if home_s not in sys.path:
        sys.path.insert(0, home_s)

    from lib.carrier_detection_net_resnet_max import CarrierDetectionNet
    from lib.resnet import CarrierResnet_new
    from lib.decoders import FPN
    from psd_data_loader import CarrierInfo, PSDSample, Z_normalization  # noqa: F401

    model = CarrierDetectionNet(
        down_nums=11,
        input_shape=[1, 1, 16384],
        backbone=CarrierResnet_new,
        neck=FPN,
        neck_nums=1,
        is_training=False,
    )
    state = torch.load(str(weights), map_location="cpu", weights_only=True)
    if isinstance(state, dict) and "state_dict" in state and isinstance(state["state_dict"], dict):
        state = state["state_dict"]
    if state and next(iter(state)).startswith("module."):
        state = {k[7:]: v for k, v in state.items()}
    model.load_state_dict(state, strict=True)
    model.to(device).eval()

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before SCN data load")

    suffix = source_path.suffix.lower()
    if suffix not in {".ptpsd", ".pt", ".pth"}:
        raise ValueError(
            f"SCN source must be .ptpsd/.pt (PSDSample); got {suffix or '(none)'}"
        )

    # PSDSample pickles often originate as __main__.PSDSample; remap before load.
    import sys as _sys
    for _mod in list(_sys.modules.values()):
        if _mod is None:
            continue
        _n = getattr(_mod, "__name__", "") or ""
        if _n == "__main__" or _n.endswith(".__main__"):
            setattr(_mod, "PSDSample", PSDSample)
            setattr(_mod, "CarrierInfo", CarrierInfo)
    # PSDSample pickles need weights_only=False (trusted local path).
    sample = torch.load(str(source_path), map_location="cpu", weights_only=False)
    if hasattr(sample, "psd"):
        psd = sample.psd
        fs = float(getattr(sample, "fs", 0.0) or 0.0)
    elif torch.is_tensor(sample):
        psd = sample
        fs = 0.0
    elif isinstance(sample, dict) and "psd" in sample:
        psd = sample["psd"]
        fs = float(sample.get("fs") or 0.0)
    else:
        raise TypeError(f"unsupported SCN sample type: {type(sample)}")

    psd = psd.detach().float().cpu().reshape(-1)
    # Match training length 16384: center-crop or pad, then NCHW (1,1,1,L)
    target = 16384
    length = int(psd.numel())
    if length > target:
        start = (length - target) // 2
        psd = psd[start : start + target]
    elif length < target:
        psd = torch.nn.functional.pad(psd, (0, target - length))
    psd = Z_normalization(psd.view(1, 1, -1)).view(1, 1, 1, target)

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before SCN forward")

    with torch.no_grad():
        out = model(psd.to(device))

    bands_list = out.get("bands") or []
    scores_list = out.get("scores") or []
    candidates: list[dict[str, Any]] = []
    # batch dim 0
    bands0 = bands_list[0] if bands_list else []
    scores0 = scores_list[0] if scores_list else []
    if torch.is_tensor(bands0):
        bands_t = bands0.detach().cpu()
        scores_t = scores0.detach().cpu() if torch.is_tensor(scores0) else None
        for i in range(bands_t.shape[0]):
            left = float(bands_t[i, 0])
            right = float(bands_t[i, 1])
            score = float(scores_t[i]) if scores_t is not None else None
            candidates.append(
                {
                    "index": i,
                    "fmin_bin": left,
                    "fmax_bin": right,
                    "center_bin": (left + right) / 2.0,
                    "bw_bins": max(0.0, right - left),
                    "score": score,
                }
            )

    engine = "PYTORCH_CUDA" if str(device).startswith("cuda") else "PYTORCH_CPU"
    return {
        "verifiedForward": True,
        "engine": engine,
        "family": "SCN",
        "weightsPath": str(weights.resolve()),
        "sourcePath": str(source_path.resolve()),
        "device": device,
        "fs": fs,
        "inputLength": 16384,
        "candidateCount": len(candidates),
        "candidates": candidates,
        "notes": "Real SCN forward; bins are model grid units (scale=4 vs 16384 PSD).",
    }
