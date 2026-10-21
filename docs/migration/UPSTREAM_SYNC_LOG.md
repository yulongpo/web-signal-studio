# UPSTREAM_SYNC_LOG

记录对 `yulongpo/signal_studio` @ `rebuild/a143-native` 的只读观察。

| 时间（Asia/Shanghai） | 动作 | 远程 / UR HEAD | 备注 |
|------------------------|------|----------------|------|
| 2026-10-21 17:50:03 | 初始 shallow clone + longpaths restore + fetch deepen | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | CAO：写入 `UPSTREAM_BASELINE.json`；长路径文件曾需 partial checkout，经 `core.longpaths` + `reset --hard` |
| 2026-10-21 17:50:03 | 对照本地 `signal_studio_rebuild` | 远程仍为 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | 本地 rebuild 当时 `6499a64`；**禁止 rebuild 写入**；留给 P1 审计 |
| 2026-10-21 17:55:00 | Bot-A 独立复核 | UR `git rev-parse HEAD` = `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af`（与 origin/rebuild/a143-native 一致） | 本地 rebuild 仍为 `6499a64` ahead 2 + dirty。已增补 `00_BASELINE_AUDIT` / 对等矩阵 REAL·DEMO·EXTERNAL 证据链 |
| 2026-10-21 17:55:00 | 文档溯源 | 基准 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | a143 `DELIVERY.md` / `EXECUTION_STATUS.md` 记载产品源 `399b85e`（W6）；其后文档归档提交为当时 HEAD `0f108d0` |
| 2026-10-21 18:13:42 | CAO 解冻后 sync-check（无漂移） | UR + GitHub `ls-remote` + `get_branch` 均为 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | **上游未移动**。共享树 `main` tip=`f6a40c2`（只读）。本地 rebuild 观测 `c1f2cce`（非基准） |
| 2026-10-21 21:05+08 | Bot-A UI parity reinforcement | golden 仍 `0f108d0` | 本地 rebuild tip `696ce12` 仅路径证据；交付 G01–G26 @ `866e699` |

## 2026-10-21 21:25+08 Bot-A 紧急上游推进 + UI 增量对等

| 字段 | 值 |
|------|-----|
| 新 tip（GitHub `ls-remote` + local `origin/rebuild/a143-native`） | **`17471a6488383b456281d12cb1a6d3d80290205d`**（`17471a6`） |
| 提交时间 | 2026-10-21 21:10:27 +0800（Asia/Shanghai） |
| subject | `docs: retain build and native logs in tracked archive` |
| 先前基准 | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` |
| Web `origin/main` 核对 | **`563458ad6df118be72d87a096fc9888d58b6e2b8`**（`563458a` merge bot-e TensorRT engines） |
| 先验 Bot-A UI 文档 | `866e699`（G01–G26） |
| 本地 rebuild | `git fetch` 后 HEAD=`17471a6`（与远端一致）；**未写源码、未 push signal_studio** |
| UR 镜像 | `D:\project\web_signal_studio\.work\upstream-readonly`：已 `fetch` 使 `origin/rebuild/a143-native`→`17471a6`；**未** `checkout`/`reset` 共享树工作副本 HEAD（仍停在旧 tip），避免共享树切换 |

### `0f108d0..17471a6` 提交链（14）

```
17471a6 docs: retain build and native logs in tracked archive
db58394 docs: archive chart label and native interaction verification
696ce12 fix(ui): identify reference level and range in display summary
a64117e fix(ui): retain narrowband settings across overflow and page changes
f9f05bb fix(ui): separate chart navigation and label plot settings
55af263 docs(ux): deliver second-round UI refinement evidence
e666cea chore(ux): finalize native capture and current project entry
1176f8c fix(ux): refresh conditional fields without moving active editors
7a4c79e chore(project): remove remaining obsolete format migration checks
605ac1c refactor(project): accept only the current v6 project format
c1f2cce feat(project-tree): clarify current signals and compact source information
2e26651 feat(narrowband): unify plot settings and simplify analysis pages
6499a64 feat(ux): right-align adaptive chart controls and flatten more settings
7a32b1c docs(ux): freeze round two layout baseline and acceptance scope
```

### 对 Web 对等有影响的桌面增量（相对 G01–G26 @ 866e699）

| SHA | 影响缺口 | 桌面变化摘要 |
|-----|----------|--------------|
| `f9f05bb` | **G02**（加严） | `ChartControlStrip`：导航控件与标签/设置字段分离；caption 标签；overflow 重挂载保编辑焦点；`setAuxiliaryStatus` |
| `a64117e` | **G06**（加严） | 窄带 `pageChanged` 信号；STFT N/频率/网格从 MainWindow 根 `findChild` 解析，overflow/换页后设置保留 |
| `696ce12` | **G18**（加严） | 显示摘要文案：`参考 {level} {unit}` + `动态 {range} dB`（替代「电平」）；精度 2 位 |
| `6499a64` / `2e26651` / `c1f2cce` | G02/G06/G19 | 图头右对齐自适应控件；窄带统一 plot settings；工程树信号展示压缩 |
| `db58394` / `17471a6` | 证据 | chart-header-labels 验收截图/JSON 归档；**无新运行时 API**，但锁定原生交互基线 |

### Open deltas（相对 Web `563458a`）

1. 壳层 G01–G07 / G10 仍 OPEN（无 menubar、SpectrumToolbar 常驻、nav/aux placeholder、无 splitter、窄带 stub、无底栏）。
2. G11–G14：**PARTIAL**（见 UI 增量审计）— charts 已有 desktop-axis / box / 简易右键 / ROI Enter·Esc，但未达桌面完整 PASS。
3. G19–G20：**PARTIAL** — `importSigmfStream` + `demo-iq-paths` + engineering-tree hook；`ProjectTree` 仍 sample 优先。
4. G26：**PARTIAL→近 CLOSED（后端）** — Bot-E TRT `.engine` under rebuild；QA 已 fold；UI 模型列表与 `model_layout` 仍可能枚举 `.pth`。
5. 上游功能锚点升级为 **`17471a6`**（不再以 `0f108d0` 为唯一 tip；产品语义源仍可溯 `399b85e`）。

## 规则

- 仅 `fetch` / 只读 `log` / `diff`；禁止 push 源仓。
- 发现新提交：先更新本日志 → 更新对等矩阵 / UI gap → 回归审计。
- 验收前必须再核对一次源 HEAD。
- Bot-A 禁止共享树 `git checkout`；写入仅 worktree `D:\project\_wt_bot_a_audit`。

## 2026-10-21 21:28+08 Bot-A re-base UI audit vs Web `196db21`

| 字段 | 值 |
|------|-----|
| 桌面 tip | **仍 `17471a6`**（无新上游推进） |
| Web `origin/main` | **`196db218cee37d2e212a6c3a20a409138e33d52a`**（`196db21` merge bot-c G03–G05） |
| 相对上一审计 tip | 上一轮 Bot-A `16abb2a` 对照 Web `563458a`；本轮仅重对 Web |
| G03–G05 | **PARTIAL（改进/部分闭合）** — 见 `artifacts/validation/ui-parity/INCREMENTAL_196db21.md` |

Bot-C 证据：`NavigationChart` / `WaveformChart` / `VerticalSplitter`；e2e `g03-g05-tri-chart.spec.ts`；STATUS 自报 No self-PASS。已知残留：splitter 默认 36/160≠桌面 82/205；Wave=STFT envelope 非 raw IQ；SpectrumToolbar 仍常驻（G02）。

