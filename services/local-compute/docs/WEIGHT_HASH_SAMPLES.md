# Expected weight SHA-256 samples (local reference trees)

**Do not commit `.pth` / `.engine` binaries.** This file only records hashes measured on the operator machine for optional `WEIGHT_HASH` gates.

Measured: 2026-10-21 (Asia/Shanghai) on HH-laptop reference paths. TensorRT `.engine`: **N/A** (not present in these trees).

## Recommended pins (common release weights)

| Role | Local path (example) | bytes | sha256 |
|------|----------------------|------:|--------|
| SCN | `D:\project\train_SCN\SCN_pretrained\epoch_105.pth` | 29554583 | `9453eb47576606b062ad7d1d3afb6ad4d8680312a71e02e90f440ff1f99b9da0` |
| FFSCN | `D:\project\FFSCN_train2\weights\model_epoch_0210.pth` | 11079751 | `b6cd6aaf28e695b4bcae94db25dd527d2b717269b1562cf47e0840d09d8a253a` |

Same FFSCN hash also seen at:
- `...\deliverables\ffscn_release_20260908\FFSCN_60MHz_package\weights\model_epoch_0210.pth`
- `...\runs\sync_ubuntu_train_epoch210_20260909\train\weights\model_epoch_0210.pth`

## Example `weights.sha256.json` (copy next to MODEL_DIR; edit keys to match your loader)

```json
{
  "scn": "9453eb47576606b062ad7d1d3afb6ad4d8680312a71e02e90f440ff1f99b9da0",
  "ffscn": "b6cd6aaf28e695b4bcae94db25dd527d2b717269b1562cf47e0840d09d8a253a"
}
```

## Example env

```text
LOCAL_COMPUTE_SCN_WEIGHT_SHA256=9453eb47576606b062ad7d1d3afb6ad4d8680312a71e02e90f440ff1f99b9da0
LOCAL_COMPUTE_FFSCN_WEIGHT_SHA256=b6cd6aaf28e695b4bcae94db25dd527d2b717269b1562cf47e0840d09d8a253a
```

Mismatch → capabilities `BLOCKED` with `WEIGHT_HASH_MISMATCH`; never fabricate inference.
