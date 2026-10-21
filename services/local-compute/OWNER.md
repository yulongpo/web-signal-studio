# Bot-E ownership — local-compute

- Owner: Bot-E (detection + local compute)
- Protocol: docs/architecture/WEB_NATIVE_PROTOCOL.md v0.1.0
- Contract: services/local-compute/docs/DETECTION_PAGE_CONTRACT.md
- Hard rule: never fabricate FFSCN/SCN inference results

## Status (0.1.6-m09-degrade)

- Real PyTorch FFSCN/SCN worker when family_ready (verified load + smoke forward)
- No model / no GPU / `LOCAL_COMPUTE_DISABLE_TORCH=1` → explicit BLOCKED, no candidates
- `WEIGHT_HASH` / `WEIGHT_HASH_MISMATCH` via `LOCAL_COMPUTE_MODEL_DIR` + SHA-256 env/manifest
- TensorRT `.engine` and ONNX are N/A (`TENSORRT_NA` / `ONNX_NA`); never smoke-loaded
- M-09 evidence: `docs/acceptance/evidence/bot-e/` with `matrix_pass_claimed: false`
