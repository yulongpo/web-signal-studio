# web-1dbf673 vs desktop 17471a6 (Bot-G, NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Evidence sync tip / HEAD | `1dbf67316bca088b1aefea4b948953a04391eb75` (`1dbf673`) |
| Impl baseline | `9248453b0f58375bd50e93719a6371574c3d0a84` (`9248453` G19/G02/G08/G07) |
| Prior impl wave | `f4c67be09ef7d53b60ff4b243ee900bcd0ca123b` (`f4c67be` OpenHand / Detection全参 / G06 BLOCKED) |
| Desktop tip | `17471a6488383b456281d12cb1a6d3d80290205d` (`17471a6`, reused) |
| Pack | `qa/web-1dbf673/` |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |

## Themes

| Theme | Evidence | Note |
|-------|----------|------|
| G08 cols | `01-g08-columns.png` | 278/390 + resize |
| G02 strip | `02-*` QLabel | 参考·动态 / STFT / 色板 |
| OpenHand (G11) | `03-*` | grab / ClosedHand / crosshair |
| G19 paint | `04-*` | `desktop-multi` |
| G07 panels | `05-*` | annotation + detection shells |
| Detection 全参 (G17) | `06-*` | `detection-param-grid` |
| G06 BLOCKED 文档 | `G06_*_BLOCKED.md` | eye / bitstream / recognition |

## Gaps

1. Not UI_PARITY / matrix PASS — CAO decides.
2. Desktop interactive not re-shot.
3. G06 PARTIAL (BLOCKED residuals). G11/G17/G07/G19/G02/G08 deepened only — not CLOSED.
4. OpenHand cursor attr via PointerEvent dispatch (raw mouse.move hits GL canvas).

## Reproduce

```text
cd apps/web && npx playwright test e2e/bot-g-pack-1dbf673-capture.spec.ts
```
