# BOT_B G19 — CN tree chrome (WIP / NOT PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 Asia/Shanghai |
| Base | `ee64b704e227a36dd44f194c4034be887daefa9f` |
| Desktop | `17471a6` / `project_tree_presentation.h` |
| Branch | `work/bot-b-ui` |
| matrix_pass_claimed | **false** |

## Scope

Chinese desktop-parity **presentation chrome** on ProjectTree (not F data model):

- Section headers: 标注 / 通道 / 检测运行 / IQ 文件 / 演示工程
- Badge chips: 未读 / 差异 / 缺失 / 已忽略 / 复核 / 旧版 / …
- Relation tooltips rewritten to desktop `relationText` Chinese
- Folder/section glyphs (▸/▾), kind marks (◈▣◇)
- Active bar + selection/hover colors vs desktop delegate
- Mark checkbox cue + Ctrl/Meta/Shift multi-select via M06 `setSelection`
- `data-presentation="desktop-cn-chrome"`

## Evidence

- e2e `apps/web/e2e/g19-cn-tree-chrome.spec.ts`
- screenshot `g19-cn-tree-chrome.png`

## Not claimed

- Full Qt AnnotationPanel multi-select paint parity
- Fake marks / non-demo IQ
- ACCEPTANCE PASS / matrix CLOSED
