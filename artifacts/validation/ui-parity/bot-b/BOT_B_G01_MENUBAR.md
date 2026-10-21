# Bot-B G01 menubar / command-bar (WIRING / WIP — NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — do not treat as UI_PARITY ACCEPTANCE PASS |
| Asia/Shanghai | 2026-10-21 |
| Base tip | `6c17a53` (G06 merged) |
| Rebuild ref | `17471a6` `MainWindow::buildMenus()` height 34 |
| Branch | `work/bot-b-web-shell` |

## Mapping to G01 acceptance

| Criterion | Evidence | Claim |
|-----------|----------|-------|
| 1 top menu/command-bar ~34px | `menubar` height 34; e2e +/-2 | wiring |
| 2 File + View groups | `menubar-file` / `menubar-view` | wiring |
| 3 Open/Add IQ from menu | `menu-open-iq` (not only SpectrumToolbar) | wiring |

## Screenshots

- g01-menubar-default.png
- g01-menubar-file-menu.png
- g01-menubar-view-narrowband.png

## Non-claims

- No ACCEPTANCE_MATRIX PASS.
- Did not remove chart-header Open IQ (G02 strip still has it).
- NavChrome / G02 strips / G06 NarrowbandWorkspace / C hosts untouched in behavior.
