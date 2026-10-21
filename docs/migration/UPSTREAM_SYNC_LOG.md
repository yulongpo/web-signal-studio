# UPSTREAM_SYNC_LOG

记录对 `yulongpo/signal_studio` 的 `rebuild/a143-native` 的只读观察。

| 时间（Asia/Shanghai） | 动作 | 远程 / UR HEAD | 备注 |
|------------------------|------|----------------|------|
| 2026-10-21 17:50:03 | 初始 shallow clone + longpaths restore + fetch deepen | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | CAO：写入 `UPSTREAM_BASELINE.json`；长路径文件曾需 partial checkout，经 `core.longpaths` + `reset --hard` |
| 2026-10-21 17:50:03 | 对照本地 `signal_studio_rebuild` | 远程仍为 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | 本地 rebuild 当时 `6499a64`；**禁止 rebuild 写入**；留给 P1 审计 |
| 2026-10-21 17:55:00 | Bot-A 独立复核 | UR `git rev-parse HEAD` = `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af`（与 origin/rebuild/a143-native 一致） | 本地 rebuild 仍为 `6499a64` ahead 2 + dirty（含 narrowband_workspace 等未提交改动）。已增补 `00_BASELINE_AUDIT` / 对等矩阵 REAL·DEMO·EXTERNAL 证据链；刷新 `UPSTREAM_BASELINE.json` 字段 `lastVerifiedAtAsiaShanghai` / `localRebuildHeadObserved` / `openDeltas` |
| 2026-10-21 17:55:00 | 文档溯源 | 基准 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | a143 `DELIVERY.md` / `EXECUTION_STATUS.md` 记载产品源 `399b85e`（W6）；其后文档归档提交为当时 HEAD `0f108d0`。不以 `399b85e` 替代基准 HEAD |
| 2026-10-21 18:13:42 | CAO 解冻后 sync-check（无漂移） | UR + GitHub `ls-remote` + `get_branch` 均为 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | **上游未移动**。协调上下文：共享树 `main` tip=`f6a40c2`（只读观察，Bot-A 未在共享树 `checkout`）。本地 rebuild 现观测为 `c1f2cce`（仍 ahead/dirty，非基准）。写入仅在 worktree `D:\project\_wt_bot_a_audit` / `work/bot-a-audit` |

## 规则

- 仅 `fetch` / 只读 `log` / `diff`；禁止 push 源仓。
- 发现新提交：先更新本日志 → 更新 `01_SOURCE_TO_WEB_PARITY_MATRIX` → 回归审计。
- 验收前必须再核对一次源 HEAD。