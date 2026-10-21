# License scan / SPDX close — Bot-G (P6)

- timestamp (Asia/Shanghai): 2026-10-21 19:41
- base tip: `1931398`
- action: root `LICENSE` (MIT) + `"license": "MIT"` on all workspace packages

## Prior (obsolete for Q-03 gap)

| License | Count (prod) |
|---------|--------------|
| MIT | 8 |
| UNLICENSED | 1 (`@wss/web` only — field omitted) |

## After close

- Root `LICENSE`: **present** (MIT)
- Workspace package SPDX: **MIT** (root + 7 `@wss/*`)
- UNLICENSED self-package gap: **closed**

## Gate

- Q-03 → **PASS** (see `docs/acceptance/evidence/bot-g/q03_license_close_2026-10-21.md`)
