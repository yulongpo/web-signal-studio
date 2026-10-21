"""Model directory layout + weight discovery for local-compute.

Primary env: LOCAL_COMPUTE_MODEL_DIR (single root).
Also accepted: LOCAL_COMPUTE_MODEL_DIRS (;-separated), plus
LOCAL_COMPUTE_FFSCN_PATH / LOCAL_COMPUTE_SCN_PATH for explicit files.

Expected layout under MODEL_DIR (any subset is fine):

  <MODEL_DIR>/
    ffscn.engine | ffscn.onnx | ffscn.pth | model_epoch_*.pth | epoch_*.pth
    scn.engine   | scn.onnx   | scn.pth   | epoch_*.pth
    ffscn/ ...
    scn/ ...

Reference trees (read-only on this workstation):
  D:\\project\\FFSCN_train2\\weights\\model_epoch_0210.pth
  D:\\project\\FFSCN_train2\\FFSCN_TEST_GUI\\config\\epoch_1200.pth
  D:\\project\\train_SCN\\SCN_pretrained\\epoch_105.pth

Point LOCAL_COMPUTE_MODEL_DIR at a folder that contains (or is) those
weights, or set LOCAL_COMPUTE_FFSCN_PATH / LOCAL_COMPUTE_SCN_PATH directly.
Source trees for architecture imports:
  LOCAL_COMPUTE_FFSCN_HOME  (default probe: D:\\project\\FFSCN_train2\\FFSCN_TEST_GUI)
  LOCAL_COMPUTE_SCN_HOME    (default probe: D:\\project\\train_SCN)
"""

from __future__ import annotations

import os
from pathlib import Path

FFSCN_FILE_NAMES = (
    "ffscn.engine",
    "ffscn.onnx",
    "ffscn.pth",
    "FFSCN.engine",
    "FFSCN.pth",
    "model_epoch_0210.pth",
    "epoch_1200.pth",
)
SCN_FILE_NAMES = (
    "scn.engine",
    "scn.onnx",
    "scn.pth",
    "SCN.engine",
    "SCN.pth",
    "epoch_105.pth",
)

FFSCN_GLOBS = ("ffscn*.pth", "FFSCN*.pth", "model_epoch_*.pth", "epoch_*.pth")
SCN_GLOBS = ("scn*.pth", "SCN*.pth", "epoch_*.pth")


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
    raw = (os.environ.get(env_key) or "").strip().lower()
    return raw or None


def _is_weight_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in {".engine", ".onnx", ".pth", ".pt"}


def _collect_named(roots: list[Path], names: tuple[str, ...]) -> list[Path]:
    out: list[Path] = []
    seen: set[str] = set()
    for root in roots:
        for name in names:
            for candidate in (
                root / name,
                root / "ffscn" / name,
                root / "scn" / name,
                root / "weights" / name,
                root / "SCN_pretrained" / name,
                root / "config" / name,
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
    subdirs = ("", "ffscn", "scn", "weights", "SCN_pretrained", "config")
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


def source_home(family: str) -> Path | None:
    """Architecture / pipeline source tree for imports."""
    family = family.upper()
    env_key = "LOCAL_COMPUTE_FFSCN_HOME" if family == "FFSCN" else "LOCAL_COMPUTE_SCN_HOME"
    raw = (os.environ.get(env_key) or "").strip().strip('"').strip("'")
    defaults = (
        [
            Path(r"D:\project\FFSCN_train2\FFSCN_TEST_GUI"),
            Path(r"D:\project\FFSCN_train2"),
        ]
        if family == "FFSCN"
        else [
            Path(r"D:\project\train_SCN"),
        ]
    )
    candidates = [Path(raw)] if raw else []
    candidates.extend(defaults)
    for p in candidates:
        if p.is_dir():
            return p
    return None


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
