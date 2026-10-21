# BOT_B_WAVE19 — G02 strip DSP / detectRunFeed path stamps (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `088f3220139e85b756f61c76088c7485c698a26e` (`origin/main`; G web-14cc45f evidence) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G02:** SpecParamStrip surfaces real `uiStore.dspSource`, `dspFftEngineActive` (requested/active/fallback), and `detectRunFeed` path stamp (selected/latest status/kind + count). `data-strip-dsp="wave19"`. Empty/loading → honest `—` + `data-strip-empty`.
- **Window / overlap:** still honest `—` with `data-strip-partial` + reason attrs (no invented hop/window numbers).
- **G08:** skipped (no non-fluff residual vs wave17 / INCREMENTAL_14cc45f).

## Non-goals

- No G06 eye/bitstream; no G17 recognition; no fake QFileDialog.
- No chart host / linkedCursor / rail twin changes.

## Checks

- typecheck green

## Deferred

- Live window/overlap when Bot-D publishes them to store; matrix PASS
