# UPSTREAM_SYNC_LOG

记录对 `yulongpo/signal_studio` · `rebuild/a143-native` 的只读对齐检查。

| 时间（Asia/Shanghai） | 动作 | 远端 HEAD | 备注 |
|------------------------|------|-----------|------|
| 2026-10-21 17:50:03 | 初始 shallow clone + longpaths restore + fetch deepen | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | 基线写入 `UPSTREAM_BASELINE.json`；长路径文件曾导致 partial checkout，已 `core.longpaths` + `reset --hard` |
| 2026-10-21 17:50:03 | 对照本地 `signal_studio_rebuild` | 远端仍为 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | 本地 rebuild 曾见 `6499a64`；**不以 rebuild 写入**；差异待 P1 审计 |

## 规则

- 仅 `fetch` / 只读 `log` / `diff`；禁止 push 上游。
- 发现新提交：差异分析 → 纳入 `01_SOURCE_TO_WEB_PARITY_MATRIX` → 增量回归。
- 发布前后必须再核一次最新 HEAD。
