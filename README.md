# Web Signal Studio

将 Qt 桌面信号分析软件（yulongpo/signal_studio · ebuild/a143-native）重构为 **Web-based** 工程。

本仓库是唯一可写的开发、编译、测试与交付目录。上游桌面工程副本仅作只读参考，位于 .work/upstream-readonly/（已 gitignore）。

## 目录结构

| 路径 | 说明 |
|------|------|
| `apps/web` | Vite + React + TypeScript 主应用 |
| `packages/*` | 领域模型、契约、文件 I/O、DSP WASM、图表、工程持久化 |
| `services/local-compute` | 本地重计算侧车（FFT / 检测等） |
| `tests/*` | fixtures / e2e / parity / integration |
| `docs/*` | 迁移、架构、验收、实现状态、用户指南、任务板 |
| `scripts` | 构建与校验脚本 |
| `.work` | 上游只读副本、agent 工作区、缓存（不入库） |
| `artifacts` | 验证产物与交付物（不入库） |

## 环境要求（Windows）

- Node.js 20+（推荐 22/26 LTS）
- npm 10+
- Git for Windows
- （可选）Python 3.11+：本地 DSP 侧车

## 快速启动

`powershell
cd D:\project\web_signal_studio\apps\web
npm install
npm run dev
`

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

### 本地 DSP 侧车（可选）

`powershell
cd D:\project\web_signal_studio\services\local-compute
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
`

前端可将 `/api` 代理到 `http://127.0.0.1:8000`。

## 上游对齐

- 源仓库：`https://github.com/yulongpo/signal_studio`
- 源分支：`rebuild/a143-native`
- 只读副本：`.work/upstream-readonly`
- 基线记录：`docs/migration/UPSTREAM_BASELINE.json`
- 同步日志：`docs/migration/UPSTREAM_SYNC_LOG.md`

**禁止**对 `D:\project\signal_studio_rebuild` 写入，也禁止向 `yulongpo/signal_studio` push。

## 文档入口

- 最高执行规范：`docs/tasks/GROK_MASTER_PROMPT.md`
- 任务板：`docs/tasks/TASK_BOARD.md`
- 执行状态：`docs/implementation/EXECUTION_STATUS.md`
- 基线审计：`docs/migration/00_BASELINE_AUDIT.md`
- 对等矩阵：`docs/migration/01_SOURCE_TO_WEB_PARITY_MATRIX.md`

## 许可与归属

源工程与目标工程均属项目所有者；本仓库仅用于 Web 重构交付。
