# Engine identity hashes (desktop package, not a live load)

Do not commit `.engine` binaries. Local-compute does **not** load these files
(`TENSORRT_NA` / `BLOCKED`) until a TensorRT runtime exists.

Hashes below are the identities published in the desktop rebuild tree
`docs/implementation/wideband-detection/R6/MODEL_DEPLOYMENT.md`. This workspace
did not re-hash the blobs.

| Role | Path under `D:\project\signal_studio_rebuild` | sha256 |
|------|-----------------------------------------------|--------|
| FFSCN | `out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\ffscn_epoch1200_dynamic_fp32.engine` | `4e14e422e7966eb6f554e322c2d390534650e1b8dd0cee6e04f2ed4305cefc03` |
| SCN | `out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine` | `ae89d04332758d466846b71afc849c446500a82a8bd74fd8c671927247746627` |

IQ smoke pair (no weight hash): `resources\sigmf_data_demo\0000000.sigmf-data`
plus `.sigmf-meta` / `.json`.

Optional pin once a runtime exists (today a matching hash still does not enable detect):

```text
LOCAL_COMPUTE_MODEL_DIR=D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models
LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256=4e14e422e7966eb6f554e322c2d390534650e1b8dd0cee6e04f2ed4305cefc03
LOCAL_COMPUTE_SCN_WEIGHT_SHA256=ae89d04332758d466846b71afc849c446500a82a8bd74fd8c671927247746627
```

Mismatch → `WEIGHT_HASH_MISMATCH` and `BLOCKED`. Never fabricate inference.
