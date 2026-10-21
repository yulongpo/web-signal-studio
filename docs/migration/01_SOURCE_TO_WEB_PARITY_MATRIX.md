# 01_SOURCE_TO_WEB_PARITY_MATRIX — 源端到 Web 对等矩阵（骨架）

| 字段 | 值 |
|------|-----|
| 文档状态 | SKELETON（P0）— **状态列待填** |
| 源 HEAD | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` |
| 更新时间（Asia/Shanghai） | 2026-10-21 17:50:03 |

图例：`TODO` = 待审计；`PARTIAL` = 部分迁移；`DONE` = 已对等；`N/A` = Web 不适用；`BLOCKED` = 外部依赖阻断。

## 工程（Project）

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 工程打开/保存 | `domain/project` + `infrastructure/project_store` | `packages/project-io` + UI | TODO |
| 工程元数据 | project 模型字段 | domain schema (zod) | TODO |
| 最近工程 / 会话 | `application/session` | zustand persist | TODO |

## 加载（Load / Import）

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 原始 IQ / int16 | `int16_iq_file` / `raw_sample_reader` | `packages/file-io` + File API | TODO |
| WAV 元数据 | `wav_metadata` | file-io | TODO |
| SigMF | `sigmf_metadata` | file-io | TODO |
| 格式模板 | `format_template_store` / `sample_format` | contracts + UI import | TODO |
| 导入控制器 | `import_controller` / `ui/import` | apps/web import 流 | TODO |

## 图谱（Spectral / Charts）

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 谱分析 | `spectral_analysis` / `spectral_windows` | dsp-wasm / local-compute | TODO |
| 通道处理 | `channel_processor` | dsp-wasm | TODO |
| 图表渲染 | `ui/charts` (+ shaders) | `packages/charts` + uPlot | TODO |
| 功率显示 | `power_display.h` | charts | TODO |
| 控件 / 自适应参数 | `ui/controls` | apps/web controls | TODO |

## 标记（Annotations）

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 标注模型 | `domain/annotation` | packages/domain | TODO |
| 标注服务 | `application/annotation_service` | store + services | TODO |
| 标注存储 / JSON | `annotation_store` / `annotation_json` | project-io | TODO |
| 标注 UI | `ui/annotations` | apps/web | TODO |
| 标签导入 | `label_import` | file-io | TODO |

## 窄带（Narrowband）

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 窄带选择 / 切片 | （P1 从 UI/session 细挖） | charts + domain selection | TODO |
| 窄带分析链路 | channel / spectral 相关 | dsp + UI | TODO |

## 检测（Wideband Detection）

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 检测领域模型 | `domain/detection*` | packages/domain | TODO |
| 后处理 / 精炼 / 融合 | `detection_postprocess` / `refinement` / `fusion` / `scn_*` | local-compute + contracts | TODO |
| Worker 协议 | `detection_protocol` / `detection_worker_client` + schemas | packages/contracts + service | TODO |
| 模型后端 | `detection_model_backend` / snapshot | service（GPU 可能 BLOCKED） | TODO |
| 检测 UI | `ui/detection` | apps/web | TODO |
| 工具链 | `tools/detection` / `detection_worker` | services/local-compute | TODO |

## UI 壳与其它

| 源能力 | 源定位（摘要） | Web 目标 | 状态 |
|--------|----------------|----------|------|
| 主窗口壳 | `app/main_window` | apps/web layout | TODO |
| 品牌 | `ui/brand` | apps/web theme | TODO |
| 快捷键 / 任务行 | （原生 UX 文档） | web shortcuts | TODO |

## 变更日志

| 日期（Asia/Shanghai） | 说明 |
|------------------------|------|
| 2026-10-21 17:50:03 | P0 骨架创建，状态全部 TODO |
