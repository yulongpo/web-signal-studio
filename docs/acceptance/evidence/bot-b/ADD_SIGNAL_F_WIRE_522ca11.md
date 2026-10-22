# ADD_SIGNAL_F_WIRE — Bot-B Add-signal ↔ F templates/preview/confirm

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Worktree | `D:\project\wss-wt-b` |
| Branch | `work/bot-b-ui` |
| Base | **522ca11** = `522ca11b48fcdc6623728579ae741a6df7a4fdb7` (origin/main = merge bot-f a7fb002) |
| Tip | **1f79aab** = 1f79aab79f2238f254d17a63b3ea2409fff1cfe4 |
| Desktop | SignalImportDialog / ImportController / FormatTemplateStore @17471a6 |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |

## Wired (this tip)

| Step | F API | UI |
|------|-------|-----|
| Templates | `listBuiltinFormatTemplates` | RAW `<select data-testid="add-signal-template">` |
| SigMF preview | `previewSigmfImport` | preview table after browser pick |
| RAW preview | `describeRawIqWithTemplate` | Fs/Fc + confirmed gate + template |
| Filename hint | `suggestFromFilename` | suggestions line |
| SigMF confirm | `importSigmfStream({ enforceDemoPath:false })` | 确认添加 → uiStore projectDocument + tree |
| Chart feed | existing `openIqFromFiles` | after SigMF confirm when meta+data both picked; RAW confirm opens chart only |

## Honesty

- `data-native-qfiledialog="false"` / `data-g20="browser-picker"` / `data-add-signal="f-wire"` on dialog root + pick/input.
- No fake Qt pixels; browser `<input type=file multiple>`.
- zh-only user-visible chrome (品牌/API 名可留拉丁).
- No G06 / G17 invent.
- RAW engineering-tree commit still OPEN (F has no raw `import*Stream` yet) — preview + chart open only; documented in dialog note.
- **Not** ACCEPTANCE PASS.

## Menu entry

- File → **添加 / 打开信号…** (`menu-open-iq`) opens `AddSignalDialog` (replaces immediate FSA/input open for this menuitem).
- SpectrumToolbar / ChartParamStrip **打开 IQ** remain quick chart open (still `data-native-qfiledialog=false`).

## Self-test

1. File → 添加 / 打开信号… → dialog `data-testid=add-signal-dialog` with `data-native-qfiledialog=false`.
2. Pick SigMF meta+data → preview status 就绪; 确认添加 → projectSource=json + tree IQ 文件 row; no PASS banner.
3. Pick RAW `.iq` → templates list shows 通用 CI16/CF32/…; unchecked confirm → 失败/请确认; check confirm → 就绪 → 确认添加 opens chart.
4. `listBuiltinFormatTemplates` / `previewSigmfImport` / `describeRawIqWithTemplate` / `importSigmfStream` referenced from `AddSignalDialog.tsx`.
5. matrix_pass_claimed=false in this evidence.
