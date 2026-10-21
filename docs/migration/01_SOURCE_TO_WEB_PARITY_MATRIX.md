# 01_SOURCE_TO_WEB_PARITY_MATRIX — 源端到 Web 对等矩阵

| 字段 | 值 |
|------|-----|
| 文档状态 | ENRICHED（Bot-A；状态仍多为 TODO/PARTIAL，但已挂证据） |
| 源 HEAD | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` |
| 核对时间（Asia/Shanghai） | 2026-10-21 17:55:00 |

图例：`TODO` = 未设计；`PARTIAL` = 部分迁移；`DONE` = 已对等；`N/A` = Web 不适用；`BLOCKED` = 外部依赖缺失。  
分类列：`REAL` / `DEMO` / `EXTERNAL`（见 `00_BASELINE_AUDIT.md` §0）。

路径：`UR:` = `.work/upstream-readonly/`；`WEB:` = 本仓。

## 工程（Project）— W0 基线 / Web P0–P2

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 工程创建/打开 | REAL | UR:`domain/project.*`；UR:`infrastructure/project_store.*`；README v6 | WEB:`packages/project-io`（未建）+ WEB:`apps/web/src/components/ProjectTree.tsx` | TODO |
| 工程元数据 / 备份 | REAL | README「首次覆盖旧版…SHA-256 备份」；U4 | domain schema (zod) | TODO |
| 会话 / 布局偏好 | REAL | UR:`application/session.*`；QSettings（原生） | zustand persist | TODO |
| 演示工程入口 | DEMO | README「`--demo-data` / 文件菜单」 | 显式 Demo 入口（勿默认） | TODO |

## 加载（Load / Import）— W1

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 原始 IQ / int16 | REAL | UR:`infrastructure/int16_iq_file.*` `raw_sample_reader.*`；UR:`docs/acceptance/iq-file-int16.md` | WEB:`packages/file-io/src/chunked-reader.ts` | PARTIAL |
| WAV 元数据 | REAL | UR:`infrastructure/wav_metadata.*` | file-io | TODO |
| SigMF | REAL | UR:`infrastructure/sigmf_metadata.*`；README | file-io | TODO |
| 格式模板 | REAL | UR:`format_template_store` / `sample_format` | contracts + UI import | TODO |
| 导入向导 UI | REAL | UR:`ui/import/*`；UR:`infrastructure/import_controller.*` | apps/web import 流 | TODO |

## 图谱（Spectral / Charts）— 对齐源 W2 弹层参数

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 谱分析 PSD/STFT | REAL | UR:`infrastructure/spectral_analysis.*`；a143 UX-S* | dsp-wasm / local-compute | TODO |
| 通道处理 | REAL | UR:`infrastructure/channel_processor.*` | dsp-wasm | TODO |
| 图表渲染 | REAL | UR:`ui/charts/*`；UR:`docs/architecture/rendering.md` | WEB:`packages/charts/src/webgl/*` + `ChartPlaceholder.tsx` | PARTIAL |
| 功率显示 | REAL | UR:`domain/power_display.h` | charts | TODO |
| 自适应控件 / 弹层 | REAL | UR:`ui/controls/*`；UR:`ui/settings_popover.*`；a143 CONTROL_INVENTORY | apps/web controls | TODO |
| QRhi/D3D11 专用路径 | EXTERNAL→N/A | rendering.md | WebGL/Canvas 替代；记视觉 parity 债 | N/A |

## 标记（Annotations）— 对齐 U4

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 标注模型 | REAL | UR:`domain/annotation.*` | WEB:`packages/domain` | TODO |
| 标注服务 | REAL | UR:`application/annotation_service.*` | store + services | TODO |
| 标注存储 / JSON | REAL | UR:`infrastructure/annotation_store.*` `annotation_json.*` | project-io | TODO |
| 标注 UI | REAL | UR:`ui/annotations/*`；U4 DELIVERY | apps/web | TODO |
| 标签导入 | REAL | UR:`infrastructure/label_import.*`；README TorchSig/TXT | file-io | TODO |
| UI 夹具对象 | DEMO | U4 / README | 测试夹具，勿当 RF 证据 | TODO |

## 窄带（Narrowband）— 对齐架构文档

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 窄带工作区 / 通道 | REAL | UR:`ui/narrowband_workspace.*`；UR:`docs/architecture/narrowband.md`；UR:`docs/acceptance/narrowband.md` | charts + domain selection | TODO |
| CPU DDC/FIR/重采样 | REAL | README；U4「真实 IQ CPU DDC」；channel_processor | dsp + local-compute | TODO |
| 星座 / 解调 / 眼图 | DEMO | README / AGENTS「合成演示」 | 若实现须标 DEMO | TODO |
| `narrowband_demo.iq` | DEMO | UR:`resources/narrowband_demo.iq` | 测试资产 | N/A |

## 检测（Wideband Detection）— 对齐 R6 + a143 W1/W5

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 检测领域模型 | REAL | UR:`domain/detection*.*` | packages/domain | TODO |
| 后处理 / 精修 / 融合 | REAL | UR:`detection_postprocess` / `refinement` / `fusion` / `scn_*` | local-compute + contracts | TODO |
| Worker 协议 | REAL | UR:`infrastructure/detection_protocol.*`；UR:`contracts/.../worker.schema.json` | packages/contracts + service | TODO |
| 模型后端 | REAL+EXTERNAL | UR:`detection_model_backend.*`；TRT env；R6 | service；浏览器内 **BLOCKED** | BLOCKED |
| 检测 UI（含 runId 取消） | REAL | UR:`ui/detection/*`；a143 UX-D01..D08 | apps/web | TODO |
| 工具链 / worker 进程 | REAL+EXTERNAL | UR:`tools/detection_worker/main.cpp` | WEB:`services/local-compute/README.md` | PARTIAL |
| 缺模型 / 无兼容 GPU 降级 | REAL | UR:a143 `evidence/missing-models.json` `no-compatible-gpu.json` | 必须保留明确不可用原因 | TODO |

## UI 壳与 a143 W0–W6

| 源能力 | 分类 | 源证据 | Web 目标 / 现状 | 状态 |
|--------|------|--------|-----------------|------|
| 主窗口壳 | REAL | UR:`app/main_window.*` | WEB:`apps/web/src/App.tsx` | PARTIAL |
| 品牌 | REAL | UR:`ui/brand/*` | theme | TODO |
| W0 基线审计/失败复现 | REAL | UR:a143 `BASELINE_AUDIT.md` | 本文件 + `00_BASELINE_AUDIT` | PARTIAL |
| W2 弹层谱/色板设置 | REAL | UR:a143 DELIVERY / CONTROL_INVENTORY | web popovers | TODO |
| W4 右栏分页 | REAL | UR:a143 EXECUTION_STATUS W4 | web panels | TODO |
| W5 检测可见性/快捷键 | REAL | UR:a143 EXECUTION_STATUS W5 | web shortcuts | TODO |
| W6 全量验收矩阵 | REAL | UR:a143 `ACCEPTANCE_MATRIX.md`（24 项 PASS） | WEB:`docs/acceptance/ACCEPTANCE_MATRIX.md`（Web 占位，未对等） | TODO |

## 变更日志

| 日期（Asia/Shanghai） | 说明 |
|------------------------|------|
| 2026-10-21 17:50:03 | CAO P0 骨架；状态全部 TODO |
| 2026-10-21 17:55:00 | Bot-A：为各行补充分类与 UR/WEB 证据；标记 PARTIAL/BLOCKED；对齐 a143 W0–W6 与 U4/R6 |
