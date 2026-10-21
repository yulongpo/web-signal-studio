# TASK_BOARD — Web Signal Studio

> 更新时间（Asia/Shanghai）：2026-10-21 17:52:09  
> 规范：`docs/tasks/GROK_MASTER_PROMPT.md` v1.2  
> 模式：ONE-SHOT FULL DELIVERY

## 总览

| 阶段 | 名称 | 状态 | 负责人 |
|------|------|------|--------|
| P0 | 工作区脚手架 / 上游基线 / 文档骨架 | **DONE** | CAO |
| P1 | 源码审计 + 架构设计 + 契约 | IN_PROGRESS | Audit + Arch + 并行 Bots |
| P2 | Web UI 主壳 + 工程/加载/图谱/标记 | PENDING | UI / Charts |
| P3 | DSP 算法迁移（WASM / local-compute） | PENDING | DSP |
| P4 | 宽带智能检测 | PENDING | Detect |
| P5 | 工程持久化 + 集成测试 + 性能 | PENDING | Persist + QA |
| P6 | 文档完善 + GitHub 发布 + FINAL | PENDING | CAO + QA |

## P0 细项

| ID | 任务 | 状态 |
|----|------|------|
| P0-01 | 目录骨架 | DONE |
| P0-02 | `.gitignore` / README / EXECUTION_STATUS / TASK_BOARD | DONE |
| P0-03 | `.work/upstream-readonly` @ `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | DONE |
| P0-04 | `docs/migration/*` 基线文档骨架 | DONE |
| P0-05 | `apps/web` Vite React-TS + 核心依赖 + Tailwind v4 | DONE |
| P0-06 | `git` 本地仓库 + `chore(p0)` commit | DONE |

## 阻断 / 风险

见 `docs/migration/02_RISKS.md`（长路径已缓解；目标仓库未创建；GPU/模型可能 BLOCKED）。

## 并行 Bot

见 `AGENTS.md`。CAO 负责集成与质量门禁；禁止写入 `signal_studio_rebuild` / push 上游。
