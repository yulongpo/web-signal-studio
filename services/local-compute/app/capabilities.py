"""Capability probe + model precheck / degradation per WEB_NATIVE_PROTOCOL.

Hard rules:
- detection.ffscn / detection.scn stay false unless a *real* verified runtime exists
  (torch load + smoke forward succeeded for that family).
- Missing / incompatible models produce explicit BLOCKED reasons (path, hash, GPU/torch).
- When model files are present, report identity metadata (path/sha256) but never
  invent forward outputs.
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
from .model_layout import (
    candidate_paths,
    expected_sha,
    explicit_path,
    first_present,
    model_search_root_strings,
    source_home,
)
from .models import (
    CapabilitiesResponse,
    DetectionCapabilities,
    DspCapabilities,
    GpuPrecheck,
    ModelInfo,
    RuntimePrecheck,
    UiMessage,
)
from .torch_runtime import (
    REAL_ENGINE_LABELS,
    clear_torch_cache,
    probe_torch,
    smoke_for_family,
)

log = logging.getLogger("local-compute.capabilities")

STUB_ENGINE_LABEL = "STUB_NON_TENSORRT"

# Exact UI strings — keep in sync with docs/DETECTION_PAGE_CONTRACT.md
UI_COPY: dict[str, tuple[str, str, str]] = {
    "GPU_MISSING": (
        "error",
        "No NVIDIA GPU toolchain detected. Detection (FFSCN/SCN) is unavailable.",
        "未检测到 NVIDIA GPU 工具链，检测（FFSCN/SCN）不可用。",
    ),
    "GPU_UNVERIFIED": (
        "warning",
        "GPU visible but CUDA/TensorRT runtime is not verified. Detection stays blocked.",
        "已看到 GPU，但 CUDA/TensorRT 运行时未核验，检测仍不可用。",
    ),
    "GPU_PROBE_ERROR": (
        "error",
        "GPU probe failed. Detection (FFSCN/SCN) is unavailable.",
        "GPU 探测失败，检测（FFSCN/SCN）不可用。",
    ),
    "TORCH_MISSING": (
        "error",
        "PyTorch is not available in this Python. Detection cannot run real inference.",
        "当前 Python 环境没有可用的 PyTorch，无法进行真推理。",
    ),
    "TORCH_CPU_ONLY": (
        "warning",
        "PyTorch is available on CPU only. Real inference may be slow.",
        "仅有 CPU 版 PyTorch，真推理可能较慢。",
    ),
    "TORCH_CUDA_OK": (
        "info",
        "PyTorch CUDA runtime verified for local detection.",
        "已核验 PyTorch CUDA 运行时，可用于本地检测。",
    ),
    "MODEL_MISSING_FFSCN": (
        "error",
        "FFSCN model file is missing. Detection cannot run.",
        "缺少 FFSCN 模型文件，无法运行检测。",
    ),
    "MODEL_MISSING_SCN": (
        "error",
        "SCN model file is missing. Detection cannot run.",
        "缺少 SCN 模型文件，无法运行检测。",
    ),
    "MODEL_PATH_MISSING": (
        "error",
        "Configured detection model path is missing on disk.",
        "配置的检测模型路径在磁盘上不存在。",
    ),
    "MODEL_HOME_MISSING": (
        "error",
        "Algorithm source home is missing (set LOCAL_COMPUTE_FFSCN_HOME / LOCAL_COMPUTE_SCN_HOME).",
        "缺少算法源码目录（请设置 LOCAL_COMPUTE_FFSCN_HOME / LOCAL_COMPUTE_SCN_HOME）。",
    ),
    "MODEL_HASH_MISMATCH": (
        "error",
        "Detection model hash/version does not match the configured expectation.",
        "检测模型哈希/版本与配置期望不一致。",
    ),
    "MODEL_HASH_UNAVAILABLE": (
        "warning",
        "Detection model hash could not be read; treating as blocked.",
        "无法读取检测模型哈希，按不可用处理。",
    ),
    "MODEL_LOAD_FAILED": (
        "error",
        "Detection weights were found but failed to load/forward. Detection stays blocked.",
        "已找到检测权重但加载/前向失败，检测仍不可用。",
    ),
    "SOURCE_MISSING": (
        "error",
        "sourcePath is required for real detection; refusing to invent candidates.",
        "真检测需要 sourcePath，拒绝伪造候选结果。",
    ),
    "INFERENCE_FAILED": (
        "error",
        "Real detection inference failed. No fabricated candidates were returned.",
        "真检测推理失败，未返回任何伪造候选。",
    ),
    "STUB_RUNTIME": (
        "error",
        "Local compute is in stub mode (no verified PyTorch forward). Detection will not invent results.",
        "本地计算处于占位模式（无已核验的 PyTorch 前向），检测不会伪造结果。",
    ),
    "REAL_RUNTIME": (
        "info",
        "Verified PyTorch detection runtime is ready for this family.",
        "该检测族别的 PyTorch 真推理运行时已就绪。",
    ),
    "NO_FAKE_INFERENCE": (
        "error",
        "Refusing to invent FFSCN/SCN detection candidates.",
        "拒绝伪造 FFSCN/SCN 检测候选结果。",
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
    engine: str = STUB_ENGINE_LABEL

    def ui_messages(self) -> list[UiMessage]:
        seen: set[str] = set()
        out: list[UiMessage] = []
        for code in self.ui_codes:
            if code in seen or code not in UI_COPY:
                continue
            seen.add(code)
            out.append(ui_message(code))
        return out


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
    expected: str | None,
) -> tuple[list[ModelInfo], list[str], list[str], bool, Path | None]:
    """Return (models, reasons, ui_codes, present_any, first_present_path)."""
    models: list[ModelInfo] = []
    reasons: list[str] = []
    ui_codes: list[str] = []
    present_any = False
    first: Path | None = None
    seen: set[str] = set()
    explicit = explicit_path(
        "LOCAL_COMPUTE_FFSCN_PATH" if family == "FFSCN" else "LOCAL_COMPUTE_SCN_PATH"
    )

    for path in candidate_paths(family):
        key = str(path)
        if key in seen:
            continue
        seen.add(key)
        if path.is_file():
            present_any = True
            if first is None:
                first = path
            digest = _sha256_file(path)
            notes = f"File present ({path.suffix.lower() or 'bin'})"
            if expected:
                if digest is None:
                    reasons.append(
                        f"BLOCKED: {family} hash unavailable for {path} "
                        "(file too large or unreadable)"
                    )
                    ui_codes.append("MODEL_HASH_UNAVAILABLE")
                    notes = "present but hash unread; expected sha256 configured"
                elif digest.lower() != expected.lower():
                    reasons.append(
                        f"BLOCKED: {family} hash/version mismatch for {path} "
                        f"(got {digest[:12]}..., expected {expected[:12]}...)"
                    )
                    ui_codes.append("MODEL_HASH_MISMATCH")
                    notes = "sha256 mismatch vs LOCAL_COMPUTE_*_SHA256"
                else:
                    notes = "sha256 matches configured expectation"
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
            f"BLOCKED: no {family} model file under LOCAL_COMPUTE_MODEL_DIR "
            f"/ search roots (or {family} env path)"
        )
        ui_codes.append(
            "MODEL_MISSING_FFSCN" if family == "FFSCN" else "MODEL_MISSING_SCN"
        )

    return models, reasons, ui_codes, present_any, first


def _nvidia_smi_probe() -> GpuPrecheck:
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
                reason=f"nvidia-smi sees {line!r}",
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
    """Model + torch precheck used by /capabilities and task admission."""
    ffscn_models, ffscn_reasons, ffscn_ui, ffscn_present, ffscn_path = _probe_one(
        family="FFSCN",
        expected=expected_sha("LOCAL_COMPUTE_FFSCN_SHA256"),
    )
    scn_models, scn_reasons, scn_ui, scn_present, scn_path = _probe_one(
        family="SCN",
        expected=expected_sha("LOCAL_COMPUTE_SCN_SHA256"),
    )

    gpu = _nvidia_smi_probe()
    torch_probe = probe_torch()

    reasons: list[str] = []
    ui_codes: list[str] = []
    reasons.extend(ffscn_reasons)
    reasons.extend(scn_reasons)
    ui_codes.extend(ffscn_ui)
    ui_codes.extend(scn_ui)

    # Merge GPU + torch into structured gpu field
    if torch_probe.available and torch_probe.cuda_available:
        gpu = GpuPrecheck(
            toolchainVisible=True,
            runtimeVerified=True,
            name=torch_probe.device_name or gpu.name,
            driverVersion=gpu.driverVersion,
            reason=torch_probe.reason,
            uiCode="TORCH_CUDA_OK",
        )
    elif torch_probe.available:
        # CPU torch — keep nvidia visibility if any, but not CUDA-verified
        gpu = GpuPrecheck(
            toolchainVisible=gpu.toolchainVisible,
            runtimeVerified=False,
            name=gpu.name,
            driverVersion=gpu.driverVersion,
            reason=f"{gpu.reason}; {torch_probe.reason}",
            uiCode="TORCH_CPU_ONLY",
        )
        reasons.append(f"BLOCKED: {torch_probe.reason} (CUDA not available)")
        ui_codes.append("TORCH_CPU_ONLY")
    else:
        reasons.append(f"BLOCKED: {gpu.reason}")
        if gpu.uiCode:
            ui_codes.append(gpu.uiCode)
        reasons.append(f"BLOCKED: {torch_probe.reason}")
        ui_codes.append("TORCH_MISSING")

    ffscn_ready = False
    scn_ready = False
    engine = STUB_ENGINE_LABEL

    allow_cpu = (os.environ.get("LOCAL_COMPUTE_ALLOW_CPU_INFERENCE") or "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    torch_ok_for_ready = torch_probe.available and (
        torch_probe.cuda_available or allow_cpu
    )

    if torch_ok_for_ready:
        if ffscn_present and ffscn_path is not None:
            home = source_home("FFSCN")
            if home is None:
                reasons.append("BLOCKED: FFSCN algorithm home missing")
                ui_codes.append("MODEL_HOME_MISSING")
            else:
                smoke = smoke_for_family("FFSCN", ffscn_path, home, torch_probe.device)
                if smoke.ok:
                    ffscn_ready = True
                    engine = smoke.engine or torch_probe.engine
                else:
                    reasons.append(f"BLOCKED: FFSCN {smoke.detail}")
                    ui_codes.append("MODEL_LOAD_FAILED")
        if scn_present and scn_path is not None:
            home = source_home("SCN")
            if home is None:
                reasons.append("BLOCKED: SCN algorithm home missing")
                ui_codes.append("MODEL_HOME_MISSING")
            else:
                smoke = smoke_for_family("SCN", scn_path, home, torch_probe.device)
                if smoke.ok:
                    scn_ready = True
                    engine = smoke.engine or torch_probe.engine
                else:
                    reasons.append(f"BLOCKED: SCN {smoke.detail}")
                    ui_codes.append("MODEL_LOAD_FAILED")

    if ffscn_ready or scn_ready:
        ui_codes.append("REAL_RUNTIME")
        # Drop stub-only codes when at least one family is ready
        ui_codes = [c for c in ui_codes if c not in {"STUB_RUNTIME"}]
        # Keep NO_FAKE as policy reminder only when the other family is blocked
        if not (ffscn_ready and scn_ready):
            ui_codes.append("NO_FAKE_INFERENCE")
        # Filter reasons that are pure stub banners if ready
        reasons = [r for r in reasons if STUB_ENGINE_LABEL not in r]
        if not ffscn_ready:
            reasons.append("BLOCKED: FFSCN not ready (see model/torch reasons above)")
        if not scn_ready:
            reasons.append("BLOCKED: SCN not ready (see model/torch reasons above)")
    else:
        reasons.append(
            f"BLOCKED: inference worker is {STUB_ENGINE_LABEL} — "
            "no fabricated FFSCN/SCN forward path"
        )
        ui_codes.append("STUB_RUNTIME")
        ui_codes.append("NO_FAKE_INFERENCE")
        engine = STUB_ENGINE_LABEL

    # Hash mismatch / path missing must force not-ready even if smoke somehow ran
    if any("hash/version mismatch" in r for r in ffscn_reasons):
        ffscn_ready = False
    if any("hash/version mismatch" in r for r in scn_reasons):
        scn_ready = False
    if any("configured path missing" in r for r in ffscn_reasons):
        ffscn_ready = False
    if any("configured path missing" in r for r in scn_reasons):
        scn_ready = False

    runtime = RuntimePrecheck(
        engine=engine,
        tensorrtVerified=False,
        cudaVerified=bool(torch_probe.cuda_available),
        canInventResults=False,
        modelSearchRoots=model_search_root_strings(),
        ffscnPresent=ffscn_present,
        scnPresent=scn_present,
        ffscnReady=ffscn_ready,
        scnReady=scn_ready,
    )

    return DetectionReadiness(
        ffscn_ready=ffscn_ready,
        scn_ready=scn_ready,
        ffscn_present=ffscn_present,
        scn_present=scn_present,
        reasons=reasons,
        ui_codes=ui_codes,
        models=ffscn_models + scn_models,
        gpu=gpu,
        runtime=runtime,
        engine=engine,
    )


def detection_block_reasons_for_kind(kind: str) -> list[str]:
    ready = probe_detection_readiness()
    kind_l = kind.strip().lower()
    out = list(ready.reasons)
    if kind_l.startswith("ffscn"):
        if ready.ffscn_ready:
            return [
                "INFO: FFSCN runtime ready — provide sourcePath for real inference"
            ]
        if not ready.ffscn_present:
            out.insert(0, "BLOCKED: FFSCN assets missing for this run")
    if kind_l.startswith("scn"):
        if ready.scn_ready:
            return [
                "INFO: SCN runtime ready — provide sourcePath for real inference"
            ]
        if not ready.scn_present:
            out.insert(0, "BLOCKED: SCN assets missing for this run")
    if not any("STUB_NON_TENSORRT" in r or "refusing to invent" in r.lower() for r in out):
        if not (
            (kind_l.startswith("ffscn") and ready.ffscn_ready)
            or (kind_l.startswith("scn") and ready.scn_ready)
        ):
            out.append("BLOCKED: refusing to invent FFSCN/SCN detection candidates")
    if ready.gpu.uiCode and ready.gpu.reason:
        tag = f"BLOCKED: gpu.uiCode={ready.gpu.uiCode}"
        if tag not in out and not (
            (kind_l.startswith("ffscn") and ready.ffscn_ready)
            or (kind_l.startswith("scn") and ready.scn_ready)
        ):
            out.append(tag)
    return out


def detection_ui_messages_for_kind(kind: str) -> list[UiMessage]:
    ready = probe_detection_readiness()
    codes = list(ready.ui_codes)
    kind_l = kind.strip().lower()
    if kind_l.startswith("ffscn") and ready.ffscn_ready:
        codes = ["REAL_RUNTIME"]
    elif kind_l.startswith("scn") and ready.scn_ready:
        codes = ["REAL_RUNTIME"]
    else:
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
    if not messages:
        return None, None
    for m in messages:
        if m.severity == "error":
            return m.en, m.zh
    return messages[0].en, messages[0].zh


def family_ready(kind: str) -> bool:
    ready = probe_detection_readiness()
    kind_l = kind.strip().lower()
    if kind_l.startswith("ffscn"):
        return ready.ffscn_ready
    if kind_l.startswith("scn"):
        return ready.scn_ready
    return False


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
        "detection.ffscn/scn become true only after verified PyTorch load+forward.",
        "Degradation: service remains up when detection is BLOCKED; "
        "DSP stub may stay available.",
        "Model identity (path/sha256) may be reported when files exist; "
        "never invents inference.",
        "detection.uiMessages carries bilingual (en/zh) copy for the UI.",
        "gpu + runtime fields expose structured precheck.",
        "Set LOCAL_COMPUTE_MODEL_DIR (or *_PATH) + algorithm HOMEs for real inference.",
        "Task status machine: queued->running->{succeeded|failed|cancelled|BLOCKED}; "
        "cancel always wins over late worker updates.",
    ]
    if ready.ffscn_ready or ready.scn_ready:
        notes.append(
            f"Real runtime ready ({ready.engine}): "
            f"ffscn={ready.ffscn_ready}, scn={ready.scn_ready}."
        )
    elif ready.ffscn_present or ready.scn_present:
        notes.append(
            "One or more model files are present — identity metadata reported; "
            f"forward path still BLOCKED ({ready.engine})."
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


# Re-export for tests that clear caches between cases
__all__ = [
    "UI_COPY",
    "STUB_ENGINE_LABEL",
    "DetectionReadiness",
    "ui_message",
    "probe_detection_readiness",
    "detection_block_reasons_for_kind",
    "detection_ui_messages_for_kind",
    "primary_ui_pair",
    "family_ready",
    "build_capabilities",
    "clear_torch_cache",
    "REAL_ENGINE_LABELS",
]
