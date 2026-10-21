# Bot-E G17 residual - Detect UI / cancel / precheck - 2026-10-21 Asia/Shanghai

**Baseline:** `5d33611` (contains G06 BLOCKED evidence `2d05b73`)  
**Branch:** `work/bot-e-g17-residual`  
**Desktop ref:** `signal_studio_rebuild` @ `17471a6` (`ui/detection/detection_card.*`)  
**matrix_pass_claimed:** false

## Already OK (prior G17 / TRT)

- REAL_RUNTIME + TENSORRT_OK honesty; runtime engine chips
- Server cancel / WEIGHT_HASH / ENGINE_MISSING / TENSORRT_NA degrade
- Draw policy: verifiedForward + real engine only

## Gaps closed this tip

| Area | Gap vs 17471a6 / prior web | Change |
|------|----------------------------|--------|
| Engine list | Page had chips only; no models inventory | `detect-engine-inventory` from `capabilities.models` |
| G26 | .pth must not be selectable | `.pth` rows `data-blocked-pth=true` |
| Cancel UX | Cancel only when local `busy` | Enable for `queued`/`running`; tooltip with runId |
| Cancel honesty | Patched status only | Re-GET task; `result=null` when cancelled; frozen copy |
| Precheck | present/ready/roots not shown | chips `detect-ffscn-present` / `detect-scn-present` / `detect-model-roots` |

## Still BLOCKED

- **Narrowband recognition** - no recognition package; do not wire fake recognize
- Full DetectionCard (strategy/phase bar/profile combo) - out of residual scope
- No matrix PASS

See `g17_residual_summary_2026-10-21.json`.
