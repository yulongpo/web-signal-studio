# Reference model inventory

**Scope:** local smoke paths for Web Signal Studio local-compute.  
**Hard rule:** never fabricate FFSCN/SCN candidates. `.engine` is `TENSORRT_NA`
until a TensorRT runtime is wired.

Assets below are the desktop rebuild tree only
(`D:\project\signal_studio_rebuild`, `yulongpo/signal_studio` @
`rebuild/a143-native`). This inventory does not point outside that tree.

## Engines (release_bin)

| Family | File | Role today |
|--------|------|------------|
| FFSCN | `out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\ffscn_epoch1200_dynamic_fp32.engine` | Discovered if `LOCAL_COMPUTE_MODEL_DIR` or `LOCAL_COMPUTE_FFSCN_PATH` is set. Capabilities stay false with `TENSORRT_NA`. Not loaded. |
| SCN | `out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine` | Same, via `LOCAL_COMPUTE_SCN_PATH` or `MODEL_DIR`. `TENSORRT_NA` / `BLOCKED`. Not loaded. |

`LOCAL_COMPUTE_MODEL_DIR` =
`D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models`.

Desktop-published SHA-256 (rebuild `docs/implementation/wideband-detection/R6/MODEL_DEPLOYMENT.md`; not re-measured here):

- FFSCN `4e14e422e7966eb6f554e322c2d390534650e1b8dd0cee6e04f2ed4305cefc03`
- SCN `ae89d04332758d466846b71afc849c446500a82a8bd74fd8c671927247746627`

## IQ

`D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-data`  
with `0000000.sigmf-meta` and `0000000.json` when present.

## Gaps

1. No TensorRT runtime in this service. Pointing at the engines does not enable detection.
2. Without those files, torch, or a source path, tasks stay **BLOCKED** and must not invent candidates.
3. Do not copy the engine blobs into the web repo.
