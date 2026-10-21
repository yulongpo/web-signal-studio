# M-09 FFSCN/SCN detection + degradation

| Field | Value |
|-------|--------|
| Owner | Bot-E |
| Matrix | M-09 |
| Status | **WIP** — awaiting QA |
| `matrix_pass_claimed` | **false** (every JSON in this directory) |
| Baseline (synced `origin/main`) | `8c7c4db21b15bbd0244494f3930239db9c00292b` |
| Service version under test | `0.1.6-m09-degrade` |
| Acceptance action | Do **not** flip M-09 to PASS from this pack |

Replay: `services/local-compute/scripts/collect_m09_evidence.py` with `LOCAL_COMPUTE_DISABLE_TORCH=1` (same switch as the contract pytest suite). This environment has no NVIDIA GPU and no PyTorch, so live CUDA forward was not run and no detection candidates were produced.

## Already on main before this pack

FastAPI `GET /capabilities`, task create / progress / cancel, stub worker `STUB_NON_TENSORRT`, real PyTorch FFSCN/SCN path (`start_detection_worker` when `family_ready`), and `WEIGHT_HASH` / `WEIGHT_HASH_MISMATCH` via `LOCAL_COMPUTE_MODEL_DIR` plus SHA-256 env or `weights.sha256.json`. Live weight tests stay `skip-if-missing`.

## Added here

- `.engine` / `.onnx` are explicit **N/A**: `uiMessages` `TENSORRT_NA` / `ONNX_NA`, `detection.ffscn` / `detection.scn` stay false, smoke-load is not called, task `result` stays null.
- This evidence directory, captured from the FastAPI test client (not hand-written scores).

## Observed on this machine

| Probe | Result |
|-------|--------|
| `GET /capabilities` | `ffscn=false`, `scn=false`, `runtime.engine=STUB_NON_TENSORRT`, `canInventResults=false`, `gpu.uiCode=GPU_MISSING` |
| ui codes (no model) | `MODEL_MISSING_FFSCN`, `MODEL_MISSING_SCN`, `GPU_MISSING`, `TORCH_MISSING`, `STUB_RUNTIME`, `NO_FAKE_INFERENCE` |
| `ffscn.detect` with no weights | status `BLOCKED`, `result=null` |
| cancel exact `runId` while `running` | status `cancelled`, `result=null` (does not flip to BLOCKED) |
| `LOCAL_COMPUTE_MODEL_DIR` + wrong `LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256` | `ffscn=false`, codes `MODEL_HASH_MISMATCH` and `WEIGHT_HASH_MISMATCH` |
| placeholder `ffscn.engine` (not a real engine) | codes include `TENSORRT_NA`; task `BLOCKED`, `result=null` |
| torch | `ModuleNotFoundError` |
| `nvidia-smi` | missing |
| pytest | **59 passed, 4 skipped** (`m09_pytest_2026-10-21.txt`). Skips are live CUDA/weight smokes. `LOCAL_COMPUTE_DISABLE_TORCH=1` stays on for the contract suite. |

## Files

- `m09_environment_2026-10-21.json`
- `m09_capabilities_degrade_2026-10-21.json`
- `m09_blocked_no_model_2026-10-21.json`
- `m09_cancel_2026-10-21.json`
- `m09_weight_hash_mismatch_2026-10-21.json`
- `m09_tensorrt_na_2026-10-21.json`
- `m09_pytest_2026-10-21.txt`
- `m09_summary_2026-10-21.json`

## Still BLOCKED (not a fake pass)

- No GPU and no mounted FFSCN/SCN `.pth` or algorithm HOME, so real `PYTORCH_CUDA` forward was not executed.
- TensorRT `.engine` runtime is not wired.
- ONNX runtime is not wired.
- QA owns any matrix PASS. This pack does not claim one.
