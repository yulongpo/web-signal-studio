# 00_BASELINE_AUDIT — 上游源码基线审计骨架

| 字段 | 值 |
|------|-----|
| 文档状态 | SKELETON（P0） |
| 源仓库 | `https://github.com/yulongpo/signal_studio.git` |
| 源分支 | `rebuild/a143-native` |
| 源 HEAD | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` (`0f108d0`) |
| 只读副本 | `D:\project\web_signal_studio\.work\upstream-readonly` |
| 本地 rebuild 对照（只读） | `D:\project\signal_studio_rebuild`（当前检出可为更新本地提交；**不以写操作为准**） |
| 更新时间（Asia/Shanghai） | 2026-10-21 17:50:03 |

## 1. 仓库顶层模块清单（摘要）

| 模块路径 | 角色（摘要） | Web 映射（初拟） |
|----------|--------------|------------------|
| `app/` | 入口 `main.cpp` / `main_window.*` | `apps/web` 壳 + 路由 |
| `application/` | `session` / `annotation_service` | `packages/domain` + 应用 store |
| `domain/` | 工程、标注、检测、谱数据、采样格式 | `packages/domain` |
| `infrastructure/` | 文件 I/O、谱分析、检测 worker/协议、工程存储 | `packages/file-io` / `dsp-wasm` / `services/local-compute` / `project-io` |
| `ui/` | annotations / brand / charts / controls / detection / import | `apps/web` + `packages/charts` |
| `contracts/wideband-detection/` | run / annotation / worker schema + profile | `packages/contracts` |
| `tools/detection` / `tools/detection_worker` | 检测工具与 worker | `services/local-compute` |
| `resources/` | 资源与品牌资产 | `apps/web/public` / `artifacts/assets` |
| `tests/` | 原生测试 | `tests/{parity,e2e,integration}` |
| `docs/` | 架构 / 实现 / 验收 | `docs/*`（本仓库） |
| `cmake/` | 构建 | 不适用（Web 用 Vite/npm） |

## 2. Domain 文件清单（只读摘录）

- `project.*` — 工程模型
- `annotation.*` — 标注
- `detection*.*` / `scn_detection_postprocess.*` / `detection_refinement*.*` / `detection_refined_fusion.*` — 检测与后处理
- `sample_format.*` / `spectral_data.h` / `power_display.h` — 采样与谱显示

## 3. Infrastructure 文件清单（只读摘录）

- 加载：`source_loader` / `raw_sample_reader` / `int16_iq_file` / `wav_metadata` / `sigmf_metadata` / `import_controller`
- 谱：`spectral_analysis` / `spectral_windows` / `channel_processor`
- 检测：`detection_*`（task / worker_client / model_backend / store / protocol / projection / time&frequency analysis 等）
- 持久化：`project_store` / `annotation_store` / `format_template_store` / `label_import`

## 4. UI 子树

- `ui/annotations` `ui/brand` `ui/charts` (+ shaders) `ui/controls` `ui/detection` `ui/import`

## 5. Contracts

- `contracts/wideband-detection/v1/{annotation,run,worker}.schema.json`
- `contracts/wideband-detection/profiles/ffscn-gui-iq-v1.json`

## 6. P1 待填

- [ ] 逐文件依赖图与调用链
- [ ] 关键交互（加载 / 图谱 / 标记 / 窄带 / 检测）状态机
- [ ] GPU / 模型路径与阻断证据模板
- [ ] 与 Web 包边界的精确接口草案
