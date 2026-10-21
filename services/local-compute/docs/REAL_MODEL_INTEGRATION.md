# Real model integration notes

Local smoke paths are **only** inside the desktop rebuild tree
(`yulongpo/signal_studio` @ `rebuild/a143-native`, on this workstation
`D:\project\signal_studio_rebuild`). Do not point `LOCAL_COMPUTE_*` at any
other weight or IQ tree.

`.engine` files are **not** a live detector here. `GET /capabilities` keeps
`detection.ffscn` / `detection.scn` **false**, adds `uiMessages` code
`TENSORRT_NA`, and the task worker finishes `BLOCKED` with no candidates
until a TensorRT runtime is wired.

## Canonical paths

| Env | Path |
|-----|------|
| `LOCAL_COMPUTE_MODEL_DIR` | `D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models` |
| `LOCAL_COMPUTE_FFSCN_PATH` | `D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\ffscn_epoch1200_dynamic_fp32.engine` |
| `LOCAL_COMPUTE_SCN_PATH` | `D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine` |

IQ for a local open/smoke (pair the meta, and the `.json` sidecar when present):

- `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-data`
- `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-meta`
- `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.json`

`LOCAL_COMPUTE_FFSCN_HOME` / `LOCAL_COMPUTE_SCN_HOME` have **no** default
outside that tree. Leave them unset unless a runtime inside
`signal_studio_rebuild` needs them.

Desktop-published engine identities (from the rebuild tree's
`docs/implementation/wideband-detection/R6/MODEL_DEPLOYMENT.md`; this repo
does not re-hash or load the blobs):

| Engine | SHA-256 |
|--------|---------|
| `ffscn_epoch1200_dynamic_fp32.engine` | `4e14e422e7966eb6f554e322c2d390534650e1b8dd0cee6e04f2ed4305cefc03` |
| `scn_model.engine` | `ae89d04332758d466846b71afc849c446500a82a8bd74fd8c671927247746627` |

## Smoke env (does not enable detection)

```powershell
$env:LOCAL_COMPUTE_MODEL_DIR = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models'
$env:LOCAL_COMPUTE_FFSCN_PATH = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\ffscn_epoch1200_dynamic_fp32.engine'
$env:LOCAL_COMPUTE_SCN_PATH = 'D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine'
```

Expect `TENSORRT_NA` and `BLOCKED`. Do not treat a capabilities probe as a
successful FFSCN/SCN run.

## Other env

| Env | Meaning |
|-----|---------|
| `LOCAL_COMPUTE_MODEL_DIRS` | Extra roots (`;` / `,` separated), still under the rebuild tree |
| `LOCAL_COMPUTE_FFSCN_SHA256` / `LOCAL_COMPUTE_SCN_SHA256` | Optional expected SHA-256 (mismatch → `WEIGHT_HASH_MISMATCH`) |
| `LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256` / `LOCAL_COMPUTE_SCN_WEIGHT_SHA256` | Aliases of the above |
| `LOCAL_COMPUTE_WEIGHT_HASH_MANIFEST` | Optional JSON; also probes `<MODEL_DIR>/weights.sha256.json` |
| `LOCAL_COMPUTE_DISABLE_TORCH` | `1` to force the stub path (contract tests) |

## TensorRT status

Selecting a `.engine` or `.onnx` file does **not** smoke-load and does **not**
return candidates. ONNX uses `ONNX_NA` the same way. There is no live detect
claim for these engines in the web local-compute service.

## `POST /tasks`

- Ready families may return candidates only when `verifiedForward` is true and
  the engine label is a real runtime label. That does not happen for `.engine`
  today.
- Missing `sourcePath` → `BLOCKED` / `SOURCE_MISSING`, no candidates.
- Not ready → `BLOCKED`, no invented scores.

SigMF smoke input, when a task is attempted, is the `0000000` pair above.
The service still blocks on `TENSORRT_NA` before any forward.
