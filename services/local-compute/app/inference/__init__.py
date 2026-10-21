"""Real FFSCN/SCN inference adapters (PyTorch). Never invent candidates."""

from .pipeline import (
    REAL_ENGINE_CUDA,
    REAL_ENGINE_CPU,
    REAL_ENGINE_LABELS,
    InferenceOutcome,
    run_detection_inference,
)

__all__ = [
    "REAL_ENGINE_CUDA",
    "REAL_ENGINE_CPU",
    "REAL_ENGINE_LABELS",
    "InferenceOutcome",
    "run_detection_inference",
]
