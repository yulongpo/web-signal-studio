"""Model directory layout + weight discovery for local-compute.

Primary env: LOCAL_COMPUTE_MODEL_DIR (single root).
Also accepted: LOCAL_COMPUTE_MODEL_DIRS (;-separated), plus
LOCAL_COMPUTE_FFSCN_PATH / LOCAL_COMPUTE_SCN_PATH for explicit files.

Canonical local assets live only under the desktop rebuild tree
(yulongpo/signal_studio @ rebuild/a143-native). Do not probe any other
weight or IQ tree.

  LOCAL_COMPUTE_MODEL_DIR=
    D:\\project\\signal_studio_rebuild\\out\\vs2026-qt611-release_bin\\detection-models
  LOCAL_COMPUTE_FFSCN_PATH=
    ...\\detection-models\\ffscn-gui-iq-v1\\ffscn_epoch1200_dynamic_fp32.engine
  LOCAL_COMPUTE_SCN_PATH=
    ...\\detection-models\\scn-max-psd-v1\\scn_model.engine

IQ smoke input (not a weight):
  D:\\project\\signal_studio_rebuild\\resources\\sigmf_data_demo\\0000000.sigmf-data
  (+ 0000000.sigmf-meta / .json)

.engine files under the rebuild tree are the only detection models (G26/CAO).
Discovery only — loading/deserialize is handled by tensorrt_runtime / capabilities.
When TensorRT cannot run, capabilities stay BLOCKED (TENSORRT_RUNTIME_MISSING /
ENGINE_LOAD_FAILED); never invent candidates.
LOCAL_COMPUTE_FFSCN_HOME / LOCAL_COMPUTE_SCN_HOME are optional and have no default
path outside signal_studio_rebuild.
IQ: LOCAL_COMPUTE_IQ_DIR or rebuild resources/sigmf_data_demo.

Optional expected SHA-256 (any one source wins, first match):
  LOCAL_COMPUTE_FFSCN_SHA256 / LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256
  LOCAL_COMPUTE_SCN_SHA256   / LOCAL_COMPUTE_SCN_WEIGHT_SHA256
  JSON manifest under MODEL_DIR (weights.sha256.json | model_hashes.json)
  or LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST pointing at a JSON file.
Missing expected-hash config is OK — probe/load continues (hash check is optional).
"""

from __future__ import annotations

import json
import logging
import os
from functools import lru_cache
from pathlib import Path

log = logging.getLogger("local-compute.model_layout")

FFSCN_FILE_NAMES = (
    "ffscn_epoch1200_dynamic_fp32.engine",
    "ffscn_epoch1200_fp32.engine",
    "ffscn.engine",
    "FFSCN.engine",
    "ffscn.pth",
    "FFSCN.pth",
    "ffscn.onnx",
)
SCN_FILE_NAMES = (
    "scn_model.engine",
    "scn.engine",
    "SCN.engine",
    "scn.pth",
    "SCN.pth",
    "scn.onnx",
)

FFSCN_GLOBS = ("ffscn*.engine", "ffscn*.pth", "FFSCN*.pth", "ffscn*.onnx")
SCN_GLOBS = ("scn*.engine", "scn*.pth", "SCN*.pth", "scn*.onnx")

MANIFEST_BASENAMES = (
    "weights.sha256.json",
    "model_hashes.json",
    "weight_hashes.json",
)


def _split_env(raw: str) -> list[str]:
    parts: list[str] = []
    for chunk in raw.replace(",", ";").split(";"):
        chunk = chunk.strip().strip('"').strip("'")
        if chunk:
            parts.append(chunk)
    return parts


def model_dir_roots() -> list[Path]:
    """Ordered search roots for weight files."""
    here = Path(__file__).resolve().parent.parent
    roots: list[Path] = []
    seen: set[str] = set()

    def _add(p: Path) -> None:
        key = str(p)
        if key in seen:
            return
        seen.add(key)
        roots.append(p)

    primary = (os.environ.get("LOCAL_COMPUTE_MODEL_DIR") or "").strip()
    if primary:
        _add(Path(primary))
    extra = (os.environ.get("LOCAL_COMPUTE_MODEL_DIRS") or "").strip()
    for part in _split_env(extra):
        _add(Path(part))
    _add(here / "models")
    return roots


def explicit_path(env_key: str) -> Path | None:
    raw = (os.environ.get(env_key) or "").strip().strip('"').strip("'")
    return Path(raw) if raw else None


def expected_sha(env_key: str) -> str | None:
    """Legacy helper: single env key. Prefer expected_weight_sha(family)."""
    raw = (os.environ.get(env_key) or "").strip().lower()
    return raw or None


def _normalize_digest(raw: object) -> str | None:
    if raw is None:
        return None
    text = str(raw).strip().lower()
    if text.startswith("sha256:"):
        text = text[7:].strip()
    if not text:
        return None
    # Accept hex digests only (64 chars preferred; shorter rejected as config error upstream)
    if all(c in "0123456789abcdef" for c in text):
        return text
    return None


@lru_cache(maxsize=8)
def _load_manifest_file(path_str: str) -> dict:
    path = Path(path_str)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("weight hash manifest unreadable %s: %s", path, exc)
        return {}
    if not isinstance(data, dict):
        return {}
    return data


def clear_hash_manifest_cache() -> None:
    _load_manifest_file.cache_clear()


def _manifest_candidates() -> list[Path]:
    out: list[Path] = []
    seen: set[str] = set()

    def _push(p: Path) -> None:
        key = str(p)
        if key in seen:
            return
        seen.add(key)
        out.append(p)

    explicit = (os.environ.get("LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST") or "").strip().strip(
        '"'
    ).strip("'")
    if explicit:
        _push(Path(explicit))
    for root in model_dir_roots():
        for name in MANIFEST_BASENAMES:
            _push(root / name)
    return out


def _digest_from_manifest(family: str, weight_path: Path | None) -> str | None:
    family_u = family.upper()
    family_keys = {
        "FFSCN": ("ffscn", "FFSCN", "ffscn_sha256", "FFSCN_SHA256"),
        "SCN": ("scn", "SCN", "scn_sha256", "SCN_SHA256"),
    }.get(family_u, ())

    for manifest_path in _manifest_candidates():
        if not manifest_path.is_file():
            continue
        data = _load_manifest_file(str(manifest_path.resolve()))
        if not data:
            continue
        # Family-level keys
        for key in family_keys:
            dig = _normalize_digest(data.get(key))
            if dig:
                return dig
        # Nested {"ffscn": {"sha256": "..."}}
        nested = data.get(family_u.lower()) or data.get(family_u)
        if isinstance(nested, dict):
            dig = _normalize_digest(
                nested.get("sha256") or nested.get("hash") or nested.get("digest")
            )
            if dig:
                return dig
        # byFile / files map keyed by basename
        by_file = data.get("byFile") or data.get("files") or data.get("weights")
        if isinstance(by_file, dict) and weight_path is not None:
            dig = _normalize_digest(by_file.get(weight_path.name))
            if dig:
                return dig
            dig = _normalize_digest(by_file.get(str(weight_path)))
            if dig:
                return dig
            try:
                dig = _normalize_digest(by_file.get(str(weight_path.resolve())))
                if dig:
                    return dig
            except OSError:
                pass
        # Flat basename keys at top level
        if weight_path is not None:
            dig = _normalize_digest(data.get(weight_path.name))
            if dig:
                return dig
    return None


def expected_weight_sha(family: str, weight_path: Path | None = None) -> str | None:
    """Resolve optional expected SHA-256 for a detection family.

    Priority:
      1. LOCAL_COMPUTE_{FAMILY}_SHA256
      2. LOCAL_COMPUTE_{FAMILY}_WEIGHT_SHA256  (alias)
      3. JSON manifest under MODEL_DIR / LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST

    Returns None when no expected hash is configured (check is optional).
    """
    family_u = family.upper()
    if family_u == "FFSCN":
        env_keys = (
            "LOCAL_COMPUTE_FFSCN_SHA256",
            "LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256",
        )
    elif family_u == "SCN":
        env_keys = (
            "LOCAL_COMPUTE_SCN_SHA256",
            "LOCAL_COMPUTE_SCN_WEIGHT_SHA256",
        )
    else:
        env_keys = ()

    for key in env_keys:
        dig = _normalize_digest(os.environ.get(key) or "")
        if dig:
            return dig
    return _digest_from_manifest(family_u, weight_path)


def _is_weight_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in {".engine", ".onnx", ".pth", ".pt"}


def _collect_named(roots: list[Path], names: tuple[str, ...]) -> list[Path]:
    out: list[Path] = []
    seen: set[str] = set()
    for root in roots:
        for name in names:
            for candidate in (
                root / name,
                root / "ffscn-gui-iq-v1" / name,
                root / "scn-max-psd-v1" / name,
                root / "ffscn" / name,
                root / "scn" / name,
                root / "ffscn-gui-iq-v1" / name,
                root / "scn-max-psd-v1" / name,
                root / "weights" / name,
            ):
                key = str(candidate.resolve()) if candidate.exists() else str(candidate)
                if key in seen:
                    continue
                seen.add(key)
                out.append(candidate)
    return out


def _collect_globs(roots: list[Path], patterns: tuple[str, ...], family: str) -> list[Path]:
    out: list[Path] = []
    seen: set[str] = set()
    subdirs = ("", "ffscn-gui-iq-v1", "scn-max-psd-v1", "ffscn", "scn", "weights")
    for root in roots:
        if not root.exists():
            continue
        for sub in subdirs:
            base = root / sub if sub else root
            if not base.is_dir():
                continue
            for pat in patterns:
                for path in sorted(base.glob(pat)):
                    if not _is_weight_file(path):
                        continue
                    # Avoid cross-family pollution for ambiguous epoch_*.pth
                    name_l = path.name.lower()
                    if family == "FFSCN":
                        if name_l.startswith("scn") and "ffscn" not in name_l:
                            continue
                        # Prefer known FFSCN naming; skip classic SCN epoch_105
                        if name_l == "epoch_105.pth":
                            continue
                    if family == "SCN":
                        if "ffscn" in name_l or name_l.startswith("model_epoch"):
                            continue
                        # SCN pretrained in this repo is epoch_105.pth; skip GUI epoch_1200
                        if name_l == "epoch_1200.pth":
                            continue
                    key = str(path.resolve())
                    if key in seen:
                        continue
                    seen.add(key)
                    out.append(path)
    return out


def candidate_paths(family: str) -> list[Path]:
    """Ordered candidate weight paths for FFSCN or SCN (may be absent)."""
    family = family.upper()
    roots = model_dir_roots()
    explicit = explicit_path(
        "LOCAL_COMPUTE_FFSCN_PATH" if family == "FFSCN" else "LOCAL_COMPUTE_SCN_PATH"
    )
    ordered: list[Path] = []
    seen: set[str] = set()

    def _push(p: Path) -> None:
        key = str(p)
        if key in seen:
            return
        seen.add(key)
        ordered.append(p)

    if explicit is not None:
        _push(explicit)
    names = FFSCN_FILE_NAMES if family == "FFSCN" else SCN_FILE_NAMES
    globs = FFSCN_GLOBS if family == "FFSCN" else SCN_GLOBS
    for p in _collect_named(roots, names):
        _push(p)
    for p in _collect_globs(roots, globs, family):
        _push(p)
    return ordered


def first_present(family: str) -> Path | None:
    for p in candidate_paths(family):
        if p.is_file():
            return p
    return None


def iq_demo_dir() -> Path | None:
    """G26 IQ root: rebuild resources/sigmf_data_demo only."""
    raw = (os.environ.get("LOCAL_COMPUTE_IQ_DIR") or "").strip().strip('"').strip("'")
    candidates = []
    if raw:
        candidates.append(Path(raw))
    candidates.append(Path(r"D:/project/signal_studio_rebuild/resources/sigmf_data_demo"))
    for p in candidates:
        if p.is_dir():
            return p
    return None



def source_home(family: str) -> Path | None:
    """Architecture / pipeline source tree for imports."""
    family = family.upper()
    env_key = "LOCAL_COMPUTE_FFSCN_HOME" if family == "FFSCN" else "LOCAL_COMPUTE_SCN_HOME"
    raw = (os.environ.get(env_key) or "").strip().strip('"').strip("'")
    # No default outside signal_studio_rebuild. Operators set HOME only when
    # a runtime inside that tree actually needs it. .engine readiness is decided by TensorRT probe, not this helper.
    if not raw:
        return None
    path = Path(raw)
    return path if path.is_dir() else None


def model_search_root_strings() -> list[str]:
    roots: list[str] = []
    for d in model_dir_roots():
        roots.append(str(d.resolve()) if d.exists() else str(d))
    for env_key in ("LOCAL_COMPUTE_FFSCN_PATH", "LOCAL_COMPUTE_SCN_PATH"):
        p = explicit_path(env_key)
        if p is not None:
            parent = str(p.parent)
            if parent not in roots:
                roots.append(parent)
    return roots
