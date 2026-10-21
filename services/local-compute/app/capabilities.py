"""Model / GPU probe → BLOCKED when assets are missing."""

from __future__ import annotations

import hashlib
import logging
import os
from pathlib import Path

from . import __version__
from .models import (
    BackendStatus,
    CapabilitiesResponse,
    DetectionBackend,
    GpuStatus,
    ModelInfo,
)

log = logging.getLogger("local-compute.capabilities")

# Well-known relative names we look for under model search roots.
# Presence of a real file is required before status can become available.
FFSCN_CANDIDATE_NAMES = (
    "ffscn.engine",
    "ffscn.onnx",
    "FFSCN.engine",
)
SCN_CANDIDATE_NAMES = (
    "scn.engine",
    "scn.onnx",
    "SCN.engine",
)


def _default_model_dirs() -> list[Path]:
    here = Path(__file__).resolve().parent.parent
    dirs: list[Path] = [here / "models"]
    extra = (os.environ.get("LOCAL_COMPUTE_MODEL_DIRS") or "").strip()
    if extra:
        for part in extra.replace(",", ";").split(";"):
            part = part.strip()
            if part:
                dirs.append(Path(part))
    return dirs


def _sha256_file(path: Path, max_bytes: int = 64 * 1024 * 1024) -> str | None:
    try:
        h = hashlib.sha256()
        size = 0
        with path.open("rb") as f:
            while True:
                chunk = f.read(1024 * 1024)
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    return None  # refuse hashing huge blobs in warmup
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None


def _find_models(names: tuple[str, ...]) -> list[ModelInfo]:
    found: list[ModelInfo] = []
    seen: set[str] = set()
    for root in _default_model_dirs():
        if not root.is_dir():
            continue
        for name in names:
            path = root / name
            key = str(path.resolve()) if path.exists() else str(path)
            if key in seen:
                continue
            seen.add(key)
            if path.is_file():
                digest = _sha256_file(path)
                found.append(
                    ModelInfo(
                        id=name,
                        path=str(path),
                        sha256=digest,
                        present=True,
                        notes="File present; engine load / TensorRT runtime not verified in warmup",
                    )
                )
            else:
                found.append(
                    ModelInfo(
                        id=name,
                        path=str(path),
                        sha256=None,
                        present=False,
                        notes="absent",
                    )
                )
    if not found:
        for name in names:
            found.append(
                ModelInfo(
                    id=name,
                    path=None,
                    sha256=None,
                    present=False,
                    notes="no model search roots contained this file",
                )
            )
    return found


def probe_gpu() -> GpuStatus:
    """Best-effort GPU probe without inventing availability."""
    # Try nvidia-smi only as a soft signal; absence => not available.
    try:
        import shutil
        import subprocess

        smi = shutil.which("nvidia-smi")
        if smi:
            proc = subprocess.run(
                [smi, "--query-gpu=name,driver_version", "--format=csv,noheader"],
                capture_output=True,
                text=True,
                timeout=5,
                check=False,
            )
            if proc.returncode == 0 and proc.stdout.strip():
                line = proc.stdout.strip().splitlines()[0]
                name = line.split(",")[0].strip() if line else None
                # CUDA Python / TensorRT not assumed; report presence of NVIDIA device only.
                return GpuStatus(
                    available=True,
                    vendor="NVIDIA",
                    name=name,
                    cudaAvailable=False,
                    details="nvidia-smi visible; CUDA/TensorRT runtime not verified in warmup",
                )
    except Exception as exc:  # noqa: BLE001 — probe must never crash the service
        log.debug("GPU probe failed: %s", exc)
    return GpuStatus(
        available=False,
        vendor=None,
        name=None,
        cudaAvailable=False,
        details="No verified GPU / CUDA / TensorRT runtime for detection",
    )


def _backend(name: str, candidates: tuple[str, ...], gpu: GpuStatus) -> DetectionBackend:
    models = _find_models(candidates)
    present = [m for m in models if m.present]
    reasons: list[str] = []
    if not present:
        reasons.append(f"no {name} model file found under model search roots")
    if not gpu.available:
        reasons.append("GPU not available / not verified")
    if not gpu.cudaAvailable:
        reasons.append("CUDA/TensorRT runtime not verified")
    # Warmup never marks productionEligible; real load path comes later.
    reasons.append("inference worker not wired in P4-E warmup")
    status = BackendStatus.BLOCKED
    # Even if a file is on disk, warmup still BLOCKED until a real forward path exists.
    return DetectionBackend(
        name=name,
        status=status,
        blockReasons=reasons,
        models=models,
        productionEligible=False,
    )


def build_capabilities() -> CapabilitiesResponse:
    gpu = probe_gpu()
    backends = [
        _backend("ffscn", FFSCN_CANDIDATE_NAMES, gpu),
        _backend("scn", SCN_CANDIDATE_NAMES, gpu),
    ]
    notes = [
        "Loopback-only service (127.0.0.1).",
        "Session token required on all routes.",
        "FFSCN/SCN results are never fabricated; backends stay BLOCKED until a real model+runtime path passes.",
    ]
    return CapabilitiesResponse(
        version=__version__,
        detectionBackends=backends,
        gpu=gpu,
        notes=notes,
    )
