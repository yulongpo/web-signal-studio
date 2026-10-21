"""Dispatch real detection inference. Never invents candidates."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from ..model_layout import first_present, source_home
from ..torch_runtime import REAL_ENGINE_CPU, REAL_ENGINE_CUDA, REAL_ENGINE_LABELS, probe_torch
from ..tensorrt_runtime import REAL_ENGINE_TRT, probe_tensorrt

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



def _resolve_selected_weights(family: str, params: dict[str, Any]) -> Path | None:
    """Honor DetectionCard modelId/enginePath when they point at a tree .engine.

    Hard rules (G26/CAO): only .engine under model search roots; never .pth;
    never invent a path outside rebuild detection-models roots.
    """
    from ..model_layout import model_dir_roots

    raw_path = params.get("enginePath") or params.get("weightsPath")
    model_id = params.get("modelId") or params.get("engineId")
    candidate: Path | None = None
    if isinstance(raw_path, str) and raw_path.strip():
        candidate = Path(raw_path.strip())
    elif isinstance(model_id, str) and model_id.strip():
        # id forms: "ffscn:name.engine" or bare filename
        name = model_id.strip().split(":")[-1]
        for root in model_dir_roots():
            # direct file under root or one level of family folder
            direct = root / name
            if direct.is_file():
                candidate = direct
                break
            for child in root.glob(f"*/{name}"):
                if child.is_file():
                    candidate = child
                    break
            if candidate is not None:
                break
    if candidate is None:
        return None
    try:
        resolved = candidate.resolve()
    except OSError:
        return None
    if resolved.suffix.lower() != ".engine":
        log.warning("reject non-engine selection: %s", resolved)
        return None
    roots = []
    for r in model_dir_roots():
        try:
            roots.append(r.resolve())
        except OSError:
            roots.append(r)
    if not any(str(resolved).startswith(str(root)) for root in roots):
        # also allow canonical rebuild prefix even if env root differs in case
        rebuild = Path(r"D:/project/signal_studio_rebuild/out/vs2026-qt611-release_bin/detection-models")
        try:
            rebuild_r = rebuild.resolve()
        except OSError:
            rebuild_r = rebuild
        if not str(resolved).lower().startswith(str(rebuild_r).lower()):
            log.warning("reject engine outside model roots: %s", resolved)
            return None
    family_u = family.upper()
    name_l = resolved.name.lower()
    if family_u == "FFSCN" and not name_l.startswith("ffscn"):
        log.warning("reject engine family mismatch FFSCN vs %s", resolved)
        return None
    if family_u == "SCN" and not name_l.startswith("scn"):
        log.warning("reject engine family mismatch SCN vs %s", resolved)
        return None
    if not resolved.is_file():
        return None
    return resolved


def run_detection_inference(
    *,
    kind: str,
    source_path: str | None,
    cancel_cb: Callable[[], bool] | None = None,
    progress_cb: Callable[[float, str, str], None] | None = None,
    params: dict[str, Any] | None = None,
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

    params = dict(params or {})
    weights = _resolve_selected_weights(family, params) or first_present(family)
    home = source_home(family)

    # ONNX still N/A
    if weights is not None and weights.suffix.lower() == ".onnx":
        return InferenceOutcome(
            ok=False,
            blocked=True,
            reasons=[
                f"BLOCKED: {family} ONNX is N/A at {weights} "
                "(no ONNX runtime wired; refusing to invent)"
            ],
            ui_codes=["ONNX_NA", "NO_FAKE_INFERENCE"],
            message=f"{family} ONNX runtime is not wired",
            message_zh=f"{family} ONNX 运行时未接入，拒绝伪造结果",
        )

    # TensorRT .engine path
    if weights is not None and weights.suffix.lower() == ".engine":
        trt = probe_tensorrt()
        if not trt.available:
            return InferenceOutcome(
                ok=False,
                blocked=True,
                reasons=[
                    f"BLOCKED: {family} TENSORRT_RUNTIME_MISSING at {weights} ({trt.reason})"
                ],
                ui_codes=["TENSORRT_RUNTIME_MISSING", "TENSORRT_NA", "NO_FAKE_INFERENCE"],
                message=f"{family} TensorRT runtime missing",
                message_zh=f"{family} TensorRT 运行时不可用，拒绝伪造结果",
            )
        if not source_path or not str(source_path).strip():
            return InferenceOutcome(
                ok=False,
                blocked=True,
                reasons=["BLOCKED: sourcePath required for TensorRT detection (refusing to invent)"],
                ui_codes=["SOURCE_MISSING", "NO_FAKE_INFERENCE"],
                message="sourcePath required for TensorRT detection",
                message_zh="TensorRT 检测需要 sourcePath，拒绝伪造结果",
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
            progress_cb(0.05, f"Loading {family} TensorRT engine", f"正在加载 {family} TensorRT engine")
        try:
            if family == "FFSCN":
                from .trt_ffscn import run_ffscn_trt

                result = run_ffscn_trt(weights=weights, source_path=src, cancel_cb=cancel_cb, params=params)
            else:
                from .trt_scn import run_scn_trt

                result = run_scn_trt(weights=weights, source_path=src, cancel_cb=cancel_cb, params=params)
        except Exception as exc:  # noqa: BLE001
            msg = str(exc)
            if "cancel" in msg.lower():
                return InferenceOutcome(ok=False, cancelled=True, message="Cancelled", message_zh="已取消")
            log.exception("%s TensorRT inference failed", family)
            # Load failures stay BLOCKED (honest); other errors FAILED
            low = msg.lower()
            if "deserialize" in low or "engine" in low and "load" in low:
                return InferenceOutcome(
                    ok=False,
                    blocked=True,
                    reasons=[f"BLOCKED: {family} ENGINE_LOAD_FAILED: {exc}"],
                    ui_codes=["ENGINE_LOAD_FAILED", "NO_FAKE_INFERENCE"],
                    message=f"{family} engine load failed: {exc}",
                    message_zh=f"{family} engine 加载失败: {exc}",
                )
            return InferenceOutcome(
                ok=False,
                failed=True,
                reasons=[f"FAILED: {family} TensorRT inference error: {exc}"],
                ui_codes=["INFERENCE_FAILED"],
                message=f"{family} TensorRT inference error: {exc}",
                message_zh=f"{family} TensorRT 推理失败: {exc}",
            )
        if cancel_cb is not None and cancel_cb():
            return InferenceOutcome(ok=False, cancelled=True, message="Cancelled", message_zh="已取消")
        if not result.get("verifiedForward") or result.get("engine") not in (
            set(REAL_ENGINE_LABELS) | {REAL_ENGINE_TRT}
        ):
            return InferenceOutcome(
                ok=False,
                blocked=True,
                reasons=["BLOCKED: TensorRT adapter returned unverified payload"],
                ui_codes=["NO_FAKE_INFERENCE"],
                message="Unverified TensorRT payload refused",
                message_zh="拒绝未核验的 TensorRT 推理结果",
            )
        if progress_cb:
            progress_cb(1.0, f"{family} TensorRT inference complete", f"{family} TensorRT 推理完成")
        return InferenceOutcome(
            ok=True,
            result=result,
            message=f"{result.get('engine')}: {family} real TRT forward ({result.get('candidateCount', 0)} candidates)",
            message_zh=f"{result.get('engine')}: {family} 真 TensorRT 推理完成（{result.get('candidateCount', 0)} 个候选）",
        )

    # PyTorch .pth path
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
    "REAL_ENGINE_TRT",
    "REAL_ENGINE_LABELS",
    "InferenceOutcome",
    "run_detection_inference",
]
