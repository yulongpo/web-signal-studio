# BOT_B tip — G19 table/paging/quality + G07/G02/G08 + G18 eval

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `1dbf67316bca088b1aefea4b948953a04391eb75` (`origin/main`) |
| Desktop rebuild | `17471a6` |
| IQ | `sigmf_data_demo` only (no fake data) |
| matrix_pass_claimed | **false** |

## Delivered vs rebuild 17471a6

- **G19** AnnotationPanel Qt-ish table header, paging (200), quality filter + 已采纳/已忽略/待判断 actions (via `replaceMark.reviewStatus`).
- **G07** Fuller AnnotationPanel / DetectionPanel chrome (quality menu, paging, detect table header + inspector slots; still no invented runs).
- **G02** Overflow menu QLabel parity: `STFT点数` / `色板` (+ 检测ROI / 标记).
- **G08** Bottom panel height behavior: clamp **100–500**, drag handle `bottom-panel-resize`, persist `wss.bottomPanelHeight.v1`.

## G18 ownership conclusion

- **In Bot-B shell scope:** `STFT N` + palette (from `uiStore.stftN` / `paletteId`), plus existing 参考/动态 level chrome. Implemented in right-rail `display-summary`.
- **Not Bot-B shell (Bot-C charts / Bot-D DSP):** PSD mode string `驻留帧谱` / `统计谱`. Shell shows `PSD N {narrowbandPsdFft} · —` only — mode slot stays em-dash; no invented spectrum mode.
- Prior handoff (F→B) for display chrome aligns: shell lines yes; C/D spectrum mode no.

## CI fix

- `M06MarksPanel.selectAllVisible`: `activeMarkId` typed as `string | undefined` (not `null`) to match `M06E2eHookApi.setSelection` — unblocks typecheck (CI run 39625537427).

## Evidence screenshots

- `g08-bottom-height-resize.png`
- `g02-overflow-qlabel.png`
- `g19-annotation-table-paging.png`
- `g07-annotation-detection-fuller.png`
- `g18-display-summary-shell.png`

## Not claimed

- ACCEPTANCE PASS
- Fake marks / fake Detect runs / fake IQ
