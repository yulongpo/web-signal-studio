# Bot-B G06 narrowband workspace (WIRING / WIP — NOT PASS)

| Field | Value |
|-------|-------|
| Status | **WIP evidence** — do not treat as UI_PARITY ACCEPTANCE PASS |
| Asia/Shanghai | 2026-10-21 |
| Base tip | `58ac64c` (origin/main: A INCREMENTAL_fb2e020 + G desktop PNGs) |
| Rebuild ref | `17471a6` (a64117e page/overflow retention; stacked NarrowbandWorkspace) |
| Branch | `work/bot-b-web-shell` |

## Mapping to G06 acceptance

| Criterion | Evidence | Claim |
|-----------|----------|-------|
| 1 no workspace-narrowband-stub | stub removed from App; testid workspace-narrowband | wiring |
| 2 multi-page / multi-chart | 4 tabs + observe Wave/PSD / STFT stacked | wiring |
| 3 no fake demod copy | demod/modulation/dl pages use honest awaiting notes | wiring |
| 4 STFT N / grid / freq survive page switch | values in uiStore | wiring |
| 5 overflow collapse/expand keeps values | overflow reads same store fields | wiring |

## Screenshots

- g06-narrowband-observe.png
- g06-narrowband-page-switch.png
- g06-narrowband-overflow.png

## Explicit non-claims

- No ACCEPTANCE_MATRIX PASS row edited.
- Chart panels are honest empty hosts awaiting real DDC frames (Bot-D); no invented candidates.
- IQ still only via existing open path / sigmf_data_demo constraint.
