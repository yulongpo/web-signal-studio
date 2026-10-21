# BOT_B_WAVE11 — G19 editCell/export + G02/G08 (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `56233d25d85d95bb510155058a392512be68105f` (`origin/main` = A INCREMENTAL_a48481d + B wave10 `fa60055`) |
| Desktop | `17471a6` AnnotationPanel editCell / exportFile |
| matrix_pass_claimed | **false** |

## Delivered

- **G19 editCell:** Inline cell edit for Qt-editable columns — 1 名称, 4 起始/ms, 5 结束/ms, 6 中心/MHz, 7 带宽/kHz. Double-click cell → draft; Enter/blur commit via `replaceMark`; Esc cancel. `data-qt-editcell="wave11"`.
- **G19 export:** JSON via real `hook.exportJson()` download; CSV from live table rows (honest matrix, not fabricated). Buttons `bottom-btn-export-json` / `bottom-btn-export-csv`.
- **G18:** Light scrubber twin refine only (max bound on index input when chart frame-count known); chart scrubber remains C.
- **G02:** overflow grid + 参考单位 QLabels; `data-strip-wave="wave11"`.
- **G08:** shell persist key stamp + wave11 focus/wave markers.
- **G07:** untouched.

## Checks

- typecheck green

## Deferred

- Full Qt AdaptiveValueEdit / evidence widget
- Desktop QFileDialog parity (browser download used)
- Matrix PASS
