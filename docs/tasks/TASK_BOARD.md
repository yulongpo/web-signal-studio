# TASK_BOARD — Web Signal Studio

> 更新时间（Asia/Shanghai）：2026-10-21 17:47:34  
> 规范：`docs/tasks/GROK_MASTER_PROMPT.md` v1.2  
> 模式：ONE-SHOT FULL DELIVERY

## 总览

| 阶段 | 名称 | 状态 | 负责人 |
|------|------|------|--------|
| P0 | 工作区脚手架 / 上游基线 / 文档骨架 | IN_PROGRESS | CAO |
| P1 | 源码审计 + 架构设计 + 契约 | PENDING | Audit + Arch |
| P2 | Web UI 主壳 + 工程/加载/图谱/标记 | PENDING | UI |
| P3 | DSP 算法迁移（WASM / local-compute） | PENDING | DSP |
| P4 | 宽带智能检测 | PENDING | Detect |
| P5 | 工程持久化 + 集成测试 + 性能 | PENDING | Persist + QA |
| P6 | 文档完善 + GitHub 发布 + FINAL | PENDING | CAO + QA |

## P0 细项

| ID | 任务 | 状态 |
|----|------|------|
| P0-01 | 目录骨架 | DONE |
| P0-02 | `.gitignore` / README / EXECUTION_STATUS / TASK_BOARD | IN_PROGRESS |
| P0-03 | `.work/upstream-readonly` clone `rebuild/a143-native` | IN_PROGRESS |
| P0-04 | `docs/migration/*` 基线文档骨架 | PENDING |
| P0-05 | `apps/web` Vite React-TS + 核心依赖 | PENDING |
| P0-06 | `git init` + 本地 commit | PENDING |

## 阻断 / 风险

- 上游 clone 依赖网络；慢则 shallow 后加深。
- 目标 GitHub `yulongpo/web-signal-studio` 可能尚不存在；P0 可不设 origin。
- `signal_studio_rebuild` 只读硬约束：任何写入即违规。

## 并行 Bot（规划）

| Bot | 职责 | 阶段 |
|-----|------|------|
| CAO | 总协调 / 集成 / 门禁 | P0–P6 |
| Audit | 源码审计 / 差异对齐 | P1+ |
| Arch | 契约与包边界 | P1 |
| UI | apps/web | P2+ |
| DSP | packages/dsp-wasm + local-compute | P3+ |
| Detect | 宽带检测 | P4 |
| Persist | project-io | P5 |
| QA | e2e / parity / 性能 | P5–P6 |
