# PARITY_TREE_SHELL_ZH — Bot-B P0 + P1#8 (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | **10ee4cd** = 10ee4cd29cdba2d87cf9dc48fd5da7ff3caf5abe (origin/main = C+D; includes 854b785/6316da9 + D DDC) |
| Tip | **0c20f4a** = 0c20f4affaad5bf0390f4201f9b181a431ad2d5c (branch work/bot-b-ui) |
| Desktop | 17471a6 read-only D:\\project\\signal_studio_rebuild |
| Worktree | D:\\project\\wss-wt-b |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |

## Scope done (PARTIAL honesty)

### P0
1. **zh-only chrome** — user-visible EN purged/localized: tree SAMPLE + engineering-tree section titles (IQ 文件 / 通道 / 标注 / 检测运行); MenuBar IQ 打开失败 / 加载宽带演示 IQ / 命令栏; SpectrumToolbar + ChartParamStrip 打开 IQ / 清除 IQ / error CN. Brand wordmark **Signal Studio** kept (desktop brand). Accel Latin kept. Titles keep data-native-qfiledialog=false honesty.
2. **ProjectTree** — SAMPLE_FALLBACK CN titles; presentation still uses Title/Detail/Badge via existing roles + CN maps; project-io section labels CN at source.
3. **Add-signal / parse UI** — no fake Qt dialog; stamps remain data-native-qfiledialog="false" / data-g20="browser-picker" on MenuBar / strip / toolbar inputs. Full SignalImportDialog still OPEN (F parse deepen).
4. **Fonts** — index.css + App.css: Microsoft YaHei UI / YaHei + Segoe UI fallback; Consolas mono; ~12px chrome.
5. **Broadband layout** — MenuBar height 34 retained; chart-strip height/max 28; bottom dock prior 29 tabs unchanged. Graph **splitter handleWidth=10** (VerticalSplitter / graphs_.setHandleWidth(10) @17471a6). Chart-pane **mins left to C** (do not redo). MainChartHost/gesture reserved for C.

### P1#8 (CAO)
- Narrowband product surface **Observe-only** (data-nb-product-surface="observe-only" / data-cao-p1-8="observe-three-charts").
- 调制 / 解调 / 深度学习 moved under demoted <details> (data-demoted="true"); require unlock click; soft-redirect to observe otherwise.
- **No** G06 eye/bitstream invent; **no** G17 recognition invent; demoted shells remain BLOCKED/honest.

## Fence
- Not touched: G06 eye/bitstream content, G17 recognition scores, Multitaper/Burg, G16 enable-matrix, MainChartHost/splitter/gesture (C).
- IQ path honesty: demo via sigmf_data_demo menu item only as before.

## Self-test bullets
1. Load app → MenuBar 34px; strip ~28px; fonts resolve YaHei/Consolas (fallback OK on non-Windows).
1b. splitter-nav-aux / splitter-aux-main DOM data-handle-width="10" (height 10px).
2. Empty tree CN; sample/open project → tree sections CN (IQ 文件…); badges CN chips.
3. File → 添加/打开信号 → browser picker; DOM data-native-qfiledialog="false".
4. Open IQ fail → CN error chip (not IQ open failed).
5. Switch to 窄带 → only **信号观察** primary tab; demoted pages behind 更多页面（降级）; Observe shows wave/PSD/STFT path.
6. No ACCEPTANCE_MATRIX PASS flips; this evidence PARTIAL only.

## Claims
| Claim | Value |
|-------|-------|
| matrix_pass_claimed | false |
| Status | PARTIAL (chrome/layout/copy/tree/NB surface); import dialog + pixel parity OPEN |
