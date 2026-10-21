# ACCEPTANCE_MATRIX（初稿）

> 维护：WSS-QA-G。状态含义：`TODO` 未测 · `WIP` 实现中 · `PASS` 有 `artifacts/validation/` 证据 · `FAIL` 有失败证据 · `N/A` 本阶段不适用 · `BLOCKED` 外部阻断。  
> **禁止**仅凭实现者口头/聊天自述改为 `PASS`。

更新时间（Asia/Shanghai）：2026-10-21

## 总览门禁

| 阶段 | 名称 | 判定 | 证据入口 |
|------|------|------|----------|
| P0 | 脚手架 / 上游基线 / 文档 | PASS | `artifacts/validation/p0_qa_baseline_*.md` + matrix/docs @ tip `631f22a` |
| P1 | 审计 + 契约 | PASS | M-10 BigInt contracts PASS; Q-03/Q-04 license/secrets PASS |
| P2 | Web 主壳 / 加载 / 图谱 / 标记 | PASS | M-01..M-06 + C-01..C-04 PASS (Playwright/charts evidence) |
| P3 | DSP WASM / local-compute | PASS | M-07 DDC e2e + dsp-wasm/local-compute evidence PASS |
| P4 | 宽带检测 | PASS | M-09 FFSCN/SCN degrade / no-model path PASS (live GPU N/A) |
| P5 | 持久化 + E2E + 性能 | PASS | M-08 v6 + M-06 Playwright evidence; charts-playwright CI; non-charts e2e still disabled in CI (known limit) |
| P6 | 回归 + 发布 | PASS | Q-01..Q-05 PASS; delivery manifest + FINAL_CHECKLIST_DRAFT (`FINAL_DELIVERED` not claimed) |

## 源 → Web 对等（抽样骨架）

| ID | 源能力（Qt / rebuild） | Web 落点 | 验收方式 | 状态 | 证据 |
|----|------------------------|----------|----------|------|------|
| M-01 | 工程打开 / 最近文件 | `packages/project-io` + `apps/web` | 单元 + E2E | PASS | Bot-G @ tip `01d121e` (B-P4 `20a3792`) / CI [run 39593100315](https://github.com/yulongpo/web-signal-studio/actions/runs/39593100315)：`m01_project_io_2026-10-21.json` assertions (open/save/clear + decimal sampleCount) + `m01_project_export_probe.json` (v6 / sampleCount string) + open/saved/cleared PNGs; Playwright `e2e/project-io.spec.ts` (e2e non-charts still disabled in CI — evidence committed) |
| M-02 | RAW / SigMF / WAV 分块读 | `packages/file-io` | 单测 + fixtures | PASS | Bot-G @ tip `8f09dbc` / CI [run 39594324401](https://github.com/yulongpo/web-signal-studio/actions/runs/39594324401)：Bot-D golden `m02-chunked-formats.golden.test.ts` **12/12** + file-io **31/31** (independent re-run); Bot-B Playwright/vitest open `m02_chunked_open_2026-10-21.json` + WAV/RAW/SigMF PNGs 1280×720 + `m02E2eFixturesOpen.test.ts` **3/3**; paths `docs/acceptance/evidence/bot-d/m02_*` + `docs/acceptance/evidence/bot-b/m02_chunked_open_*`; implementers `matrix_pass_claimed:false` |
| M-03 | PSD / STFT / 瀑布 | `packages/dsp-wasm` + `packages/charts` | 数值 golden + 截图 | PASS | Bot-G @ tip `3ad9035` / CI [run 39589623844](https://github.com/yulongpo/web-signal-studio/actions/runs/39589623844)：ANGLE/SwiftShader 健康截图 + charts **52/52**；software GL / toDataURL；`docs/acceptance/evidence/bot-c/` |
| M-04 | 平移缩放 / DPR / 交互预览 | `packages/charts` + `apps/web` | Playwright | PASS | Bot-G @ tip `0898ec7` / CI [run 39591371842](https://github.com/yulongpo/web-signal-studio/actions/runs/39591371842)：`charts-playwright` **success**；ANGLE/SwiftShader；`webglState=ok`；C-03 cssW tracks viewport via forced CSS + expect.poll (0898ec7)；ancestor of tip `b82e324`；`docs/acceptance/evidence/bot-c/` + artifact upload |
| M-05 | 宽窄带工作区布局 | `apps/web` | E2E + 对照截图 | PASS | Bot-G @ tip `01d121e` (B-P4)：`m05_workspace_2026-10-21.json` assertions (status-workspace toggle, stub-explicit, no fake DDC, chart/detect retained) + wideband/narrowband-stub PNGs; Playwright `e2e/workspace.spec.ts` (not screenshots-only) |
| M-06 | 标记 / 通道快照 / 撤销重做 | `packages/domain` + `project-io` | 单测 + E2E | PASS | Bot-G @ tip `0ac2aca` / CI [run 39597153029](https://github.com/yulongpo/web-signal-studio/actions/runs/39597153029)：closes prior WIP (missing Playwright UI @ 8d255a2); Bot-B `e2e/m06-marks.spec.ts` + `M06MarksPanel` + `installM06E2eHook(window)` always-on in `main.tsx`; evidence `docs/acceptance/evidence/bot-b/m06_marks_undo_2026-10-21.json` (marks/snapshot/undo-redo/decimal past-2^53/exportJson assertions true) + `m06_marks_panel.png`; prior Bot-F unit `docs/acceptance/evidence/bot-f/m06_*`; e2e non-charts still disabled in CI (same bar as M-01/M-05); B `matrix_pass_claimed:false` |
| M-07 | DDC / FIR / 有理重采样 | `packages/dsp-wasm` / local-compute | 数值对照 | PASS | Bot-G @ tip `01d121e` / ancestor `03a8e58` CI [run 39592883096](https://github.com/yulongpo/web-signal-studio/actions/runs/39592883096)：`m07_narrowband_ddc_e2e_2026-10-21.{json,md}` — chunked→Worker processDdc→optional baseband STFT/PSD; JS vs WASM ≤2e-5 (`DDC_SAMPLE_ABS_EPS`); goldens + web helper tests; D `matrix_pass_claimed:false` but evidence meets gate |
| M-08 | 工程 v6 互操作 | `packages/project-io` | fixtures 往返 | PASS | Bot-G @ tip `8f09dbc` / ancestor `01ea6b9`/`2277ec5` / CI [run 39594324401](https://github.com/yulongpo/web-signal-studio/actions/runs/39594324401)：project-io **13/13** (9 + m08 fixture 4; independent re-run); fixtures `v6-realistic-project.json` (uint64-max sampleCount + past-2^53 indexes) + `v6-annotations-three-sources.json`; evidence `docs/acceptance/evidence/bot-f/m08_*` + `M-08-v6-roundtrip.md`; F `matrix_pass_claimed:false` |
| M-09 | FFSCN/SCN 检测 + 降级 | `services/local-compute` | 冒烟 + 无模型路径 | PASS | Bot-G @ tip `8d255a2` / CI [run 39595342041](https://github.com/yulongpo/web-signal-studio/actions/runs/39595342041)：independent pytest **59 passed, 4 skipped** (`LOCAL_COMPUTE_DISABLE_TORCH=1`; live CUDA/weight smokes skipped); FastAPI evidence `docs/acceptance/evidence/bot-e/` — capabilities degrade (`ffscn/scn=false`, `canInventResults=false`), no-model BLOCKED + result=null, cancel exact runId→cancelled, WEIGHT_HASH_MISMATCH/MODEL_HASH_MISMATCH, TENSORRT_NA/.engine N/A (task BLOCKED, no invent); E `matrix_pass_claimed:false`; live GPU forward N/A (out of this gate) |
| M-10 | BigInt 索引协议 | contracts / domain | 契约测试 | PASS | Bot-G @ tip `8d255a2` / ancestor `2cdc34a`/`8c7c4db` / CI [run 39595342041](https://github.com/yulongpo/web-signal-studio/actions/runs/39595342041)：contracts+domain BigInt protocol (past-2^53 decimals, uint64 max, reject Number wire, SampleRange JSON align); independent vitest `sample-index` **12** + `sample-range` **5** (suite **53/53**); evidence `docs/acceptance/evidence/bot-f/m10_*` + `M-10-bigint-index.md`; F `matrix_pass_claimed:false` |


## Bot-C 图谱引擎（实现证据）

> PASS 仅由 WSS-QA-G 独立证据复核后改写：M-04 @ `0898ec7`/`b82e324` → **PASS**；C-02 / M-01 / M-05 / M-07 @ tip `01d121e` → **PASS**。

| ID | 能力 | 落点 | 验收方式 | 状态 | 证据 |
|----|------|------|----------|------|------|
| C-01 | WebGL2 标量纹理 + 独立 LUT 热图 | `packages/charts` HeatmapRenderer / SpectrumChart | 单测 + 嵌入 demo | PASS | Bot-G @ `3ad9035` / run 39589623844：gpuAvailable + ANGLE/SwiftShader 健康截图；software GL / toDataURL；`BOT_C_PROBE_INDEX.md` |
| C-02 | 显示态切片提取（display-only） | `tile/displayExtract` | 单元 + probe | PASS | Bot-G @ tip `01d121e` / ancestor C-P3 `c99df01`：live `c02_display_only_extract_live_2026-10-21.json` dualWrite byte-identical docs+artifacts; real extracts (grid/viewport/tileSource preview+refine) with extractMs/sourceWindow/dataPeak/dataFnv1a; `runC02LiveDisplayOnlyExtractProbe` + vitest; not schema-only; C no self-PASS |
| C-03 | DPR / canvas resize | `dpi/canvasSizing` | 单测 + probe dpr 字段 | PASS | Bot-G @ `3ad9035` / run 39589623844：dpr×css buffer 核验；tile/DPI probe；software GL |
| C-04 | 拖拽/滚轮预览-细化 + WebGL context restore | `interaction/*` + `webgl/contextRestore` + SpectrumChart | 单测 + P50/P95 probe | PASS | Bot-G @ `3ad9035` / run 39589623844：live lose_context restore；`CONDENSED_interaction_p95.json`；software GL |

## CI / DevOps / 安全

| ID | 项 | 状态 | 证据 |
|----|----|------|------|
| Q-01 | `.github/workflows/ci.yml` lint/typecheck/unit/build | PASS | Bot-G @ tip `1931398` / CI [run 39593427109](https://github.com/yulongpo/web-signal-studio/actions/runs/39593427109) (main success: web lint/typecheck/unit/build + charts unit + charts-playwright); branch run [39593321257](https://github.com/yulongpo/web-signal-studio/actions/runs/39593321257); obsolete FAIL `a904334` superseded — `docs/acceptance/evidence/bot-g/q01_ci_refresh_2026-10-21.{md,json}` |
| Q-02 | Playwright E2E（真实本机/CI 服务） | PASS（本地） | `tests/e2e/shell-nav.spec.ts` + `artifacts/validation/p1g/e2e.log` |
| Q-03 | 许可证 / 依赖扫描 | PASS | Bot-G P6: root `LICENSE` (MIT) + `"license": "MIT"` on root and all `@wss/*` packages (closes prior UNLICENSED=`@wss/web` + missing LICENSE); evidence `docs/acceptance/evidence/bot-g/q03_license_close_2026-10-21.{md,json}` + `artifacts/validation/license/REPORT.md` |
| Q-04 | 无密钥 / 大样本入 Git | PASS | Bot-G P6 secrets sweep: no pattern hits; only `.env.example`; tiny fixtures only; `.gitignore` tightened (env/credentials/keys/weights/IQ) + delivery allowlist — `docs/acceptance/evidence/bot-g/q04_secrets_gitignore_2026-10-21.{md,json}` |
| Q-05 | `artifacts/delivery/manifest.json` | PASS | Bot-G P6 @ tip `631f22a` / CI [run 39597608528](https://github.com/yulongpo/web-signal-studio/actions/runs/39597608528): `packagingKind=evidence_path_manifest`; sha256 inventory in `artifacts/delivery/sha256sums.txt` + filled `delivery.artifacts`; tip/CI/license/packages/evidence paths; `finalDeliveredClaimed:false`; draft `docs/acceptance/FINAL_CHECKLIST_DRAFT.md`; evidence `docs/acceptance/evidence/bot-g/q05_delivery_manifest_2026-10-21.md` |
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
| 2026-10-21 | Bot-C | evidence package: M-03/M-04→WIP + C-01..C-04；`docs/acceptance/evidence/bot-c/`（**不宣称 PASS**；commits `7b21dff`/`694dc10`，tip `610a79c`） |

| 2026-10-21 | Bot-C | QA-G re-review: healthy WebGL screenshots + live GPU/DPR/context-restore probes (**仍 WIP，不自报 PASS**); vitest **52**; ANGLE/SwiftShader Playwright |
| 2026-10-21 | Bot-C | QA-G evidence gaps M-03/M-04 + C-01..C-04 under `docs/acceptance/evidence/bot-c/` (**仍 WIP，不自报 PASS**); golden+Playwright+GPU/LUT/displayOnly/resize/restore probes |
| 2026-10-21 | Bot-C | CI `charts-playwright` hard-enable + C-02 dual-write to `artifacts/validation/bot-c/` (**M-04/C-02 仍 WIP，不自报 PASS**) |
| 2026-10-21 | WSS-QA-G | Bot-G 独立复核 @ tip `3ad9035` / CI run 39589623844：M-03/C-01/C-03/C-04 → **PASS**（ANGLE/SwiftShader；charts 52/52；software GL / toDataURL）；M-04/C-02 仍 WIP |
| 2026-10-21 | WSS-QA-G | Bot-G 独立复核 @ tip `8a35dfc` / CI run 39590792956（failure）：M-04/C-02 **保持 WIP**（charts-playwright 硬开但失败；C-02 dualWrite 双路径 OK 但证据仍 schema-only）；charts unit **55/55**；祖先含 `389b135` |
| 2026-10-21 | WSS-QA-G | Bot-G independent re-review @ tip `0898ec7`→`b82e324` / CI run 39591371842 (charts-playwright success)：M-04 → **PASS**；C-02 / M-01 / M-05 / M-07 **keep WIP** (C-02 schema-only; M-01 no dedicated evidence; M-05 screenshots-only; M-07 golden present but D no PASS claim) |
| 2026-10-21 | Bot-C | C-P3 @ tip after f9f4616: C-02 **live** display-only tile extract dual-write (c02_display_only_extract_live_*.json) + interaction p95/idle-settle evidence (**C-02 still WIP, no self-PASS**; M-04 already PASS by G) |
| 2026-10-21 | WSS-QA-G | Bot-G independent re-review @ tip `01d121e` (C-P3/M-07/B-P4)：C-02 / M-07 / M-01 / M-05 → **PASS**；p95/idle FYI only (C-04/M-04 already PASS)；CI run 39593100315 success (e2e non-charts still skipped) |
| 2026-10-21 | WSS-QA-G | P6 wrap-up @ tip `1931398`: Q-01→**PASS** (CI green run 39593427109); Q-03→**PASS** (MIT LICENSE + package SPDX); Q-04→**PASS** (secrets sweep + gitignore); Q-05→**WIP** (delivery manifest skeleton) |
| 2026-10-21 | WSS-QA-G | Bot-G independent re-review @ tip `8f09dbc` / CI run 39594324401：M-02 / M-08 → **PASS** (file-io 31/31 + m02 golden 12; Bot-B open evidence+PNGs; project-io 13/13 v6 fixtures; e2e non-charts still skipped in CI) |
| 2026-10-21 | Bot-E | M-09 evidence @ baseline `8c7c4db`：`docs/acceptance/evidence/bot-e/`（**WIP，`matrix_pass_claimed: false`，不自报 PASS**）；无模型/无 GPU BLOCKED；TensorRT `.engine` N/A |
| 2026-10-21 | CAO | **FINAL_DELIVERED** claimed @ packaging tip `d77e34b` / baseline `631f22a`; known limits accepted (non-charts e2e off-CI; real detect needs weights; evidence-path manifest) |
