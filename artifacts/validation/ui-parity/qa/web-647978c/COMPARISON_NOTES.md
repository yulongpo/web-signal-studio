# web-647978c vs desktop 17471a6 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Evidence HEAD | `647978c514780a0991d0f5de02f94a0cf9f2e4f1` (`647978c`) |
| Impl B | `d7d44c119d2490edc5b3f6735da39f276efc59b7` (`d7d44c1` G19 table/paging + G07/G02/G08) |
| Impl C | `2ac1f9bda46f48cdf837d9a4485b7f32308b7ffc` (`2ac1f9b` G11 overview OpenHand) |
| Prior baseline | `9248453b0f58375bd50e93719a6371574c3d0a84` (`9248453`) |
| Desktop | `17471a6488383b456281d12cb1a6d3d80290205d` (`17471a6`, reused) |
| Pack | `qa/web-647978c/` |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |

## Themes (CAO)

| Theme | Evidence | Note |
|-------|----------|------|
| G08 底高 | `01-*` | data-bottom-height clamp 100–500 + resize |
| G19 表/分页 | `02-*` | table header + paging page-size 200 + quality |
| G07 面板 | `03-*` | fuller annotation + detection shells |
| G02 overflow | `04-*` | overflow QLabel STFT/色板 |
| G11 overview OpenHand | `05-*` | `data-nav-overview-cursor=grab` |

## Gaps

1. Not UI_PARITY / matrix PASS — CAO decides.
2. Desktop interactive not re-shot.
3. G19/G07/G02/G08/G11 deepened wiring only — not CLOSED.

## Reproduce

```text
cd apps/web && npx playwright test e2e/bot-g-pack-647978c-capture.spec.ts
```
