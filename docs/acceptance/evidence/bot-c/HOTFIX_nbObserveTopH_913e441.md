# HOTFIX: nbObserveTopH ReferenceError

- **base**: `e93c939` (origin/main, includes G pack; prior tip base was 913e441)
- **symptom**: G real run - NarrowbandObserveCharts / workspace-narrowband - ReferenceError: nbObserveTopH is not defined - 05 NB PARTIAL, workspace unmounted
- **root cause**: tip `6316da9` added `wss.nbObserveTopH.v1` reader + JSX uses of nbObserveTopH / onNbObserveTopChange but never declared useState or the onChange handler
- **fix**: in NarrowbandObserveCharts, add useState(readNbObserveTopH) + onNbObserveTopChange that clamps and persists to `wss.nbObserveTopH.v1`
- **matrix_pass_claimed**: false
- **no invent**: DSP / G06 / G17 / G16 matrix untouched; ChartMarkOverlay backticks preserved
