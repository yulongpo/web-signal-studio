# Q-03 LICENSE gap close — Bot-G (P6)

- timestamp (Asia/Shanghai): 2026-10-21 19:41
- base tip: `1931398`
- prior: prod scan MIT×8 + UNLICENSED=`@wss/web`; root LICENSE missing (PASS* / publish WIP)

## Actions

1. Added root `LICENSE` (MIT SPDX text; copyright yulongpo / Web Signal Studio contributors, 2026).
2. Set `"license": "MIT"` on monorepo root + all workspace packages:
   - `web-signal-studio`
   - `@wss/web`, `@wss/charts`, `@wss/contracts`, `@wss/domain`, `@wss/dsp-wasm`, `@wss/file-io`, `@wss/project-io`
3. Rationale: public GitHub repo; prior prod dependency inventory was MIT-only; master prompt requires a root LICENSE after source/purpose review (source tree had no LICENSE file); CAO asked to close UNLICENSED gap and align packages with root.

## Residual

- Third-party prod licenses remain MIT-dominant (prior `artifacts/validation/license/`).
- GitHub UI license detection may lag until merge to default branch.
- If CAO later chooses a different SPDX (e.g. Apache-2.0 / proprietary), replace root LICENSE + package fields in one follow-up.

## Gate

- Q-03 → **PASS** (root LICENSE present; `@wss/web` no longer UNLICENSED-by-omission; workspace SPDX aligned to MIT)
