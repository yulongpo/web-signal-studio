# Bot-G web-6ada5b0 vs desktop 17471a6 (NOT PASS)

- HEAD/sync: 6ada5b078adb7c656776a9835fe393fa09645139
- Impl B wave13: ad4b617 (AdaptiveValueEdit-in-cell + Evidence + browserSaveFile)
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- ui_parity_pass_claimed: false

## Priority
- adaptive_cell: {"stamp_on_pane":true,"cell_count":0}
- evidence: {"panel_visible":true,"data_qt_evidence":"wave13","data_has_evidence":"false","empty_visible":true}
- browser_save: {"export_json_attr":"wave13","export_csv_attr":"wave13","export_json_log":"showSaveFilePicker","save_picker_calls":["annotations.json"]}
- pin_zindex: soft-deferred (proven @ 03381ce / web-6df15bc)

## Captures
- 01-wave13-marks-toolbar-export.png
- 01b-wave13-annotation-toolbar-crop.png
- 02-wave13-export-json-after-click.png
- 03-wave13-annotation-evidence-panel.png
- 03b-wave13-evidence-panel-crop.png
- 04-wave13-adaptive-cell-empty-table.png
- 04b-wave13-annotation-table-crop.png
- fold-web-6df15bc/* (13 files)

## Gaps
- AdaptiveValueEdit-in-cell: no mark rows (needs IQ/marks); pane stamp data-qt-adaptive-cell=wave13 + toolbar/export/evidence captured

No PASS claimed.