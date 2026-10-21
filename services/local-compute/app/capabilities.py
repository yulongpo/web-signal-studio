"""Capability probe per WEB_NATIVE_PROTOCOL — false + BLOCKED without real assets."""

from __future__ import annotations

import hashlib
import logging
import os
from pathlib import Path

from . import PROTOCOL_VERSION, __version__
from .models import (
    CapabilitiesResponse,
    DetectionCapabilities,
    DspCapabilities,
    ModelInfo,
)

log = logging.getLogger("local-compute.capabilities")

FFSCN_CANDIDATE_NAMES = ("ffscn.engine", "ffscn.onnx", "FFSCN.engine")
SCN_CANDIDATE_NAMES = ("scn.engine", "scn.onnx", "SCN.engine")


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
                    return None
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None


def _scan_named(names: tuple[str, ...]) -> list[ModelInfo]:
    found: list[ModelInfo] = []
    seen: set[str] = set()
    for root in _default_model_dirs():
        if not root.is_dir():
            continue
        for name in names:
            path = root / name
            key = str(path.resolve()) if path.exists() else f"{root}:{name}"
            if key in seen:
                continue
            seen.add(key)
            if path.is_file():
                found.append(
                    ModelInfo(
                        id=name,
                        path=str(path),
                        sha256=_sha256_file(path),
                        present=True,
                        notes="File present; engine load / TensorRT not verified in warmup",
                    )
                )
            else:
                found.append(
                    ModelInfo(
                        id=name,
                        path=str(path),
                        present=False,
                        notes="absent",
                    )
                )
    if not found:
        for name in names:
            found.append(ModelInfo(id=name, present=False, notes="no search root hit"))
    return found


def _gpu_ok() -> tuple[bool, str]:
    try:
        import shutil
        import subprocess

        smi = shutil.which("nvidia-smi")
        if not smi:
            return False, "nvidia-smi not found"
        proc = subprocess.run(
            [smi, "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return False, (
                f"nvidia-smi sees {proc.stdout.strip().splitlines()[0]!r} "
                "but CUDA/TensorRT runtime not verified (BLOCKED)"
            )
    except Exception as exc:  # noqa: BLE001
        log.debug("GPU probe failed: %s", exc)
    return False, "No verified GPU / CUDA / TensorRT runtime"


def build_capabilities() -> CapabilitiesResponse:
    ffscn_models = _scan_named(FFSCN_CANDIDATE_NAMES)
    scn_models = _scan_named(SCN_CANDIDATE_NAMES)
    models = ffscn_models + scn_models

    gpu_ok, gpu_reason = _gpu_ok()
    reasons: list[str] = []

    ffscn_present = any(m.present for m in ffscn_models)
    scn_present = any(m.present for m in scn_models)

    # Hard rule: no real forward path in warmup → always false + BLOCKED reasons.
    ffscn = False
    scn = False
    if not ffscn_present:
        reasons.append("BLOCKED: no FFSCN model file under model search roots")
    else:
        reasons.append("BLOCKED: FFSCN file present but inference worker not wired / unverified")
    if not scn_present:
        reasons.append("BLOCKED: no SCN model file under model search roots")
    else:
        reasons.append("BLOCKED: SCN file present but inference worker not wired / unverified")
    if not gpu_ok:
        reasons.append(f"BLOCKED: {gpu_reason}")
    reasons.append("BLOCKED: P4-E warmup — no fabricated FFSCN/SCN forward path")

    dsp = DspCapabilities(
        fft=False,
        psd=False,
        stft=False,
        ddc=False,
        reasons=["BLOCKED: native DSP workers not wired in P4-E warmup"],
    )

    return CapabilitiesResponse(
        protocolVersion=PROTOCOL_VERSION,
        serviceVersion=__version__,
        dsp=dsp,
        detection=DetectionCapabilities(ffscn=ffscn, scn=scn, reasons=reasons),
        models=models,
        notes=[
            "Loopback-only (127.0.0.1).",
            "Auth: Authorization: Bearer <session-token>.",
            "CORS: configured Origin only (dev http://localhost:5173).",
            "Sample indices / half-open ranges are decimal strings.",
            "detection.ffscn/scn stay false until a real model+runtime check passes.",
        ],
    )
