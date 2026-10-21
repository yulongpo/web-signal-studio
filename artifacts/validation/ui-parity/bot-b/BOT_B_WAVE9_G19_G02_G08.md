# BOT_B_WAVE9 — G19 interactive AnnotationPanel + G02/G08 residuals (no PASS)

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `786bdcf88e449adab1659f03f2075a2b98802271` (`origin/main` after A `4c51054` + G evidence; A subject was f9a56b8) |
| Desktop | `17471a6` read-only |
| matrix_pass_claimed | **false** |

## Delivered

- **G19:** Fuller interactive AnnotationPanel chrome vs Qt review bar — 定位当前标记 / 删除所选标记 / 编辑 / 上一段 / 下一段; Apply+保存 / 取消; row double-click → beginEdit; segment nav via `replaceMark` `activeSegmentId`; real `setSelection` / `removeMark`. Honest empty hint retained. `data-qt-interactive="wave9"` on BottomPanel + M06.
- **G02:** Strip wave9 nuances — main strip stamp; overflow palette-unit + mode-caption QLabels; aux nuance retained.
- **G08:** Shell resize focus parity (`tabIndex={0}`, `data-shell-focus="wave9"`, focus outline) left/right/bottom.
- **G07:** untouched (no invented engines).
- **G18:** pin chrome preserved (C STFT + B right-rail).

## Checks

- typecheck green
- e2e `g19-interactive-g02-g08-wave9.spec.ts` (env may limit)

## Deferred

- Inline cell edit (Qt editCell) full parity
- Evidence widget / export CSV from AnnotationPanel
- Fake Detect engines; G06; matrix PASS
