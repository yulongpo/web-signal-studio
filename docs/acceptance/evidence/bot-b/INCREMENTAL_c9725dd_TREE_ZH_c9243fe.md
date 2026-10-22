# INCREMENTAL_c9725dd_TREE_ZH — Bot-B residual EN + ProjectTree deepen (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | **c9243fe** = `c9243fe316850c809c6a28de7bfafef6e86459e4` (origin/main = A INCREMENTAL merge) |
| Tip | **7634cf7** = `7634cf7f86abcbe43a145ee6a8bc6b625cfa1684` (branch `work/bot-b-ui`) |
| Desktop | **17471a6** read-only `D:\project\signal_studio_rebuild` (`ui/project_tree_presentation.h`, `app/main_window.cpp` annotationSource titles, `annotation_evidence_widget.cpp` sourceName) |
| Worktree | `D:\project\wss-wt-b` |
| A audit | `docs/acceptance/evidence/bot-a/INCREMENTAL_c9725dd.md` TOP residual #1 |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |

## Scope done (PARTIAL honesty)

### 1. Clear residual user-visible EN
- `packages/project-io/src/engineering-tree.ts` presentation strings → desktop CN:
  - annotationSource titles: **原始标签 / 手动标记 / 算法结果** (was Imported labels / Manual marks / Algorithm results)
  - channel relation Detail/tooltips: desktop `relationText` CN (来源当前 / 来源已修改；保留创建快照 / …)
  - summary/file residual `samples` / `ch` / `mark(s)` / `detection run` → CN
  - channels group title: **窄带通道** (desktop `窄带通道 (%1)`)
- `apps/web/src/dsp/openIqForMainChart.ts` user-facing error messages → CN (打开失败 / 未选择文件 / SigMF 需双文件 / 不支持类型 / 演示 IQ / FSA 不可用). Cancelled → 已取消.
- `ProjectTree.tsx` keeps EN→CN map keys for any leftover source strings; SAMPLE_FALLBACK sourceTooltip CN; empty-state already CN.

### 2. Deepen ProjectTree presentation (Title/Detail/Badge/CN)
- File DetailRole aligned: `Fc … · Fs …` (desktop `project_tree_presentation.h`)
- Channel DetailRole aligned: `Fc … · BW …`; relation/snapshot moved to **tooltip** (desktop split)
- `fileTooltip` / `channelTooltip` builders for PresentedToolTipRole-ish depth
- UI: `cleanName` + `presentDetail` rewrite residual EN fragments; badge map adds `deleted→已删除`
- Stamp: `data-tree-incremental="c9243fe"` / `data-presentation="desktop-cn-chrome"`
- Unit tests updated; `engineering-tree.test.ts` **3 passed**

## Fence
- Not touched: G06 eye/bitstream, G17 recognition, Multitaper/Burg, G16 enable-matrix, MainChartHost chart/gesture (C)
- Add-signal F-wire preserved (no API rename)
- Prior tips kept: handleWidth=10, Observe-only NB surface, YaHei+Consolas fonts

## Self-test
1. Load sample/open project → tree sections CN; annotationSource groups 原始标签/手动标记/算法结果; channels **窄带通道**
2. File/channel two-line: detail `Fc · Fs` / `Fc · BW`; badges CN chips; tooltip has relation CN
3. Open IQ fail / cancel / unsupported → menubar/strip/dialog title or error body CN (not `Open failed`)
4. `npx vitest run packages/project-io/src/engineering-tree.test.ts` → 3 passed
5. No ACCEPTANCE_MATRIX PASS flips; this evidence PARTIAL only

## Claims
| Claim | Value |
|-------|-------|
| matrix_pass_claimed | false |
| Status | PARTIAL (zh purge + tree presentation deepen); pixel/role not CLOSED |

## Paths
- Evidence: `docs/acceptance/evidence/bot-b/INCREMENTAL_c9725dd_TREE_ZH_c9243fe.md`
