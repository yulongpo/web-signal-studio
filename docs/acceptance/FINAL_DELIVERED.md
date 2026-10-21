# FINAL_DELIVERED

**Claimed by CAO** on 2026-10-21 20:17 Asia/Shanghai.

| Field | Value |
|-------|-------|
| Claim | `FINAL_DELIVERED` |
| Packaging tip | `d77e34b` (Q-05 manifest + sha256sums + README + checklist draft) |
| Acceptance baseline | `631f22a` (all M-01..M-10 / C-01..C-04 PASS) |
| CI (baseline) | https://github.com/yulongpo/web-signal-studio/actions/runs/39597608528 |
| Manifest | `artifacts/delivery/manifest.json` (`finalDeliveredClaimed: true`) |

## Known limits (accepted, not silent)

1. CI **e2e non-charts** still disabled; M-01/M-05/M-06 Playwright evidence is committed, not CI-gated.
2. Real FFSCN/SCN inference requires NVIDIA GPU + mounted `.pth` weights; M-09 PASS covers degrade / no-model paths only.
3. Delivery packaging is an **evidence-path manifest** (no release zip/installer in this drop).

## Operator smoke

See `docs/acceptance/FINAL_CHECKLIST_DRAFT.md` and root `README.md`.
