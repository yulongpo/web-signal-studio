# Bot-B G01 menubar COMPLETE menus (WIRING / WIP — NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — do not treat as UI_PARITY ACCEPTANCE PASS |
| Asia/Shanghai | 2026-10-21 |
| Base tip | `905cdad` (A incremental + D DDC) |
| Rebuild ref | `17471a6` `buildMenus()` File/Edit/View/Analysis/Tools/Help |
| Branch | `work/bot-b-web-shell` |

## Menus

| Menu | Wired | Honest empty / disabled |
|------|-------|-------------------------|
| File | Open IQ, clear IQ, project open/save/sample | — |
| Edit | undo/redo/delete via `__wssM06` when ready; open marker page | rename disabled |
| View | wide/narrow, STFT/waterfall, rail | back/forward disabled (G15) |
| Analysis | open Detect page; ROI → select tool + Detect | no fake demod |
| Tools | About dialog | — |
| Help | mouse interaction dialog | — |

## Screenshots

- g01-menubar-default.png
- g01-menubar-file-menu.png
- g01-menubar-edit-menu.png
- g01-menubar-analysis-menu.png
- g01-menubar-help-dialog.png
- g01-menubar-view-narrowband.png

## Non-claims

- No ACCEPTANCE_MATRIX PASS.
- NavChrome / G02 / G06 / C hosts preserved.
