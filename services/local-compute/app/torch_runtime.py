"""Torch / CUDA probe and weight load smoke tests.

Never claims readiness without a successful load + forward.
Does not invent detection candidates.
"""

from __future__ import annotations

import logging
import os
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Any

log = logging.getLogger("local-compute.torch_runtime")

REAL_ENGINE_CUDA = "PYTORCH_CUDA"
REAL_ENGINE_CPU = "PYTORCH_CPU"
# TRT label lives in tensorrt_runtime; union used by pipeline verification.
REAL_ENGINE_LABELS = frozenset({REAL_ENGINE_CUDA, REAL_ENGINE_CPU, "TENSORRT_CUDA"})

_lock = threading.Lock()
_cache: dict[str, Any] = {}


@dataclass
class TorchProbe:
    available: bool = False
    version: str | None = None
    cuda_available: bool = False
    cuda_device_count: int = 0
    device_name: str | None = None
    device: str = "cpu"
    engine: str = "STUB_NON_TENSORRT"
    reason: str = "torch not probed"
    ui_code: str = "TORCH_MISSING"


@dataclass
class LoadSmoke:
    ok: bool = False
    family: str = ""
    path: str | None = None
    engine: str | None = None
    device: str | None = None
    detail: str = ""
    output_keys: list[str] | None = None


def _env_bool(name: str, default: bool = False) -> bool:
    raw = (os.environ.get(name) or "").strip().lower()
    if not raw:
        return default
    return raw in {"1", "true", "yes", "on"}


def probe_torch(*, force: bool = False) -> TorchProbe:
    with _lock:
        if not force and "torch_probe" in _cache:
            return _cache["torch_probe"]

    if _env_bool("LOCAL_COMPUTE_DISABLE_TORCH"):
        result = TorchProbe(
            available=False,
            reason="LOCAL_COMPUTE_DISABLE_TORCH=1",
            ui_code="TORCH_MISSING",
            engine="STUB_NON_TENSORRT",
        )
        with _lock:
            _cache["torch_probe"] = result
        return result

    try:
        import torch  # type: ignore
    except Exception as exc:  # noqa: BLE001
        result = TorchProbe(
            available=False,
            reason=f"torch import failed: {exc}",
            ui_code="TORCH_MISSING",
            engine="STUB_NON_TENSORRT",
        )
        with _lock:
            _cache["torch_probe"] = result
        return result

    cuda_ok = bool(torch.cuda.is_available())
    count = int(torch.cuda.device_count()) if cuda_ok else 0
    name = None
    device = "cpu"
    engine = REAL_ENGINE_CPU
    ui = "TORCH_CPU_ONLY"
    reason = f"torch {torch.__version__} available (CPU)"
    if cuda_ok and count > 0:
        try:
            name = torch.cuda.get_device_name(0)
        except Exception:  # noqa: BLE001
            name = "cuda:0"
        device = "cuda:0"
        engine = REAL_ENGINE_CUDA
        ui = "TORCH_CUDA_OK"
        reason = f"torch {torch.__version__} + CUDA ({name})"
    result = TorchProbe(
        available=True,
        version=str(torch.__version__),
        cuda_available=cuda_ok,
        cuda_device_count=count,
        device_name=name,
        device=device,
        engine=engine,
        reason=reason,
        ui_code=ui,
    )
    with _lock:
        _cache["torch_probe"] = result
    return result


def clear_torch_cache() -> None:
    with _lock:
        _cache.clear()


def _refuse_non_torch_weight(family: str, weights: Path) -> LoadSmoke | None:
    """TensorRT .engine and ONNX are N/A. Never torch.load them as a fake forward."""
    suf = weights.suffix.lower()
    if suf in {".pth", ".pt"}:
        return None
    if suf == ".engine":
        detail = "TensorRT .engine is N/A; refusing torch load (no fabricated forward)"
    elif suf == ".onnx":
        detail = "ONNX weight is N/A; refusing torch load (no fabricated forward)"
    else:
        detail = f"unsupported weight suffix {suf or '(none)'}; refusing load"
    return LoadSmoke(ok=False, family=family, path=str(weights), detail=detail)


def smoke_load_ffscn(weights: Path, home: Path | None, device: str) -> LoadSmoke:
    """Build FFSCN net from HOME and load weights; run one zero forward."""
    refused = _refuse_non_torch_weight("FFSCN", weights)
    if refused is not None:
        return refused
    if home is None or not home.is_dir():
        return LoadSmoke(
            ok=False,
            family="FFSCN",
            path=str(weights),
            detail="LOCAL_COMPUTE_FFSCN_HOME missing or not a directory",
        )
    try:
        import sys
        import torch

        home_s = str(home.resolve())
        if home_s not in sys.path:
            sys.path.insert(0, home_s)
        from business.detection import load_model  # type: ignore

        nfft = int((os.environ.get("LOCAL_COMPUTE_FFSCN_NFFT") or "1024").strip() or "1024")
        down_nums = int((os.environ.get("LOCAL_COMPUTE_FFSCN_DOWN_NUMS") or "11").strip() or "11")
        model = load_model(str(weights), down_nums=down_nums, input_length=nfft, device=device)
        x = torch.zeros(1, 1, 10, nfft, device=device)
        with torch.no_grad():
            out = model(x)
        keys = list(out.keys()) if isinstance(out, dict) else []
        return LoadSmoke(
            ok=True,
            family="FFSCN",
            path=str(weights.resolve()),
            engine=REAL_ENGINE_CUDA if str(device).startswith("cuda") else REAL_ENGINE_CPU,
            device=device,
            detail=f"load+forward ok (nfft={nfft}, down_nums={down_nums})",
            output_keys=keys,
        )
    except Exception as exc:  # noqa: BLE001
        log.info("FFSCN smoke load failed: %s", exc)
        return LoadSmoke(
            ok=False,
            family="FFSCN",
            path=str(weights),
            detail=f"load/forward failed: {exc}",
        )


def smoke_load_scn(weights: Path, home: Path | None, device: str) -> LoadSmoke:
    """Build SCN net from HOME and load weights; run one zero forward."""
    refused = _refuse_non_torch_weight("SCN", weights)
    if refused is not None:
        return refused
    if home is None or not home.is_dir():
        return LoadSmoke(
            ok=False,
            family="SCN",
            path=str(weights),
            detail="LOCAL_COMPUTE_SCN_HOME missing or not a directory",
        )
    try:
        import sys
        import torch

        home_s = str(home.resolve())
        if home_s not in sys.path:
            sys.path.insert(0, home_s)
        from lib.carrier_detection_net_resnet_max import CarrierDetectionNet  # type: ignore
        from lib.resnet import CarrierResnet_new  # type: ignore
        from lib.decoders import FPN  # type: ignore

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
        x = torch.zeros(1, 1, 1, 16384, device=device)
        with torch.no_grad():
            out = model(x)
        keys = list(out.keys()) if isinstance(out, dict) else []
        return LoadSmoke(
            ok=True,
            family="SCN",
            path=str(weights.resolve()),
            engine=REAL_ENGINE_CUDA if str(device).startswith("cuda") else REAL_ENGINE_CPU,
            device=device,
            detail="load+forward ok (input=16384, down_nums=11)",
            output_keys=keys,
        )
    except Exception as exc:  # noqa: BLE001
        log.info("SCN smoke load failed: %s", exc)
        return LoadSmoke(
            ok=False,
            family="SCN",
            path=str(weights),
            detail=f"load/forward failed: {exc}",
        )


def smoke_for_family(family: str, weights: Path, home: Path | None, device: str) -> LoadSmoke:
    cache_key = f"smoke:{family}:{weights}:{device}:{home}"
    with _lock:
        if cache_key in _cache:
            return _cache[cache_key]
    if family.upper() == "FFSCN":
        result = smoke_load_ffscn(weights, home, device)
    else:
        result = smoke_load_scn(weights, home, device)
    with _lock:
        _cache[cache_key] = result
    return result
