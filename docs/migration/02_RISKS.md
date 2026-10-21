# 02_RISKS — 迁移风险登记

| 字段 | 值 |
|------|-----|
| 更新时间（Asia/Shanghai） | 2026-10-21 17:55:00 |
| 源 HEAD | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` |

## 已识别风险

| ID | 等级 | 描述 | 缓解 | 状态 |
|----|------|------|------|------|
| R-P0-01 | MED | Windows 长路径曾导致部分 `docs/implementation/annotation-interactions/...` checkout 失败 | `core.longpaths=true`；只读克隆于 `signal_studio_rebuild` / `.work` 已恢复关键源树 | MITIGATED |
| R-P0-02 | LOW | `@types/uplot` 等类型 | 使用 uplot 自带类型 / 本地声明 | MITIGATED |
| R-P0-03 | MED | 目标仓库 `yulongpo/web-signal-studio` 远程仍可能未就绪 | P0 起本地 `git init`；暂不绑 origin；P6 前再配置 push | OPEN |
| R-P0-04 | HIGH | GPU / 检测模型权重可能在本机 out/ 且不可分发 | 保留明确失败证据；提供可降级能力；禁止用检测 UI 冒充 | OPEN |
| R-P0-05 | MED | 本地 `signal_studio_rebuild` HEAD=`6499a64`（ahead 2 + dirty）与远程/UR `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` 不一致 | **以 UR/远程 `rebuild/a143-native` HEAD 为唯一基准**；禁止对 rebuild 写入；Bot-A 已复测 | OPEN |
| R-P0-06 | HIGH | 大文件 IQ / 实时交互压力 | WASM + Worker + 抽稀 / 视口渲染；parity 用例 | OPEN |
| R-P0-07 | MED | 原生 shader 图谱 vs WebGL/Canvas 观感差 | uPlot + 必要时 WebGL；记录视觉 parity 债 | OPEN |
| R-A-01 | HIGH | DEMO 窄带星座/解调/眼图被误标为 REAL | 矩阵与验收必须带 DEMO 标签；对照 UR:`README.md` / AGENTS | OPEN |
| R-A-02 | HIGH | Web 侧 `ChartPlaceholder` / contracts stub 被误读为图谱/检测已对等 | 矩阵状态保持 TODO/PARTIAL；交付物禁止写「已对等」除非有证据 | OPEN |
| R-A-03 | MED | a143 产品交付文档引用中间 SHA `399b85e`，远程归档 HEAD 为 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` | 基准锁定 `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af`；中间 SHA 仅作文档溯源 | OPEN |
| R-A-04 | MED | `main` 与 `rebuild/a143-native` 分叉（merge-base `4904740`；左右计数约 8/48） | Web 只跟踪 a143-native，不跟踪 main | OPEN |

## 硬约束（不可违反）

1. `D:\\project\\signal_studio_rebuild` **完全只读**
2. 禁止向 `yulongpo/signal_studio` push
3. 禁止用模拟数据冒充真实 DSP / 模型推理
4. 禁止删除失败测试或伪造通过记录
