# ACCEPTANCE_MATRIX（初稿）

> 维护：WSS-QA-G。状态含义：`TODO` 未测 · `WIP` 实现中 · `PASS` 有 `artifacts/validation/` 证据 · `FAIL` 有失败证据 · `N/A` 本阶段不适用 · `BLOCKED` 外部阻断。  
> **禁止**仅凭实现者口头/聊天自述改为 `PASS`。

更新时间（Asia/Shanghai）：2026-10-21

## 总览门禁

| 阶段 | 名称 | 判定 | 证据入口 |
|------|------|------|----------|
| P0 | 脚手架 / 上游基线 / 文档 | WIP | `artifacts/validation/p0_qa_baseline_*.md` |
| P1 | 审计 + 契约 | TODO | |
| P2 | Web 主壳 / 加载 / 图谱 / 标记 | TODO | |
| P3 | DSP WASM / local-compute | TODO | |
| P4 | 宽带检测 | TODO | |
| P5 | 持久化 + E2E + 性能 | TODO | |
| P6 | 回归 + 发布 | TODO | `docs/acceptance/RELEASE_CHECKLIST.md` |

## 源 → Web 对等（抽样骨架）

| ID | 源能力（Qt / rebuild） | Web 落点 | 验收方式 | 状态 | 证据 |
|----|------------------------|----------|----------|------|------|
| M-01 | 工程打开 / 最近文件 | `packages/project-io` + `apps/web` | 单元 + E2E | TODO | |
| M-02 | RAW / SigMF / WAV 分块读 | `packages/file-io` | 单测 + fixtures | TODO | |
| M-03 | PSD / STFT / 瀑布 | `packages/dsp-wasm` + `packages/charts` | 数值 golden + 截图 | TODO | |
| M-04 | 物理轴 / DPR / 交互预览 | `packages/charts` + `apps/web` | Playwright | TODO | |
| M-05 | 宽窄带工作区布局 | `apps/web` | E2E + 对照截图 | TODO | |
| M-06 | 标记 / 通道快照 / 撤销重做 | `packages/domain` + `project-io` | 单测 + E2E | TODO | |
| M-07 | DDC / FIR / 有理重采样 | `packages/dsp-wasm` / local-compute | 数值对照 | TODO | |
| M-08 | 工程 v6 互操作 | `packages/project-io` | fixtures 往返 | TODO | |
| M-09 | FFSCN/SCN 检测 + 降级 | `services/local-compute` | 冒烟 + 无模型路径 | TODO | |
| M-10 | BigInt 索引协议 | contracts / domain | 契约测试 | TODO | |

## CI / DevOps / 安全

| ID | 项 | 状态 | 证据 |
|----|----|------|------|
| Q-01 | `.github/workflows/ci.yml` lint/typecheck/unit/build | FAIL→fix | `a904334` run [39583728389](https://github.com/yulongpo/web-signal-studio/actions/runs/39583728389) npm ci Missing `@wss/web`; root lock+CI workspace install on `work/bot-g-qa` + `docs/acceptance/evidence/ci-fail-a904334_REPORT.md` |
| Q-02 | Playwright E2E（真实本机/CI 服务） | PASS（本地） | `tests/e2e/shell-nav.spec.ts` + `artifacts/validation/p1g/e2e.log` |
| Q-03 | 许可证 / 依赖扫描 | PASS* | `artifacts/validation/license/`（prod MIT×8 + UNLICENSED=`@wss/web`；根 LICENSE 缺失 → 发布仍 WIP） |
| Q-04 | 无密钥 / 大样本入 Git | WIP | `.gitignore` 抽查 |
| Q-05 | `artifacts/delivery/manifest.json` | TODO | |
| Q-06 | 只读边界：`signal_studio_rebuild` 无本任务写入 | PASS* | 见下方「只读边界核验」 |

\*PASS 指 **WSS 任务包未对该目录执行写入**；该目录自身可有与桌面 UX 相关的既有脏工作树，须与本 Web 重构任务区分。

## 只读边界核验（P0-G）

| 检查 | 结果 |
|------|------|
| WSS-QA-G 写入目标 | 仅 `D:\project\web_signal_studio` |
| `D:\project\signal_studio_rebuild` 是否被本任务 `Set-Content`/`写文件` | **否** |
| 该目录 `git status` 脏文件 | 存在（宽带 UX 相关修改与未跟踪文档，时间戳早于/并行于桌面 UX 工作，**非** Web 工程产物路径） |
| 结论 | **本任务未破坏只读边界**；桌面 dirty tree 需由桌面线单独处理，不得误记为 Web Bot 写入 |

## 修订记录

| 日期 | 作者 | 说明 |
|------|------|------|
| 2026-10-21 | WSS-QA-G | P0-G 初稿 |
| 2026-10-21 | WSS-QA-G | Q-01 remote CI fail 诊断 + oxlint linux binding CI 修复；Q-03 license 证据 |
