# AGENTS.md — Web Signal Studio 多 Bot 约定

本文件约束在 `D:\project\web_signal_studio` 协作的 Agent。冲突时以 `docs/tasks/GROK_MASTER_PROMPT.md`（v1.2）为准。

## 路径边界（硬约束）

| 路径 | 权限 |
|------|------|
| `D:\project\web_signal_studio` | **唯一可写**工程根（源码、测试、文档、本地验证产物） |
| `D:\project\web_signal_studio\.work\` | 可写但默认 gitignore：上游只读副本、缓存、agent 临时树 |
| `D:\project\web_signal_studio\artifacts\` | 可写但默认 gitignore：验证日志/截图/交付包 |
| `D:\project\signal_studio_rebuild` | **只读**；禁止本任务任何写入 |
| `yulongpo/signal_studio`（远端） | **只读**；禁止 push / force / 改保护分支 |
| 目标仓库 `yulongpo/web-signal-studio` | 发布目标（创建前可仅本地 git） |

## 角色

| Bot | 职责 | 主要落点 |
|-----|------|----------|
| CAO / 责任人 | 总协调、集成门禁、阶段推进 | 根文档、合并、发布 |
| WSS-审计A | 只读源码与对等审计 | `docs/migration`、审计报告 |
| WSS-前端B | Web UI/UX | `apps/web` |
| WSS-图谱C | WebGL2 图谱与性能 | charts / validation 探针 |
| WSS-DSP-D | DSP 与文件 IO | `packages/dsp-wasm`、`file-io` |
| WSS-检测E | 宽带检测与本地计算服务 | `services/local-compute` |
| WSS-工程F | 工程 v6 持久化 / 撤销重做 | `packages/project-io`、domain |
| **WSS-QA-G** | CI、E2E、迁移矩阵、许可证、发布清单、artifacts/delivery | `.github/`、`tests/e2e`、`docs/acceptance`、`artifacts/` |

## QA 证据规则（WSS-QA-G）

1. `PASS` 必须指向 `artifacts/validation/`（或脱敏后的 `docs/acceptance/evidence/`）中的真实文件。
2. 不以实现者自述、聊天「已完成」或仅编译成功代替验收。
3. 上游对齐以远端 `rebuild/a143-native` HEAD 为准；本地 rebuild 脏提交不得默认计入基线。
4. 发现只读边界疑似破坏时：立即停止相关写入、记录证据并上报 CAO。

## 建议工作流

1. 开工前读 `docs/implementation/EXECUTION_STATUS.md` 与 `docs/tasks/TASK_BOARD.md`。
2. 改码后尽量跑与本包相关的 `npm`/`vitest`/Playwright；把日志落到 `artifacts/validation/<bot>/`。
3. CI 见 `.github/workflows/ci.yml`；本地可对等执行同样脚本。
