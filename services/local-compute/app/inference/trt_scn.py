"""SCN TensorRT detect path. Never invents candidates."""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from .trt_common import decode_peaks_1d, execute_engine, load_iq_any, psd_from_iq
from ..tensorrt_runtime import REAL_ENGINE_TRT

log = logging.getLogger("local-compute.inference.trt_scn")

SCN_INPUT = "resnet_32_input:0"
# manifest: bw=Identity:0, hm=Identity_1:0, off=Identity_2:0
SCN_OUT_BW = "Identity:0"
SCN_OUT_HM = "Identity_1:0"
SCN_OUT_OFF = "Identity_2:0"
SCN_BINS = 32768


def run_scn_trt(
    *,
    weights: Path,
    source_path: Path,
    cancel_cb=None,
) -> dict[str, Any]:
    if weights.suffix.lower() != ".engine":
        raise ValueError(f"SCN TRT path requires .engine, got {weights.suffix}")
    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before SCN TRT load")

    iq, fs, center = load_iq_any(source_path)
    psd = psd_from_iq(iq, n_bins=SCN_BINS)
    inp = psd.reshape(1, SCN_BINS, 1, 1).astype("float32")

    if cancel_cb is not None and cancel_cb():
        raise RuntimeError("cancelled before SCN TRT execute")

    outs = execute_engine(
        weights,
        SCN_INPUT,
        inp,
        [SCN_OUT_BW, SCN_OUT_HM, SCN_OUT_OFF],
    )
    thr = float(os.environ.get("LOCAL_COMPUTE_SCN_SCORE_THRESHOLD") or "0.3")
    top_k = int(os.environ.get("LOCAL_COMPUTE_SCN_TOPK") or "64")
    candidates = decode_peaks_1d(
        outs[SCN_OUT_HM],
        outs[SCN_OUT_BW],
        outs[SCN_OUT_OFF],
        score_threshold=thr,
        top_k=top_k,
        stride=4,
    )
    return {
        "verifiedForward": True,
        "engine": REAL_ENGINE_TRT,
        "family": "SCN",
        "weightsPath": str(weights.resolve()),
        "sourcePath": str(source_path.resolve()),
        "device": "cuda:0",
        "fs": fs,
        "centerHz": center,
        "inputLength": SCN_BINS,
        "candidateCount": len(candidates),
        "candidates": candidates,
        "notes": "Real TensorRT SCN forward; candidates from hm/bw/off peak decode (not fabricated).",
    }
