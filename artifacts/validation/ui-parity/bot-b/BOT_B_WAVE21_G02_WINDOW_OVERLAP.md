# BOT_B_WAVE21 — G02 SpecParamStrip window/overlap from D uiStore (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `8eae73e1545d087fe66a6ce3bc3d5c8f01143259` (`origin/main`; D `4cf4f64`) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G02:** SpecParamStrip subscribes to Bot-D `dspFftWindow` / `dspFftOverlap` / `dspFftHopSize` / `dspFftSizeActive`. Window + overlap QLabels show real values when present (overlap as `%`); Hop + FFTn stamps too. Missing → honest `—` + `data-strip-partial` / reason attrs. `data-strip-wave` includes wave21.
- Overflow menu mirrors the same store-backed window/overlap readout.

## Non-goals

- No invented numbers when store is null.
- No G06/G17; `data-native-qfiledialog=false` retained.
- No chart host / rail twin / linkedCursor changes.

## Checks

- typecheck green

## Deferred

- Matrix PASS; full Qt Worker / shell re-shot residuals unchanged
