# Bot-F 基线快照

- 时间（Asia/Shanghai）：2026-10-21 17:48:05
- 角色：工程/标记/状态 — v6 导入导出、来源修订、通道快照、撤销/重做、样本索引精度
- 本地根：`D:\project\web_signal_studio`
- 上游只读：`yulongpo/signal_studio` / `rebuild/a143-native` @ `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af`
- 目标仓：`yulongpo/web-signal-studio`（Cursor GitHub 当前不可见，可能尚未创建或未授权）

## 本地现状

- 根目录已存在，尚无 `apps/` `packages/` `services/` `.git`
- 仅有 `docs/tasks/` 下主提示词副本（GROK_MASTER_PROMPT / v1.1 / v1.2）
- `packages/project-io` 尚未创建
- `docs/implementation/EXECUTION_STATUS.md`、`docs/tasks/TASK_BOARD.md` 尚不存在

## 上游对口源（只读对照）

- `domain/project.h` / `project.cpp` — Project / FileState / Channel / DisplaySettings
- `domain/annotation.h` / `annotation.cpp` — 三来源、修订、OriginEvidence、AnnotationChannelSnapshot、SampleIndex=uint64
- `infrastructure/project_store.*` — 工程持久化
- `infrastructure/annotation_store.*` — 标记存储
- `infrastructure/detection_store.*` — 检测结果存储

## Bot-F 交付边界（摘自主提示词）

- `packages/project-io`：工程 v6 兼容与 v1–v5 迁移
- domain 状态：三来源统一、通道快照、撤销/重做、文件/通道隔离
- BigInt / 十进制字符串样本索引协议（禁止 Number 序列化超 2^53）
- 验收：工程互操作与状态回归（属 P3 主线，依赖 P0/P1 骨架与共享契约）

## 当前阻塞

1. monorepo 骨架与共享 schema 尚未由主 Bot 落地
2. 目标 GitHub 仓对 Cursor 不可见（未建或未授权）
3. 等待主 Bot / 用户明确：先写契约草案，还是等仓库建好再开 `work/bot-f/*` 分支

## 建议下一步（择一）

1. 在本地落 `packages/project-io` TypeScript 契约草案 + BigInt 索引编解码测试（不依赖远端仓）
2. 先完成目标仓创建/授权与 P0 骨架，再开 Bot-F 实现分支
3. 仅继续上游 `project_store` / 命令栈只读审计，产出迁移字段矩阵
