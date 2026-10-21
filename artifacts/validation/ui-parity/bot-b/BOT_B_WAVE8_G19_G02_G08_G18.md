# BOT_B_WAVE8 — G19/G02/G08 re-shot + G18 dwell pin chrome (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `701872b740a776834c41e6cb210793fc63f43ae4` (`origin/main`: A INCREMENTAL_5a0b035 + D `33bd755` pin store) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G18 chrome (Bot-B only):** Right-rail DisplayPage + NarrowbandWorkspace dwell pin/clear controls call `setNarrowbandPinnedDwellIndex` and `setNarrowbandPsdMode('frame')` on pin; clear sets pin `null`. No DSP re-impl (store→DDC already D).
- **G19:** Qt AnnotationPanel re-shot deepen — headers aligned to desktop (`名称` / `起始 / ms` via `ANNOTATION_TABLE_HEADERS`); edit form inspector range fields 起始/结束 ms + 下边频/上边频 MHz through `replaceMark`; `data-qt-reshot="wave8-annotation-panel"`.
- **G02:** Strip nuances — physical/unit attrs, level dB unit stamp, overflow freq-unit + spacing QLabels.
- **G08:** Shell edge re-shot stamps (`data-shell-reshot`, `data-edge-side`) left/right/bottom consistency with prior hit mins.
- **G07:** untouched (no invented engines).

## Checks

- typecheck (run on tip)
- e2e `g18-dwell-pin-g19-g02-g08-wave8.spec.ts` (env may limit runtime)

## Deferred

- Full desktop AnnotationPanel interactive parity beyond range inspector
- STFT click-to-pin / contextFramePsd menu (may share with Bot-C)
- Fake Detect engines; G06 recognition/demod; matrix PASS
