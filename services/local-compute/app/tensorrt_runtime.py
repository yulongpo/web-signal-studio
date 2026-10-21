"""TensorRT runtime probe + engine deserialize/execute smoke.

Hard policy: never invent FFSCN/SCN candidates. Ready only after a real
deserialize (and optional execute) against a local .engine artifact.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

log = logging.getLogger("local-compute.tensorrt_runtime")

REAL_ENGINE_TRT = "TENSORRT_CUDA"
TRT_ENGINE_LABELS = frozenset({REAL_ENGINE_TRT})


@dataclass(frozen=True)
class TrtProbe:
    available: bool
    version: str | None = None
    reason: str = ""
    ui_code: str = "TENSORRT_RUNTIME_MISSING"


@dataclass(frozen=True)
class TrtSmoke:
    ok: bool
    family: str
    path: str | None = None
    engine: str | None = None
    detail: str = ""
    num_io_tensors: int | None = None


def _disabled() -> bool:
    return (os.environ.get("LOCAL_COMPUTE_DISABLE_TENSORRT") or "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }


@lru_cache(maxsize=1)
def probe_tensorrt() -> TrtProbe:
    if _disabled():
        return TrtProbe(
            available=False,
            reason="TensorRT disabled via LOCAL_COMPUTE_DISABLE_TENSORRT",
            ui_code="TENSORRT_RUNTIME_MISSING",
        )
    try:
        import tensorrt as trt  # noqa: F401
    except Exception as exc:  # noqa: BLE001
        return TrtProbe(
            available=False,
            reason=f"tensorrt import failed: {exc}",
            ui_code="TENSORRT_RUNTIME_MISSING",
        )
    try:
        import tensorrt as trt

        ver = getattr(trt, "__version__", None) or "unknown"
        return TrtProbe(
            available=True,
            version=str(ver),
            reason=f"tensorrt {ver} importable",
            ui_code="TENSORRT_OK",
        )
    except Exception as exc:  # noqa: BLE001
        return TrtProbe(
            available=False,
            reason=f"tensorrt probe failed: {exc}",
            ui_code="TENSORRT_RUNTIME_MISSING",
        )


def clear_tensorrt_caches() -> None:
    probe_tensorrt.cache_clear()
    smoke_deserialize.cache_clear()


def _logger():
    import tensorrt as trt

    level = trt.Logger.WARNING
    return trt.Logger(level)


@lru_cache(maxsize=16)
def smoke_deserialize(path_str: str, family: str) -> TrtSmoke:
    """Deserialize a .engine. Never invents candidates."""
    path = Path(path_str)
    probe = probe_tensorrt()
    if not probe.available:
        return TrtSmoke(
            ok=False,
            family=family,
            path=str(path),
            detail=probe.reason,
        )
    if not path.is_file():
        return TrtSmoke(
            ok=False,
            family=family,
            path=str(path),
            detail=f"engine file missing: {path}",
        )
    if path.suffix.lower() != ".engine":
        return TrtSmoke(
            ok=False,
            family=family,
            path=str(path),
            detail=f"not a .engine: {path.suffix}",
        )
    try:
        import tensorrt as trt

        runtime = trt.Runtime(_logger())
        blob = path.read_bytes()
        engine = runtime.deserialize_cuda_engine(blob)
        if engine is None:
            return TrtSmoke(
                ok=False,
                family=family,
                path=str(path),
                detail="deserialize_cuda_engine returned None",
            )
        n = int(engine.num_io_tensors)
        return TrtSmoke(
            ok=True,
            family=family,
            path=str(path.resolve()),
            engine=REAL_ENGINE_TRT,
            detail=f"deserialized ok ({n} io tensors, trt {probe.version})",
            num_io_tensors=n,
        )
    except Exception as exc:  # noqa: BLE001
        log.info("TRT deserialize smoke failed for %s: %s", path, exc)
        return TrtSmoke(
            ok=False,
            family=family,
            path=str(path),
            detail=f"ENGINE_LOAD_FAILED: {exc}",
        )


def smoke_for_engine(family: str, weights: Path) -> TrtSmoke:
    return smoke_deserialize(str(weights.resolve()), family.upper())


__all__ = [
    "REAL_ENGINE_TRT",
    "TRT_ENGINE_LABELS",
    "TrtProbe",
    "TrtSmoke",
    "probe_tensorrt",
    "smoke_deserialize",
    "smoke_for_engine",
    "clear_tensorrt_caches",
]
