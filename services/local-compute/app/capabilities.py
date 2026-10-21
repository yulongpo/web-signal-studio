"""Capability probe + model precheck / degradation per WEB_NATIVE_PROTOCOL.

Hard rules:
- detection.ffscn / detection.scn stay false unless a *real* verified runtime exists.
- Missing / incompatible models produce explicit BLOCKED reasons (path, hash, GPU).
- When model files are present, report identity metadata (path/sha256) but never
  claim inference availability and never invent forward outputs.
- Service stays up under degradation; DSP stubs may remain available while
  detection is BLOCKED.
- uiMessages carry stable bilingual (en/zh) copy for the detection page.
- gpu + runtime structured precheck fields strengthen reporting for the UI.
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
    GpuPrecheck,
    ModelInfo,
    RuntimePrecheck,
    UiMessage,
)

log = logging.getLogger("local-compute.capabilities")

FFSCN_CANDIDATE_NAMES = ("ffscn.engine", "ffscn.onnx", "FFSCN.engine")
SCN_CANDIDATE_NAMES = ("scn.engine", "scn.onnx", "SCN.engine")
STUB_ENGINE_LABEL = "STUB_NON_TENSORRT"

# Exact UI strings documented in docs/DETECTION_PAGE_CONTRACT.md — keep in sync.
UI_COPY: dict[str, tuple[str, str, str]] = {
    # code -> (severity, en, zh)
    "GPU_MISSING": (
        "error",
        "No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable.",
        "\u672a\u68c0\u6d4b\u5230 NVIDIA GPU \u5de5\u5177\u94fe\uff0c\u68c0\u6d4b\uff08FFSCN/SCN\uff09\u4e0d\u53ef\u7528\u3002",
    ),
    "GPU_UNVERIFIED": (
        "warning",
        "GPU visible but CUDA/TensorRT runtime is not verified. Detection stays blocked.",
        "\u5df2\u770b\u5230 GPU\uff0c\u4f46 CUDA/TensorRT \u8fd0\u884c\u65f6\u672a\u6838\u9a8c\uff0c\u68c0\u6d4b\u4ecd\u4e0d\u53ef\u7528\u3002",
    ),
    "GPU_PROBE_ERROR": (
        "error",
        "GPU probe failed. Detection (FFSCN/SCN) is unavailable.",
        "GPU \u63a2\u6d4b\u5931\u8d25\uff0c\u68c0\u6d4b\uff08FFSCN/SCN\uff09\u4e0d\u53ef\u7528\u3002",
    ),
    "MODEL_MISSING_FFSCN": (
        "error",
        "FFSCN model file is missing. Detection cannot run.",
        "\u7f3a\u5c11 FFSCN \u6a21\u578b\u6587\u4ef6\uff0c\u65e0\u6cd5\u8fd0\u884c\u68c0\u6d4b\u3002",
    ),
    "MODEL_MISSING_SCN": (
        "error",
        "SCN model file is missing. Detection cannot run.",
        "\u7f3a\u5c11 SCN \u6a21\u578b\u6587\u4ef6\uff0c\u65e0\u6cd5\u8fd0\u884c\u68c0\u6d4b\u3002",
    ),
    "MODEL_PATH_MISSING": (
        "error",
        "Configured detection model path is missing on disk.",
        "\u914d\u7f6e\u7684\u68c0\u6d4b\u6a21\u578b\u8def\u5f84\u5728\u78c1\u76d8\u4e0a\u4e0d\u5b58\u5728\u3002",
    ),
    "MODEL_HASH_MISMATCH": (
        "error",
        "Detection model hash/version does not match the configured expectation.",
        "\u68c0\u6d4b\u6a21\u578b\u54c8\u5e0c/\u7248\u672c\u4e0e\u914d\u7f6e\u671f\u671b\u4e0d\u4e00\u81f4\u3002",
    ),
    "MODEL_HASH_UNAVAILABLE": (
        "warning",
        "Detection model hash could not be read; treating as blocked.",
        "\u65e0\u6cd5\u8bfb\u53d6\u68c0\u6d4b\u6a21\u578b\u54c8\u5e0c\uff0c\u6309\u4e0d\u53ef\u7528\u5904\u7406\u3002",
    ),
    "STUB_RUNTIME": (
        "error",
        "Local compute is in stub mode (no TensorRT). Detection will not invent results.",
        "\u672c\u5730\u8ba1\u7b97\u5904\u4e8e\u5360\u4f4d\u6a21\u5f0f\uff08\u65e0 TensorRT\uff09\uff0c\u68c0\u6d4b\u4e0d\u4f1a\u4f2a\u9020\u7ed3\u679c\u3002",
    ),
    "NO_FAKE_INFERENCE": (
        "error",
        "Refusing to invent FFSCN/SCN detection candidates.",
        "\u62d2\u7edd\u4f2a\u9020 FFSCN/SCN \u68c0\u6d4b\u5019\u9009\u7ed3\u679c\u3002",
    ),
}


def ui_message(code: str) -> UiMessage:
    severity, en, zh = UI_COPY[code]
    return UiMessage(code=code, severity=severity, en=en, zh=zh)


@dataclass
class DetectionReadiness:
    """Result of model/runtime precheck used by tasks + /capabilities."""

    ffscn_ready: bool = False
    scn_ready: bool = False
    ffscn_present: bool = False
    scn_present: bool = False
    reasons: list[str] = field(default_factory=list)
    ui_codes: list[str] = field(default_factory=list)
    models: list[ModelInfo] = field(default_factory=list)
    gpu: GpuPrecheck = field(default_factory=GpuPrecheck)
    runtime: RuntimePrecheck = field(default_factory=RuntimePrecheck)

    def ui_messages(self) -> list[UiMessage]:
        seen: set[str] = set()
        out: list[UiMessage] = []
        for code in self.ui_codes:
            if code in seen or code not in UI_COPY:
                continue
            seen.add(code)
            out.append(ui_message(code))
        return out


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


def model_search_roots() -> list[str]:
    roots: list[str] = []
    for d in _default_model_dirs():
        roots.append(str(d.resolve()) if d.exists() else str(d))
    explicit_ff = _explicit_path("LOCAL_COMPUTE_FFSCN_PATH")
    explicit_sc = _explicit_path("LOCAL_COMPUTE_SCN_PATH")
    for p in (explicit_ff, explicit_sc):
        if p is not None:
            parent = str(p.parent)
            if parent not in roots:
                roots.append(parent)
    return roots


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
) -> tuple[list[ModelInfo], list[str], list[str], bool]:
    """Return (models, reasons, ui_codes, present_any). Never sets ready=True here."""
    models: list[ModelInfo] = []
    reasons: list[str] = []
    ui_codes: list[str] = []
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
                    ui_codes.append("MODEL_HASH_UNAVAILABLE")
                    notes = "present but hash unread; expected sha256 configured"
                elif digest.lower() != expected_sha.lower():
                    reasons.append(
                        f"BLOCKED: {family} hash/version mismatch for {path} "
                        f"(got {digest[:12]}..., expected {expected_sha[:12]}...)"
                    )
                    ui_codes.append("MODEL_HASH_MISMATCH")
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
        ui_codes.append("MODEL_PATH_MISSING")
    elif not present_any:
        reasons.append(
            f"BLOCKED: no {family} model file under model search roots "
            f"(or {family} env path)"
        )
        ui_codes.append(
            "MODEL_MISSING_FFSCN" if family == "FFSCN" else "MODEL_MISSING_SCN"
        )

    return models, reasons, ui_codes, present_any


def _gpu_probe() -> GpuPrecheck:
    """Structured GPU probe. Never claims full CUDA/TRT verify."""
    try:
        smi = shutil.which("nvidia-smi")
        if not smi:
            return GpuPrecheck(
                toolchainVisible=False,
                runtimeVerified=False,
                reason="nvidia-smi not found (no GPU toolchain visible)",
                uiCode="GPU_MISSING",
            )
        proc = subprocess.run(
            [smi, "--query-gpu=name,driver_version", "--format=csv,noheader"],
            capture_output=True,
            text=True,
            timeout=5,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            line = proc.stdout.strip().splitlines()[0].strip()
            parts = [p.strip() for p in line.split(",")]
            name = parts[0] if parts else line
            driver = parts[1] if len(parts) > 1 else None
            return GpuPrecheck(
                toolchainVisible=True,
                runtimeVerified=False,
                name=name or None,
                driverVersion=driver,
                reason=(
                    f"nvidia-smi sees {line!r} but CUDA/TensorRT runtime "
                    "not verified (BLOCKED)"
                ),
                uiCode="GPU_UNVERIFIED",
            )
        return GpuPrecheck(
            toolchainVisible=False,
            runtimeVerified=False,
            reason="nvidia-smi returned no GPU rows",
            uiCode="GPU_MISSING",
        )
    except Exception as exc:  # noqa: BLE001
        log.debug("GPU probe failed: %s", exc)
        return GpuPrecheck(
            toolchainVisible=False,
            runtimeVerified=False,
            reason=f"GPU probe error: {exc}",
            uiCode="GPU_PROBE_ERROR",
        )


def probe_detection_readiness() -> DetectionReadiness:
    """Model precheck used by /capabilities and task admission."""
    ffscn_models, ffscn_reasons, ffscn_ui, ffscn_present = _probe_one(
        family="FFSCN",
        names=FFSCN_CANDIDATE_NAMES,
        explicit=_explicit_path("LOCAL_COMPUTE_FFSCN_PATH"),
        expected_sha=_expected_sha("LOCAL_COMPUTE_FFSCN_SHA256"),
    )
    scn_models, scn_reasons, scn_ui, scn_present = _probe_one(
        family="SCN",
        names=SCN_CANDIDATE_NAMES,
        explicit=_explicit_path("LOCAL_COMPUTE_SCN_PATH"),
        expected_sha=_expected_sha("LOCAL_COMPUTE_SCN_SHA256"),
    )

    gpu = _gpu_probe()
    reasons: list[str] = []
    ui_codes: list[str] = []
    reasons.extend(ffscn_reasons)
    reasons.extend(scn_reasons)
    ui_codes.extend(ffscn_ui)
    ui_codes.extend(scn_ui)
    reasons.append(f"BLOCKED: {gpu.reason}")
    if gpu.uiCode:
        ui_codes.append(gpu.uiCode)

    reasons.append(
        f"BLOCKED: inference worker is {STUB_ENGINE_LABEL} — "
        "no fabricated FFSCN/SCN forward path"
    )
    ui_codes.append("STUB_RUNTIME")
    ui_codes.append("NO_FAKE_INFERENCE")

    runtime = RuntimePrecheck(
        engine=STUB_ENGINE_LABEL,
        tensorrtVerified=False,
        cudaVerified=False,
        canInventResults=False,
        modelSearchRoots=model_search_roots(),
        ffscnPresent=ffscn_present,
        scnPresent=scn_present,
        ffscnReady=False,
        scnReady=False,
    )

    return DetectionReadiness(
        ffscn_ready=False,
        scn_ready=False,
        ffscn_present=ffscn_present,
        scn_present=scn_present,
        reasons=reasons,
        ui_codes=ui_codes,
        models=ffscn_models + scn_models,
        gpu=gpu,
        runtime=runtime,
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
    # Surface structured GPU reason code for logs/UI debug.
    if ready.gpu.uiCode and ready.gpu.reason:
        tag = f"BLOCKED: gpu.uiCode={ready.gpu.uiCode}"
        if tag not in out:
            out.append(tag)
    return out


def detection_ui_messages_for_kind(kind: str) -> list[UiMessage]:
    """Bilingual UI messages for a blocked detection run."""
    ready = probe_detection_readiness()
    codes = list(ready.ui_codes)
    kind_l = kind.strip().lower()
    if kind_l.startswith("ffscn") and not ready.ffscn_present:
        codes.insert(0, "MODEL_MISSING_FFSCN")
    if kind_l.startswith("scn") and not ready.scn_present:
        codes.insert(0, "MODEL_MISSING_SCN")
    if "NO_FAKE_INFERENCE" not in codes:
        codes.append("NO_FAKE_INFERENCE")
    seen: set[str] = set()
    out: list[UiMessage] = []
    for code in codes:
        if code in seen or code not in UI_COPY:
            continue
        seen.add(code)
        out.append(ui_message(code))
    return out


def primary_ui_pair(messages: list[UiMessage]) -> tuple[str | None, str | None]:
    """First error (else first) message as (en, zh) for TaskRecord.message*."""
    if not messages:
        return None, None
    for m in messages:
        if m.severity == "error":
            return m.en, m.zh
    return messages[0].en, messages[0].zh


def build_capabilities() -> CapabilitiesResponse:
    ready = probe_detection_readiness()
    ui_msgs = ready.ui_messages()

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
        "detection.uiMessages carries bilingual (en/zh) copy for the UI.",
        "gpu + runtime fields expose structured precheck (engine stays "
        f"{STUB_ENGINE_LABEL} until TensorRT is verified).",
        "Task status machine: queued->running->{succeeded|failed|cancelled|BLOCKED}; "
        "cancel always wins over late worker updates.",
    ]
    if ready.ffscn_present or ready.scn_present:
        notes.append(
            "One or more model files are present — identity metadata reported; "
            f"forward path still BLOCKED ({STUB_ENGINE_LABEL})."
        )

    return CapabilitiesResponse(
        protocolVersion=PROTOCOL_VERSION,
        serviceVersion=__version__,
        dsp=dsp,
        detection=DetectionCapabilities(
            ffscn=ready.ffscn_ready,
            scn=ready.scn_ready,
            reasons=ready.reasons,
            uiMessages=ui_msgs,
        ),
        models=ready.models,
        gpu=ready.gpu,
        runtime=ready.runtime,
        notes=notes,
    )
