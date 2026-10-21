# BOT_B_WAVE17 — G08 shell keyboard + G07 Worker residuals + rail linkedCursor twin (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `3489635a9e34dc6c63389156c829881e80db2f67` (`origin/main`; A INCREMENTAL_c9ed974) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G08:** Column separators keyboard deepen — ArrowLeft/Right (Shift=24px) adjust width, Home restores desktop 278/390, Escape blurs focus; `data-shell-wave` includes wave17; `data-shell-keyboard="wave17"`; focus-visible outline. Persist key unchanged (`wss.shellColumns.v1`).
- **G07:** Worker chrome wave17 — inspector adds created/updated/uiMessages/feed-size from real `detectRunFeed` only; BLOCKED eye/bitstream/demod gaps retained; no invented engines.
- **Rail twin:** Right-rail readout of C `uiStore.linkedCursor` + follow-selected-frame → `narrowbandPinnedDwellIndex` + clear via `clearLinkedCursor`; does **not** touch charts/`nb-stft-dwell-scrubber`.

## Non-goals

- No G06 eye/bitstream/demod invention.
- No chart host / linked-cursor drawing (Bot-C).
- Native QFileDialog still false.

## Checks

- typecheck green

## Deferred

- Full desktop shell re-shot; full Qt Detect Worker beyond LocalCompute; matrix PASS
