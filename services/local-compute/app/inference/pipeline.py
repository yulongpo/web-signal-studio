"""Dispatch real detection inference. Never invents candidates."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from ..model_layout import first_present, source_home
from ..torch_runtime import REAL_ENGINE_CPU, REAL_ENGINE_CUDA, REAL_ENGINE_LABELS, probe_torch

log = logging.getLogger("local-compute.inference.pipeline")


@dataclass
class InferenceOutcome:
    ok: bool
    blocked: bool = False
    cancelled: bool = False
    failed: bool = False
    reasons: list[str] = field(default_factory=list)
    ui_codes: list[str] = field(default_factory=list)
    result: dict[str, Any] | None = None
    message: str | None = None
    message_zh: str | None = None


def run_detection_inference(
    *,
    kind: str,
    source_path: str | None,
    cancel_cb: Callable[[], bool] | None = None,
    progress_cb: Callable[[float, str, str], None] | None = None,
) -> InferenceOutcome:
    """Attempt real FFSCN/SCN inference.

    Policy:
    - Missing/unloadable weights or torch => blocked (no fake candidates).
    - Missing/unreadable sourcePath => blocked (ready models still do not invent).
    - Cancel => cancelled.
    - Exceptions after admission => failed (not fake success).
    """
    kind_l = (kind or "").strip().lower()
    family = "FFSCN" if kind_l.startswith("ffscn") else "SCN" if kind_l.startswith("scn") else None
    if family is None:
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=["BLOCKED: kind is not ffscn.* or scn.*"],
            ui_codes=["NO_FAKE_INFERENCE"],
            message="Unsupported detection kind for real inference",
            message_zh="不支持的检测任务类型，无法走真推理",
        )

    torch_probe = probe_torch()
    if not torch_probe.available:
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=[f"BLOCKED: {torch_probe.reason}"],
            ui_codes=["TORCH_MISSING", "NO_FAKE_INFERENCE"],
            message=torch_probe.reason,
            message_zh="未安装可用的 PyTorch，无法真推理",
        )

    weights = first_present(family)
    home = source_home(family)
    if weights is not None and weights.suffix.lower() in {".engine", ".onnx"}:
        kind_label = "TensorRT .engine" if weights.suffix.lower() == ".engine" else "ONNX"
        code = "TENSORRT_NA" if weights.suffix.lower() == ".engine" else "ONNX_NA"
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=[
                f"BLOCKED: {family} {kind_label} is N/A at {weights} "
                "(PyTorch .pth/.pt only; refusing to invent)"
            ],
            ui_codes=[code, "NO_FAKE_INFERENCE"],
            message=f"{family} {kind_label} runtime is not wired",
            message_zh=f"{family} 的 {kind_label} 运行时未接入，拒绝伪造结果",
        )
    if weights is None:
        code = "MODEL_MISSING_FFSCN" if family == "FFSCN" else "MODEL_MISSING_SCN"
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=[f"BLOCKED: no {family} weight file present"],
            ui_codes=[code, "NO_FAKE_INFERENCE"],
            message=f"{family} weights missing",
            message_zh=f"缺少 {family} 权重，无法真推理",
        )
    if home is None:
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=[f"BLOCKED: {family} source home missing (set LOCAL_COMPUTE_{family}_HOME)"],
            ui_codes=["MODEL_HOME_MISSING", "NO_FAKE_INFERENCE"],
            message=f"{family} algorithm home missing",
            message_zh=f"缺少 {family} 算法源码目录",
        )

    if not source_path or not str(source_path).strip():
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=["BLOCKED: sourcePath required for real detection (refusing to invent)"],
            ui_codes=["SOURCE_MISSING", "NO_FAKE_INFERENCE"],
            message="sourcePath required for real detection",
            message_zh="真检测需要 sourcePath，拒绝伪造结果",
        )
    src = Path(source_path)
    if not src.is_file():
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=[f"BLOCKED: sourcePath not a file: {src}"],
            ui_codes=["SOURCE_MISSING", "NO_FAKE_INFERENCE"],
            message=f"sourcePath not found: {src}",
            message_zh=f"sourcePath 不存在: {src}",
        )

    if cancel_cb is not None and cancel_cb():
        return InferenceOutcome(ok=False, cancelled=True, message="Cancelled", message_zh="已取消")

    if progress_cb:
        progress_cb(0.05, f"Loading {family} weights", f"正在加载 {family} 权重")

    try:
        if family == "FFSCN":
            from .ffscn import run_ffscn

            result = run_ffscn(
                weights=weights,
                home=home,
                source_path=src,
                device=torch_probe.device,
                cancel_cb=cancel_cb,
            )
        else:
            from .scn import run_scn

            result = run_scn(
                weights=weights,
                home=home,
                source_path=src,
                device=torch_probe.device,
                cancel_cb=cancel_cb,
            )
    except Exception as exc:  # noqa: BLE001
        msg = str(exc)
        if "cancel" in msg.lower():
            return InferenceOutcome(ok=False, cancelled=True, message="Cancelled", message_zh="已取消")
        log.exception("%s inference failed", family)
        return InferenceOutcome(
            ok=False,
            failed=True,
            reasons=[f"FAILED: {family} inference error: {exc}"],
            ui_codes=["INFERENCE_FAILED"],
            message=f"{family} inference error: {exc}",
            message_zh=f"{family} 推理失败: {exc}",
        )

    if cancel_cb is not None and cancel_cb():
        return InferenceOutcome(ok=False, cancelled=True, message="Cancelled", message_zh="已取消")

    if not result.get("verifiedForward") or result.get("engine") not in REAL_ENGINE_LABELS:
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=["BLOCKED: inference adapter returned unverified payload"],
            ui_codes=["NO_FAKE_INFERENCE"],
            message="Unverified inference payload refused",
            message_zh="拒绝未核验的推理结果",
        )

    if progress_cb:
        progress_cb(1.0, f"{family} inference complete", f"{family} 推理完成")

    return InferenceOutcome(
        ok=True,
        result=result,
        message=f"{result.get('engine')}: {family} real forward ({result.get('candidateCount', 0)} candidates)",
        message_zh=f"{result.get('engine')}: {family} 真推理完成（{result.get('candidateCount', 0)} 个候选）",
    )


__all__ = [
    "REAL_ENGINE_CUDA",
    "REAL_ENGINE_CPU",
    "REAL_ENGINE_LABELS",
    "InferenceOutcome",
    "run_detection_inference",
]
