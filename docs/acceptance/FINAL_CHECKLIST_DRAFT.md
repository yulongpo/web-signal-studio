# FINAL delivery checklist — **DRAFT** (Bot-G)

> **DRAFT ONLY.** Bot-G does **not** claim `FINAL_DELIVERED`. CAO decides after merge of this package.

- tip baseline for this draft: `631f22ab34642a903695c544cbb0390e9f7fa356` (`631f22a`)
- CI (success): https://github.com/yulongpo/web-signal-studio/actions/runs/39597608528
- generated: 2026-10-21 20:14 Asia/Shanghai
- packaging: `artifacts/delivery/manifest.json` (`packagingKind=evidence_path_manifest`)

## Gate snapshot (from ACCEPTANCE_MATRIX)

| Area | Expectation for CAO review |
|------|----------------------------|
| M-01 … M-10 | PASS (evidence under `docs/acceptance/evidence/`) |
| C-01 … C-04 | PASS |
| Q-01 … Q-04 | PASS (CI / license / secrets) |
| Q-05 | PASS after this packaging commit (manifest + sha256sums) |
| Q-06 | PASS* (read-only rebuild boundary) |
| P0 … P6 stage rows | PASS (rolled up from M/C/Q evidence; docs-only flip) |

## Operator run-through (smoke)

1. `git checkout` tip / merged main; `npm install` at repo root (workspaces).
2. Web: `npm run dev --workspace=@wss/web` → open Vite URL (default `http://localhost:5173`).
3. Optional DSP/local-compute: `services/local-compute` venv + `uvicorn` on `:8000` (no fake FFSCN/SCN without weights).
4. Unit: root/workspace vitest + `services/local-compute` pytest with `LOCAL_COMPUTE_DISABLE_TORCH=1` for contract suite.
5. Charts QA: CI `charts-playwright` (ANGLE/SwiftShader); local Playwright optional.

## Known limits (do not treat as silent pass)

- [ ] CI **e2e non-charts** job still **disabled** (M-06/M-01 Playwright evidence committed, not CI-gated).
- [ ] Real FFSCN/SCN inference needs NVIDIA GPU + mounted `.pth` weights; M-09 PASS is **degrade / no-model** path.
- [ ] No release zip/installer in this package — evidence-path manifest only.
- [ ] `FINAL_DELIVERED` **not** claimed by Bot-G.

## CAO sign-off (blank)

| Item | Owner | Result |
|------|-------|--------|
| Merge Bot-G P6 packaging commit | CAO | |
| Confirm Q-05 / stage rows on main | CAO | |
| Optional: enable non-charts e2e in CI | CAO / Bot-B | |
| Claim `FINAL_DELIVERED` | **CAO only** | |

