# Bot-B WIP notes — shell vs rebuild/a143-native (NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP / PAUSED** — do not treat as ACCEPTANCE PASS |
| Time (Asia/Shanghai) | 2026-10-21 ~21:20 |
| Rebuild ref (parity target) | rebuild/a143-native @ 17471a6488383b456281d12cb1a6d3d80290205d |
| Web worktree | D:\project\wss-wt-b branch work/bot-b-web-shell |
| Web HEAD | 7b59574aaeb16fb781b34542b2754bc267df9f90 (contains 563458a) |
| CAO order | Hold G01/G02/G06/G07/G17 inventing until Bot-A new acceptance; shell parity ref = latest rebuild tip |

## Sync

- Rebuild: fetch + pull --ff-only origin rebuild/a143-native → Already up to date at 17471a6.
- No rebuild sources modified (read-only).
- Incomplete Bot-B shell WIP stashed (not pushed as complete): stash message "PAUSED bot-b P0 shell WIP pending Bot-A new acceptance (CAO)".

## Focus areas for later (when A acceptance lands)

### 1. Reference level / range display

Rebuild (17471a6): referenceLevelDb / dynamicRangeDb on file display; combo + validation; power-fit cache; property/status strings.
Web (7b59574): uiStore.level.refLevelDb / dynamicRangeDb + Level temp layer into MainChartHost levels. Still primarily toolbar / temp-layer path on this tip.

Later: map rebuild ref/range display into chart-header / display rail per A; no invented values.

### 2. Narrowband settings persistence

Rebuild: narrowband channel section → context Channel page; SpectralSettings method history is in-widget only (not project JSON).
Web: workspaceMode + workspace-narrowband-stub; no persisted narrowband channel settings.

Later: stacked narrowband host (no fake demod); persist only what A/F allow.

### 3. Chart navigation vs label settings separation

Rebuild: navigationPlot is its own PlotWidget; settingLabel role separate from nav chrome.
Web on tip: global-nav placeholder; aux ChartPlaceholder; main MainChartHost.
Bot-C local tip has NavChartHost / AuxChartHost / VerticalSplitter (not on origin/main at pause time).

Later (CAO ACK): after C merges to main → compose embeddables; keep nav zoom/pause in Bot-B shell/header. Do not reimplement charts.

## Explicit non-claims

- No ACCEPTANCE_MATRIX PASS rows edited.
- No incomplete P0 tip pushed as done.
- No fake FFSCN/SCN candidates / fake demod.
- Model paths untouched (Bot-E).

## Resume checklist (blocked on A)

1. Bot-A publishes new UI_PARITY_ACCEPTANCE for shell IDs.
2. Re-fetch origin/main (expect C G03-G05 + any A docs).
3. Restore stash only if still aligned; re-verify against rebuild 17471a6+.
4. Evidence under this folder with PASS mapping — not before.
