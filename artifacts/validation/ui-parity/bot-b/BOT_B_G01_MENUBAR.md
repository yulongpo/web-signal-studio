# Bot-B G01 residual — rename + view history (WIP / NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| Base tip | `62d3b70` |
| Rebuild | `17471a6` renameMark + view back/forward |

## Wiring

| Item | Implementation |
|------|----------------|
| Rename mark | dialog + `__wssM06.session.replaceMark` |
| View history | `uiStore.viewHistory` max 40; sync uses `recordHistory:false` |

## Screenshots

- g01-menubar-edit-rename.png
- g01-menubar-view-history.png

## Non-claims

- No ACCEPTANCE_MATRIX PASS.
