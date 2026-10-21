# BOT_B_WAVE14 — G02 strip + G07 Worker honest gaps + G08 shell (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `6ada5b078adb7c656776a9835fe393fa09645139` (`origin/main`) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G02:** Strip wave14 QLabels — 频率/窗/重叠 (窗·重叠 honest `—` until DSP wired); overflow window/overlap/colormap; `data-strip-wave="wave14"`.
- **G07:** Worker status from real caps (`protocolVersion` / `serviceVersion` / feed counts); FFSCN/SCN/models unchanged (real caps only); explicit **BLOCKED** rows for eye-diagram / bitstream / demod-recognition — **not invented**, disabled/`data-blocked`. Honesty banner updated.
- **G08:** Shell wave14 stamps; desktop default widths 278/390 attrs; resize `aria-valuemin/max/now`; bottom min 29 + range 100–500 attrs.

## Explicit non-goals

- No G06 eye-diagram / bitstream / demod / recognition pseudo-impl or fake feeds.
- C charts/gesture + G18 pin stack + G19 wave13 editors preserved.

## Checks

- typecheck green

## Deferred

- Window/overlap live DSP values; full Qt Detect Worker beyond LocalCompute; matrix PASS
