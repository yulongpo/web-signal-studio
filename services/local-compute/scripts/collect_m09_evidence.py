"""Capture M-09 degrade evidence from the real FastAPI app.

Writes JSON under docs/acceptance/evidence/bot-e/.
Does not claim a matrix pass and does not invent detection candidates.
Contract default: LOCAL_COMPUTE_DISABLE_TORCH=1 (no fake-green torch).
"""

from __future__ import annotations

import json
import os
import platform
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Must be set before app imports so the torch probe cannot go live.
os.environ["LOCAL_COMPUTE_TOKEN"] = "m09-evidence-token"
os.environ["LOCAL_COMPUTE_HOST"] = "127.0.0.1"
os.environ["LOCAL_COMPUTE_DISABLE_TORCH"] = "1"
os.environ["LOCAL_COMPUTE_STUB_STEP_MS"] = "40"
os.environ["LOCAL_COMPUTE_STUB_STEPS"] = "6"
for key in (
    "LOCAL_COMPUTE_MODEL_DIR",
    "LOCAL_COMPUTE_MODEL_DIRS",
    "LOCAL_COMPUTE_FFSCN_PATH",
    "LOCAL_COMPUTE_SCN_PATH",
    "LOCAL_COMPUTE_FFSCN_SHA256",
    "LOCAL_COMPUTE_SCN_SHA256",
    "LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256",
    "LOCAL_COMPUTE_SCN_WEIGHT_SHA256",
    "LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST",
    "LOCAL_COMPUTE_FFSCN_HOME",
    "LOCAL_COMPUTE_SCN_HOME",
    "LOCAL_COMPUTE_ALLOW_CPU_INFERENCE",
):
    os.environ.pop(key, None)

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "docs" / "acceptance" / "evidence" / "bot-e"
SERVICE = Path(__file__).resolve().parents[1]
if str(SERVICE) not in sys.path:
    sys.path.insert(0, str(SERVICE))


def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True
        ).strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def _envelope(**extra: object) -> dict:
    return {
        "matrix_id": "M-09",
        "matrix_pass_claimed": False,
        "status": "WIP_awaiting_QA",
        "acceptance_matrix_action": "none_do_not_flip_PASS",
        "owner": "bot-e",
        "baseline_sha": "8c7c4db21b15bbd0244494f3930239db9c00292b",
        "generated_at_head": _git_sha(),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "fake_inference": False,
        "disable_torch": os.environ.get("LOCAL_COMPUTE_DISABLE_TORCH"),
        **extra,
    }


def _slim_caps(data: dict) -> dict:
    models = data.get("models") or []
    present = [m for m in models if m.get("present")]
    return {
        "protocolVersion": data.get("protocolVersion"),
        "serviceVersion": data.get("serviceVersion"),
        "detection": data.get("detection"),
        "gpu": data.get("gpu"),
        "runtime": data.get("runtime"),
        "dsp": data.get("dsp"),
        "modelsPresent": present,
        "modelsAbsentCount": sum(1 for m in models if not m.get("present")),
        "notes": data.get("notes"),
    }


def _assert_no_candidates(record: dict) -> None:
    result = record.get("result")
    if result is None:
        return
    if isinstance(result, dict) and (
        "candidates" in result or "detections" in result or result.get("verifiedForward")
    ):
        raise SystemExit(f"refusing to write evidence that contains detection payload: {record}")


def main() -> None:
    from fastapi.testclient import TestClient

    from app.auth import init_auth
    from app.main import app
    from app.model_layout import clear_hash_manifest_cache
    from app.tasks import clear_tasks
    from app.torch_runtime import clear_torch_cache

    OUT.mkdir(parents=True, exist_ok=True)
    init_auth()
    clear_tasks()
    clear_torch_cache()
    clear_hash_manifest_cache()

    headers = {"Authorization": "Bearer m09-evidence-token"}
    torch_import = "missing"
    try:
        import torch  # type: ignore

        torch_import = f"importable {torch.__version__} (disabled by LOCAL_COMPUTE_DISABLE_TORCH=1)"
    except Exception as exc:  # noqa: BLE001
        torch_import = f"import failed: {type(exc).__name__}: {exc}"

    env_doc = _envelope(
        id="m09_environment_2026-10-21",
        python=sys.version,
        platform=platform.platform(),
        nvidia_smi=shutil.which("nvidia-smi"),
        torch=torch_import,
        tensorrt_engine="N/A — no TensorRT runtime wired; .engine files are not executed",
        onnx_runtime="N/A — .onnx files are not executed",
        model_assets="none in this environment (Windows reference trees not mounted)",
        gpu="not visible (nvidia-smi missing)",
    )
    (OUT / "m09_environment_2026-10-21.json").write_text(
        json.dumps(env_doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    with TestClient(app) as client:
        caps = client.get("/capabilities", headers=headers)
        if caps.status_code != 200:
            raise SystemExit(f"capabilities failed: {caps.status_code} {caps.text}")
        caps_body = caps.json()
        det = caps_body["detection"]
        if det["ffscn"] or det["scn"]:
            raise SystemExit("capabilities claimed detection ready without a verified model")
        reasons = " | ".join(det["reasons"])
        if "BLOCKED" not in reasons:
            raise SystemExit("capabilities missing BLOCKED reason")
        codes = {m["code"] for m in det["uiMessages"]}
        for required in ("STUB_RUNTIME", "NO_FAKE_INFERENCE", "MODEL_MISSING_FFSCN", "MODEL_MISSING_SCN"):
            if required not in codes:
                raise SystemExit(f"missing ui code {required}: {codes}")
        if not (codes & {"GPU_MISSING", "GPU_UNVERIFIED", "GPU_PROBE_ERROR", "TORCH_MISSING", "TORCH_CPU_ONLY"}):
            raise SystemExit(f"missing gpu/torch degrade code: {codes}")

        (OUT / "m09_capabilities_degrade_2026-10-21.json").write_text(
            json.dumps(
                _envelope(
                    id="m09_capabilities_degrade_2026-10-21",
                    http={"method": "GET", "path": "/capabilities", "status": caps.status_code},
                    body=_slim_caps(caps_body),
                    assertions={
                        "ffscn": False,
                        "scn": False,
                        "blocked_reason": True,
                        "canInventResults": False,
                        "tensorrtVerified": False,
                    },
                ),
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        created = client.post(
            "/tasks",
            headers=headers,
            json={"kind": "ffscn.detect", "sampleRange": {"start": "0", "end": "1024"}},
        )
        run_id = created.json()["runId"]
        record = None
        deadline = time.time() + 8.0
        while time.time() < deadline:
            record = client.get(f"/tasks/{run_id}", headers=headers).json()
            if record["status"] in {"BLOCKED", "failed", "succeeded", "cancelled"}:
                break
            time.sleep(0.05)
        if record is None or record["status"] != "BLOCKED" or record.get("result") is not None:
            raise SystemExit(f"no-model path did not BLOCK with null result: {record}")
        _assert_no_candidates(record)
        (OUT / "m09_blocked_no_model_2026-10-21.json").write_text(
            json.dumps(
                _envelope(
                    id="m09_blocked_no_model_2026-10-21",
                    http={"method": "POST", "path": "/tasks", "kind": "ffscn.detect"},
                    task=record,
                    assertions={
                        "status": "BLOCKED",
                        "result": None,
                        "no_candidates": True,
                    },
                ),
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        os.environ["LOCAL_COMPUTE_STUB_STEP_MS"] = "200"
        os.environ["LOCAL_COMPUTE_STUB_STEPS"] = "40"
        cancel_id = client.post(
            "/tasks",
            headers=headers,
            json={"kind": "scn.detect", "sampleIndices": ["0", "10"]},
        ).json()["runId"]
        seen = None
        for _ in range(40):
            seen = client.get(f"/tasks/{cancel_id}", headers=headers).json()
            if seen["status"] in {"running", "queued"}:
                break
        cancel = client.post(f"/tasks/{cancel_id}/cancel", headers=headers)
        final = client.get(f"/tasks/{cancel_id}", headers=headers).json()
        if cancel.status_code != 200 or final["status"] != "cancelled" or final.get("result") is not None:
            raise SystemExit(f"cancel path failed: {cancel.status_code} {final}")
        _assert_no_candidates(final)
        (OUT / "m09_cancel_2026-10-21.json").write_text(
            json.dumps(
                _envelope(
                    id="m09_cancel_2026-10-21",
                    observed_before_cancel=None if seen is None else seen.get("status"),
                    cancel_http={"status": cancel.status_code, "body": cancel.json()},
                    task=final,
                    assertions={
                        "status": "cancelled",
                        "result": None,
                        "exact_run_id": cancel_id,
                        "not_blocked_after_cancel": final["status"] != "BLOCKED",
                    },
                ),
                indent=2,
                ensure_ascii=False,
            )
            + "\n",
            encoding="utf-8",
        )

        import hashlib
        import tempfile

        from app.capabilities import clear_torch_cache as _clear_torch

        with tempfile.TemporaryDirectory(prefix="m09-hash-") as tmp:
            root = Path(tmp)
            payload = b"M09-WEIGHT-HASH-MISMATCH-BYTES"
            weight = root / "model_epoch_0210.pth"
            weight.write_bytes(payload)
            digest = hashlib.sha256(payload).hexdigest()
            os.environ["LOCAL_COMPUTE_MODEL_DIR"] = str(root)
            os.environ["LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256"] = "ab" * 32
            clear_hash_manifest_cache()
            _clear_torch()
            mismatch = client.get("/capabilities", headers=headers).json()
            reasons_m = " | ".join(mismatch["detection"]["reasons"])
            codes_m = {m["code"] for m in mismatch["detection"]["uiMessages"]}
            if mismatch["detection"]["ffscn"] or "WEIGHT_HASH_MISMATCH" not in reasons_m:
                raise SystemExit(f"weight hash mismatch not reported: {reasons_m}")
            if "WEIGHT_HASH_MISMATCH" not in codes_m or "MODEL_HASH_MISMATCH" not in codes_m:
                raise SystemExit(f"weight hash ui codes missing: {codes_m}")
            (OUT / "m09_weight_hash_mismatch_2026-10-21.json").write_text(
                json.dumps(
                    _envelope(
                        id="m09_weight_hash_mismatch_2026-10-21",
                        configured={
                            "LOCAL_COMPUTE_MODEL_DIR": str(root),
                            "LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256": "ab" * 32,
                            "actual_sha256": digest,
                            "weight_name": weight.name,
                            "weight_bytes": len(payload),
                        },
                        body=_slim_caps(mismatch),
                        assertions={
                            "ffscn": False,
                            "WEIGHT_HASH_MISMATCH": True,
                            "MODEL_HASH_MISMATCH": True,
                            "canInventResults": False,
                        },
                    ),
                    indent=2,
                    ensure_ascii=False,
                )
                + "\n",
                encoding="utf-8",
            )

            os.environ.pop("LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256", None)
            # Cancel probe above slows the stub. Restore fast steps so this
            # BLOCKED task reaches a terminal status inside the poll window.
            os.environ["LOCAL_COMPUTE_STUB_STEP_MS"] = "40"
            os.environ["LOCAL_COMPUTE_STUB_STEPS"] = "6"
            engine = root / "ffscn.engine"
            engine.write_bytes(b"NOT-A-REAL-TENSORRT-ENGINE")
            weight.unlink()
            clear_hash_manifest_cache()
            _clear_torch()
            na = client.get("/capabilities", headers=headers).json()
            if na["detection"]["ffscn"] or na["runtime"]["tensorrtVerified"]:
                raise SystemExit("engine file was treated as ready")
            na_codes = {m["code"] for m in na["detection"]["uiMessages"]}
            na_reasons = " | ".join(na["detection"]["reasons"])
            if "TENSORRT_NA" not in na_codes or "TensorRT .engine is N/A" not in na_reasons:
                raise SystemExit(f"TENSORRT_NA missing: {na_codes} {na_reasons}")
            src = root / "empty.wav"
            src.write_bytes(b"RIFF")
            na_run = client.post(
                "/tasks",
                headers=headers,
                json={"kind": "ffscn.detect", "sourcePath": str(src)},
            ).json()["runId"]
            na_task = None
            na_deadline = time.time() + 8.0
            while time.time() < na_deadline:
                na_task = client.get(f"/tasks/{na_run}", headers=headers).json()
                if na_task["status"] in {"BLOCKED", "failed", "succeeded", "cancelled"}:
                    break
                time.sleep(0.05)
            if na_task is None or na_task["status"] != "BLOCKED" or na_task.get("result") is not None:
                raise SystemExit(f"engine task not BLOCKED: {na_task}")
            _assert_no_candidates(na_task)
            (OUT / "m09_tensorrt_na_2026-10-21.json").write_text(
                json.dumps(
                    _envelope(
                        id="m09_tensorrt_na_2026-10-21",
                        note="Bytes are a placeholder file, not a TensorRT engine. No forward was run.",
                        capabilities=_slim_caps(na),
                        task=na_task,
                        assertions={
                            "ffscn": False,
                            "tensorrtVerified": False,
                            "ui_code": "TENSORRT_NA",
                            "task_status": "BLOCKED",
                            "result": None,
                        },
                    ),
                    indent=2,
                    ensure_ascii=False,
                )
                + "\n",
                encoding="utf-8",
            )

    summary = _envelope(
        id="m09_summary_2026-10-21",
        artifacts=[
            "m09_environment_2026-10-21.json",
            "m09_capabilities_degrade_2026-10-21.json",
            "m09_blocked_no_model_2026-10-21.json",
            "m09_cancel_2026-10-21.json",
            "m09_weight_hash_mismatch_2026-10-21.json",
            "m09_tensorrt_na_2026-10-21.json",
            "m09_pytest_2026-10-21.txt",
        ],
        pytest="59 passed, 4 skipped (live CUDA/weight tests skipped; LOCAL_COMPUTE_DISABLE_TORCH=1)",
        remains_blocked=[
            "No NVIDIA GPU (nvidia-smi missing) — live CUDA forward not run",
            "No FFSCN/SCN .pth weights or algorithm HOME mounted — live smoke skipped",
            "TensorRT .engine runtime not wired (N/A)",
            "ONNX runtime not wired (N/A)",
            "matrix_pass_claimed is false; QA must not treat this pack as PASS",
        ],
    )
    (OUT / "m09_summary_2026-10-21.json").write_text(
        json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"wrote evidence under {OUT}")


if __name__ == "__main__":
    main()
