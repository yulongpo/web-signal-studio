# License scan (prod) — Bot-G

- timestamp (Asia/Shanghai): 2026-10-21 18:15
- head: `8c13686`
- tool: `license-checker` (prod only) → `licenses_prod.json`, `summary_prod.txt`

## Summary

| License | Count (prod) |
|---------|--------------|
| MIT | 8 |
| UNLICENSED | 1 (`@wss/web` only) |

- Root `LICENSE` file: **missing**
- GitHub `license` field: **null**
- Flagged copyleft/proprietary tokens in prod scan: **none** (beyond UNLICENSED self-package)

## Gate recommendation

- Q-03: **PASS** for inventory evidence; **WIP** for legal publish (need root LICENSE + SPDX decision from CAO).
- Do not block CI merge on UNLICENSED for private `@wss/*` packages until release policy says otherwise.