"""Capability probe + model precheck / degradation per WEB_NATIVE_PROTOCOL.

Hard rules:
- detection.ffscn / detection.scn stay false unless a *real* verified runtime exists.
- Missing / incompatible models produce explicit BLOCKED reasons (path, hash, GPU).
- When model files are present, report identity metadata (path/sha256) but never
  claim inference availability and never invent forward outputs.
- Service stays up under degradation; DSP stubs may remain available while
  detection is BLOCKED.
"""

from __future__ import annotations

import hashlib
import logging
import os
import shutil
import subprocess
from dataclasses import dataclass, field
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


@dataclass
class DetectionReadiness:
    """Result of model/runtime precheck used by tasks + /capabilities."""

    ffscn_ready: bool = False
    scn_ready: bool = False
    ffscn_present: bool = False
    scn_present: bool = False
    reasons: list[str] = field(default_factory=list)
    models: list[ModelInfo] = field(default_factory=list)


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


def _explicit_path(env_key: str) -> Path | None:
    raw = (os.environ.get(env_key) or "").strip()
    return Path(raw) if raw else None


def _expected_sha(env_key: str) -> str | None:
    raw = (os.environ.get(env_key) or "").strip().lower()
    return raw or None


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


def _probe_one(
    *,
    family: str,
    names: tuple[str, ...],
    explicit: Path | None,
    expected_sha: str | None,
) -> tuple[list[ModelInfo], list[str], bool]:
    """Return (models, reasons, present_any). Never sets ready=True here."""
    models: list[ModelInfo] = []
    reasons: list[str] = []
    present_any = False
    seen: set[str] = set()

    candidates: list[Path] = []
    if explicit is not None:
        candidates.append(explicit)
    for droot in _default_model_dirs():
        for name in names:
            candidates.append(droot / name)

    for path in candidates:
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        if path.is_file():
            present_any = True
            digest = _sha256_file(path)
            notes = "File present; TensorRT/CUDA forward path not verified"
            if expected_sha:
                if digest is None:
                    reasons.append(
                        f"BLOCKED: {family} hash unavailable for {path} "
                        "(file too large or unreadable)"
                    )
                    notes = "present but hash unread; expected sha256 configured"
                elif digest.lower() != expected_sha.lower():
                    reasons.append(
                        f"BLOCKED: {family} hash/version mismatch for {path} "
                        f"(got {digest[:12]}..., expected {expected_sha[:12]}...)"
                    )
                    notes = "sha256 mismatch vs LOCAL_COMPUTE_*_SHA256"
                else:
                    notes = (
                        "sha256 matches configured expectation; "
                        "runtime still unverified"
                    )
            models.append(
                ModelInfo(
                    id=f"{family}:{path.name}",
                    path=str(path.resolve()),
                    sha256=digest,
                    present=True,
                    notes=notes,
                )
            )
        else:
            models.append(
                ModelInfo(
                    id=f"{family}:{path.name}",
                    path=str(path),
                    present=False,
                    notes="absent",
                )
            )

    if explicit is not None and not explicit.is_file():
        reasons.append(f"BLOCKED: {family} configured path missing: {explicit}")
    elif not present_any:
        reasons.append(
            f"BLOCKED: no {family} model file under model search roots "
            f"(or {family} env path)"
        )

    return models, reasons, present_any


def _gpu_probe() -> tuple[bool, str]:
    """Return (verified_ok, reason). Warmup never claims full CUDA/TRT verify."""
    try:
        smi = shutil.which("nvidia-smi")
        if not smi:
            return False, "nvidia-smi not found (no GPU toolchain visible)"
        proc = subprocess.run(
            [smi, "--query-gpu=name,driver_version", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            line = proc.stdout.strip().splitlines()[0].strip()
            return False, (
                f"nvidia-smi sees {line!r} but CUDA/TensorRT runtime "
                "not verified (BLOCKED)"
            )
        return False, "nvidia-smi returned no GPU rows"
    except Exception as exc:  # noqa: BLE001
        log.debug("GPU probe failed: %s", exc)
        return False, f"GPU probe error: {exc}"


def probe_detection_readiness() -> DetectionReadiness:
    """Model precheck used by /capabilities and task admission."""
    ffscn_models, ffscn_reasons, ffscn_present = _probe_one(
        family="FFSCN",
        names=FFSCN_CANDIDATE_NAMES,
        explicit=_explicit_path("LOCAL_COMPUTE_FFSCN_PATH"),
        expected_sha=_expected_sha("LOCAL_COMPUTE_FFSCN_SHA256"),
    )
    scn_models, scn_reasons, scn_present = _probe_one(
        family="SCN",
        names=SCN_CANDIDATE_NAMES,
        explicit=_explicit_path("LOCAL_COMPUTE_SCN_PATH"),
        expected_sha=_expected_sha("LOCAL_COMPUTE_SCN_SHA256"),
    )

    gpu_ok, gpu_reason = _gpu_probe()
    reasons: list[str] = []
    reasons.extend(ffscn_reasons)
    reasons.extend(scn_reasons)
    if not gpu_ok:
        reasons.append(f"BLOCKED: {gpu_reason}")

    # Even with files + matching hash + GPU visible, warmup has no real engine.
    reasons.append(
        "BLOCKED: inference worker is STUB_NON_TENSORRT — "
        "no fabricated FFSCN/SCN forward path"
    )

    # Ready flags stay false until a real verified runtime lands.
    return DetectionReadiness(
        ffscn_ready=False,
        scn_ready=False,
        ffscn_present=ffscn_present,
        scn_present=scn_present,
        reasons=reasons,
        models=ffscn_models + scn_models,
    )


def detection_block_reasons_for_kind(kind: str) -> list[str]:
    """Reasons to attach when a detection task is refused / finishes BLOCKED."""
    ready = probe_detection_readiness()
    kind_l = kind.strip().lower()
    out = list(ready.reasons)
    if kind_l.startswith("ffscn") and not ready.ffscn_present:
        out.insert(0, "BLOCKED: FFSCN assets missing for this run")
    if kind_l.startswith("scn") and not ready.scn_present:
        out.insert(0, "BLOCKED: SCN assets missing for this run")
    if not any("STUB_NON_TENSORRT" in r or "refusing to invent" in r for r in out):
        out.append(
            "BLOCKED: refusing to invent FFSCN/SCN detection candidates"
        )
    return out


def build_capabilities() -> CapabilitiesResponse:
    ready = probe_detection_readiness()

    # Degradation: service stays up; offer lightweight DSP stub availability
    # while detection remains BLOCKED.
    dsp = DspCapabilities(
        fft=True,
        psd=False,
        stft=False,
        ddc=False,
        reasons=[
            "DSP stub probe available (non-native); "
            "full FFT/PSD/STFT/DDC workers not wired",
        ],
    )

    notes = [
        "Loopback-only (127.0.0.1).",
        "Auth: Authorization: Bearer <session-token>.",
        "CORS: configured Origin only (dev http://localhost:5173).",
        "Sample indices / half-open ranges are decimal strings.",
        "detection.ffscn/scn stay false until a real model+runtime check passes.",
        "Degradation: service remains up when detection is BLOCKED; "
        "DSP stub may stay available.",
        "Model identity (path/sha256) may be reported when files exist; "
        "never invents inference.",
    ]
    if ready.ffscn_present or ready.scn_present:
        notes.append(
            "One or more model files are present — identity metadata reported; "
            "forward path still BLOCKED (STUB_NON_TENSORRT)."
        )

    return CapabilitiesResponse(
        protocolVersion=PROTOCOL_VERSION,
        serviceVersion=__version__,
        dsp=dsp,
        detection=DetectionCapabilities(
            ffscn=ready.ffscn_ready,
            scn=ready.scn_ready,
            reasons=ready.reasons,
        ),
        models=ready.models,
        notes=notes,
    )
