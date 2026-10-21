# Real model integration notes (Bot-B / operators)

## Weight path convention

| Env | Meaning |
|-----|---------|
| `LOCAL_COMPUTE_MODEL_DIR` | Primary search root (preferred) |
| `LOCAL_COMPUTE_MODEL_DIRS` | Extra roots (`;` / `,` separated) |
| `LOCAL_COMPUTE_FFSCN_PATH` | Explicit FFSCN weight file (**.pth**; TensorRT `.engine` **N/A** for current reference trees) |
| `LOCAL_COMPUTE_SCN_PATH` | Explicit SCN weight file (**.pth**) |
| `LOCAL_COMPUTE_FFSCN_SHA256` / `LOCAL_COMPUTE_SCN_SHA256` | Optional expected SHA-256 (mismatch → `BLOCKED: WEIGHT_HASH_MISMATCH`) |
| `LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256` / `LOCAL_COMPUTE_SCN_WEIGHT_SHA256` | Aliases of the above |
| `LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST` | Optional JSON path; default also probes `<MODEL_DIR>/weights.sha256.json` |
| `LOCAL_COMPUTE_FFSCN_HOME` | Algorithm tree (default probe: `D:\project\FFSCN_train2\FFSCN_TEST_GUI`) |
| `LOCAL_COMPUTE_SCN_HOME` | Algorithm tree (default probe: `D:\project\train_SCN`) |
| `LOCAL_COMPUTE_ALLOW_CPU_INFERENCE` | `1` to allow ready=true on CPU torch (default requires CUDA) |
| `LOCAL_COMPUTE_DISABLE_TORCH` | `1` to force stub (tests) |

Suggested workstation layout:

```text
LOCAL_COMPUTE_MODEL_DIR=D:\project\_models\local-compute
  ffscn\model_epoch_0210.pth   # or set LOCAL_COMPUTE_FFSCN_PATH
  scn\epoch_105.pth            # or set LOCAL_COMPUTE_SCN_PATH
```

Or point paths straight at the reference trees (read-only):

```powershell
$env:LOCAL_COMPUTE_FFSCN_PATH = 'D:\project\FFSCN_train2\weights\model_epoch_0210.pth'
$env:LOCAL_COMPUTE_SCN_PATH   = 'D:\project\train_SCN\SCN_pretrained\epoch_105.pth'
$env:LOCAL_COMPUTE_FFSCN_HOME = 'D:\project\FFSCN_train2\FFSCN_TEST_GUI'
$env:LOCAL_COMPUTE_SCN_HOME   = 'D:\project\train_SCN'
```


## Optional weight hash hardening

Expected SHA-256 is **optional**. When unset, capabilities still probe/load (subject to torch/HOME/CUDA). When set (env or JSON), a mismatch keeps `detection.ffscn` / `detection.scn` **false**, emits `uiMessages` codes `MODEL_HASH_MISMATCH` + `WEIGHT_HASH_MISMATCH`, and **never** runs smoke forward / invents candidates.

Manifest example (`<MODEL_DIR>/weights.sha256.json`):

```json
{
  "ffscn": "<64-hex>",
  "scn": "<64-hex>",
  "byFile": {
    "model_epoch_0210.pth": "<64-hex>",
    "epoch_105.pth": "<64-hex>"
  }
}
```

Priority: `LOCAL_COMPUTE_*_SHA256` → `LOCAL_COMPUTE_*_WEIGHT_SHA256` → manifest family key → `byFile` basename.

## TensorRT / `.engine` status

**N/A for current reference trees** (`train_SCN`, `FFSCN_train2`). Do **not** invent or stub a fake `.engine` path. Real readiness today is **PyTorch `.pth` + verified load/forward**. A future TensorRT export would be a separate package.

If the selected weight file is `.engine` or `.onnx`, `GET /capabilities` keeps `detection.ffscn` / `detection.scn` **false**, adds `uiMessages` code `TENSORRT_NA` or `ONNX_NA`, and **does not** smoke-load or return candidates. The task worker stays on the stub path and finishes `BLOCKED`.

## License summary

No SPDX LICENSE files were found under `train_SCN` or `FFSCN_train2`. Treat weights and algorithm sources as **internal project IP**. Do not publish weights to the public web app bundle; keep them on the operator machine and configure paths locally.

## How readiness works

`GET /capabilities`:

- `detection.ffscn` / `detection.scn` become `true` **only** after:
  1. weight file present,
  2. optional expected SHA-256 matches when configured (else skip),
  3. PyTorch importable,
  4. CUDA available (unless `LOCAL_COMPUTE_ALLOW_CPU_INFERENCE=1`),
  5. algorithm HOME importable,
  6. load + smoke forward succeeds.
- Otherwise reasons/uiMessages stay BLOCKED (`MODEL_*`, `TORCH_*`, `STUB_RUNTIME`, `NO_FAKE_INFERENCE`, …).

## `POST /tasks` (Bot-B)

- When the family is ready **and** `sourcePath` is a readable file, the worker runs **real** inference and may return `result.candidates` with `verifiedForward: true` and `engine: PYTORCH_CUDA|PYTORCH_CPU`.
- If ready but `sourcePath` missing/invalid → status `BLOCKED`, `uiMessages` include `SOURCE_MISSING`, **no candidates**.
- If not ready → stub path ends `BLOCKED` (unchanged policy: no fake scores).

### SCN source

- Prefer `.ptpsd` PSDSample files (as in `train_SCN/datas`).

### FFSCN source

- `.wav` (stereo int16 I/Q), or IQ/PSD formats supported by `FFSCN_TEST_GUI`.

## Starting the service for real inference

Use the CUDA Python that already works for the GUI:

```powershell
cd D:\project\_wt_bot_e_local_compute\services\local-compute
$env:LOCAL_COMPUTE_TOKEN = 'dev-token-change-me'
$env:LOCAL_COMPUTE_FFSCN_PATH = 'D:\project\FFSCN_train2\weights\model_epoch_0210.pth'
$env:LOCAL_COMPUTE_SCN_PATH   = 'D:\project\train_SCN\SCN_pretrained\epoch_105.pth'
& 'D:\profiles\anaconda\python.exe' -m pip install -r requirements.txt
& 'D:\profiles\anaconda\python.exe' -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Contract tests still run in the lightweight `.venv` **without** torch and must stay green without inventing detection.

## FFSCN full-file E2E

- Pytest: `tests/test_ffscn_e2e.py` (skip-if-missing for CUDA/weights).
- Fixture: `tests/fixtures/synthetic_iq_stereo.wav` (16-bit stereo I/Q).
- `STUB_RUNTIME` copy must stay aligned with Bot-B `gating.test.ts` / `LOCAL_COMPUTE_STUB_RUNTIME_COPY`.
- Never fabricate candidates to pass; live success requires `verifiedForward=true`.


## Expected-hash samples

See [WEIGHT_HASH_SAMPLES.md](./WEIGHT_HASH_SAMPLES.md) and [weights.sha256.example.json](./weights.sha256.example.json) (hashes only; no weight binaries).

