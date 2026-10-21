# 00_BASELINE_AUDIT — 原生源码能力盘点骨架

| 字段 | 值 |
|------|-----|
| 文档状态 | ENRICHED（Bot-A 审计增补 REAL/DEMO/EXTERNAL 证据链；基于 CAO P0 `7bffc73`） |
| 源仓库 | `https://github.com/yulongpo/signal_studio.git` |
| 源分支 | `rebuild/a143-native` |
| 源 HEAD | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` (`0f108d0`) |
| 只读镜像 | `D:\\project\\web_signal_studio\\.work/upstream-readonly`（已核对 `git rev-parse HEAD` = 源 HEAD） |
| 本地 rebuild 快照（只读） | `D:\\project\\signal_studio_rebuild`（当前本地 `6499a64`，ahead 2 + dirty；**不以写、不以本地为基准**） |
| 核对时间（Asia/Shanghai） | 2026-10-21 17:55:00 |

## 0. 证据约定

分类标签用于迁移优先级与冒充风险控制：

| 标签 | 含义 | 判定依据 |
|------|------|----------|
| **REAL** | 正式产品能力：真实 DSP / 持久化 / TensorRT worker / 已验收 UI | README / AGENTS / U4·R6·a143 DELIVERY / CMake 实目标 |
| **DEMO** | 明确标注的合成演示或夹具，不可宣称 RF 精度 | README「合成演示」、`resources/narrowband_demo.iq`、AGENTS |
| **EXTERNAL** | 不在 Git 树内或强依赖本机 SDK/驱动/大资产 | Qt/TRT/CUDA env、`out/` 模型、`detection_model_runtime.cmake` |

路径前缀：
- `UR:` → `.work/upstream-readonly/...`（本仓只读镜像，SHA=0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af）
- `RB:` → `D:/project/signal_studio_rebuild/...`（只读对照，可能漂移）
- `WEB:` → 本仓 Web 树相对路径

## 1. 仓库顶层模块清单

| 模块路径 | 角色（摘要） | 分类 | 关键证据 | Web 映射（预期） |
|----------|--------------|------|----------|------------------|
| `app/` | 入口 `main.cpp` / `main_window.*` | REAL | UR:`app/main_window.cpp`；UR:`README.md`「工程、图谱与标记」 | WEB:`apps/web/src/App.tsx` |
| `application/` | `session` / `annotation_service` | REAL | UR:`application/session.*`；UR:`application/annotation_service.*` | WEB:`packages/domain` + 应用 store（未齐） |
| `domain/` | 工程、标注、检测、谱数据、样本格式 | REAL | UR:`domain/project.*` `annotation.*` `detection*.*` `sample_format.*` | WEB:`packages/domain/src/*`（目前仅 `sample-range.ts`） |
| `infrastructure/` | 文件 I/O、谱分析、检测 worker/协议、工程存储 | REAL | UR:`infrastructure/`（54 files）；加载/谱/检测/持久化见 §3 | WEB:`packages/file-io` / `services/local-compute` |
| `ui/` | annotations / brand / charts / controls / detection / import / narrowband | REAL(+DEMO 窄带演示页) | UR:`ui/charts/*` `ui/detection/*` `ui/narrowband_workspace.*` | WEB:`apps/web` + `packages/charts` |
| `contracts/wideband-detection/` | run / annotation / worker schema + profile | REAL | UR:`contracts/wideband-detection/v1/*.schema.json`；`profiles/ffscn-gui-iq-v1.json` | WEB:`packages/contracts`（已有 chunk/formats/spectral stub） |
| `tools/detection` / `tools/detection_worker` | 检测工具链与隔离 worker | REAL(+EXTERNAL TRT) | UR:`tools/detection_worker/main.cpp`；UR:`cmake/detection_model_runtime.cmake` | WEB:`services/local-compute`（仅 README stub） |
| `resources/` | 品牌与演示资产 | DEMO(+品牌 REAL) | UR:`resources/narrowband_demo.iq`；UR:`resources/branding/` | WEB:`apps/web/public`（待建） |
| `tests/` | 原生回归 | REAL | UR:`tests/`；a143 evidence UX/UI CTest | WEB:`*.test.ts` / 未来 parity |
| `docs/` | 架构 / 实现 / 验收 | REAL | UR:`docs/implementation/wideband-ux-optimization/a143-native/*` | WEB:`docs/*` |
| `cmake/` | 构建与 runtime 部署 | EXTERNAL 相关 | UR:`cmake/detection_model_runtime.cmake` `deploy_runtime.cmake` | N/A（Vite/npm） |

## 2. Domain 文件清单（摘录 + 分类）

| 文件（相对 domain/） | 分类 | 证据 |
|----------------------|------|------|
| `project.*` | REAL | UR:`domain/project.h`；README 工程格式 **v6** |
| `annotation.*` | REAL | UR:`domain/annotation.*`；U4 DELIVERY |
| `detection*.*` / `scn_detection_postprocess.*` / `detection_refinement*.*` / `detection_refined_fusion.*` | REAL | UR:`domain/detection*.*`；R6 DELIVERY |
| `sample_format.*` / `spectral_data.h` / `power_display.h` | REAL | UR 同名；谱参数架构文档 |

## 3. Infrastructure 文件清单（摘录 + 分类）

| 能力簇 | 代表路径 | 分类 | 证据 |
|--------|----------|------|------|
| 加载 | `source_loader` / `raw_sample_reader` / `int16_iq_file` / `wav_metadata` / `sigmf_metadata` / `import_controller` | REAL | UR:`infrastructure/`；README RAW/SigMF/WAV；UR:`docs/acceptance/iq-file-int16.md` |
| 谱 | `spectral_analysis` / `spectral_windows` / `channel_processor` | REAL | UR 同名；README PSD·STFT |
| 检测 | `detection_task` / `detection_worker_client` / `detection_model_backend` / `detection_protocol` / store / projection | REAL + **EXTERNAL**(TRT/引擎) | UR:`infrastructure/detection_model_backend.*`；UR:`cmake/detection_model_runtime.cmake`；README `SS_DETECTION_TRT_ROOT` |
| 持久化 | `project_store` / `annotation_store` / `format_template_store` / `label_import` | REAL | UR 同名；README v6 原子发布 |

## 4. UI 子树

| 子树 | 分类 | 证据 |
|------|------|------|
| `ui/annotations` | REAL | UR:`ui/annotations/*`；U4 |
| `ui/brand` | REAL | UR:`ui/brand/*` |
| `ui/charts` (+ shaders) | REAL | UR:`ui/charts/*`；UR:`docs/architecture/rendering.md`（QRhi D3D11） |
| `ui/controls` | REAL | UR:`ui/controls/*`；a143 CONTROL_INVENTORY |
| `ui/detection` | REAL | UR:`ui/detection/*`；a143 ACCEPTANCE_MATRIX UX-D* |
| `ui/import` | REAL | UR:`ui/import/*` |
| `ui/narrowband_workspace.*` | REAL 通道/谱 + **DEMO** 星座/解调/眼图 | UR:`ui/narrowband_workspace.*`；README「窄带识别/解调、星座和眼图仍为明确标示的合成演示」；UR:`docs/architecture/narrowband.md`；UR:`docs/acceptance/narrowband.md` |

## 5. Contracts

- REAL：UR:`contracts/wideband-detection/v1/{annotation,run,worker}.schema.json`
- REAL：UR:`contracts/wideband-detection/profiles/ffscn-gui-iq-v1.json`
- WEB stub：WEB:`packages/contracts/src/{chunk,formats,sample-index,spectral}.ts`

## 6. REAL / DEMO / EXTERNAL 总表（迁移必读）

### 6.1 REAL（必须对等或明确降级说明）

| 能力 | 源证据 | Web 现状 |
|------|--------|----------|
| 工程 v6 创建/打开/备份 | UR:`README.md`；UR:`domain/project.*`；U4 | WEB:`apps/web/src/components/ProjectTree.tsx` 占位；project-io 包未落地 |
| 顺序加载 / 前缀分析 / 导航包络 | UR:`README.md`；infrastructure loader | WEB:`packages/file-io/src/chunked-reader.ts`（分块读 stub） |
| 宽/窄带 PSD·STFT·瀑布·物理轴 | UR:`docs/architecture/rendering.md`；charts | WEB:`packages/charts` WebGL stub + `ChartPlaceholder.tsx` |
| 三来源标记 / 软删 / 修订 / 通道 DDC | UR:`docs/implementation/annotation-interactions/U4/DELIVERY.md` | 未实现 |
| 宽带离线检测（任务/ROI/取消/证据） | UR:`docs/implementation/wideband-detection/R6/DELIVERY.md`；a143 DELIVERY | 未实现 |
| a143 UX W0–W6（弹层参数、右栏分页、runId 取消等） | UR:`docs/implementation/wideband-ux-optimization/a143-native/{DELIVERY,ACCEPTANCE_MATRIX,EXECUTION_STATUS}.md` | WEB:`docs/acceptance/ACCEPTANCE_MATRIX.md` 仅为 Web 侧占位 |

### 6.2 DEMO（禁止冒充 REAL）

| 能力 | 源证据 | 备注 |
|------|--------|------|
| 窄带星座 / 解调 / 眼图 | UR:`README.md`「合成演示」；AGENTS 同口径 | Web 若做 UI 必须打 DEMO 标签 |
| `narrowband_demo.iq` 内嵌夹具 | UR:`resources/narrowband_demo.iq`；CMake `qt_add_resources(...narrowband_demo)` | 测试/演示专用 |
| UI 夹具对象（部分标注交互场景） | UR:U4 DELIVERY / README | 与真实 IQ/模型前向分开记录 |

### 6.3 EXTERNAL（Git 外 / 本机依赖）

| 依赖 | 源证据 | 风险 |
|------|--------|------|
| Qt **6.11.1 EXACT** | UR:`CMakeLists.txt` `find_package(Qt6 6.11.1 EXACT ...)`；`SS_QT_ROOT` | Web 不直接依赖；原生对照构建需要 |
| TensorRT **10.11.0.33** / CUDA **12.9** | UR:`README.md`；`SS_DETECTION_TRT_ROOT`；UR:`cmake/detection_model_runtime.cmake` | 模型推理不可在浏览器内复刻；需 local-compute + 明确不可用原因 |
| 模型包 / TRT·CUDA DLL（`out/`，Git 忽略） | UR:`README.md`「Git clone 不包含」；R6 MODEL_DEPLOYMENT | clone 无资产；缺模型须走 missing-models 路径（a143 evidence） |
| 冻结验证 GPU：RTX 5060 / SM 12.0 | UR:R6 / a143 evidence | 不承诺其它 GPU 直接复用序列化引擎 |

## 7. P1 后续（仍开放）

- [ ] 逐文件调用图与状态机
- [ ] 关键对象契约（工程 / 图谱 / 标记 / 窄带 / 检测）状态机
- [ ] GPU / 模型路径与失败证明模板（对齐 a143 `missing-models` / `no-compatible-gpu`）
- [ ] 与 Web 包边界的精确接口草约（续 ARCHITECTURE / WEB_NATIVE_PROTOCOL）

## 8. 增补记录

| 时间（Asia/Shanghai） | 作者 | 说明 |
|------------------------|------|------|
| 2026-10-21 17:50:03 | CAO | P0 骨架（`7bffc73`） |
| 2026-10-21 17:55:00 | Bot-A | 独立审计：核对 UR HEAD=`0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af`；补 REAL/DEMO/EXTERNAL 证据链与 Web 对照 |
