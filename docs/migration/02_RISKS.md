# 02_RISKS — 风险与阻断登记

| 字段 | 值 |
|------|-----|
| 更新时间（Asia/Shanghai） | 2026-10-21 17:50:03 |
| 源 HEAD | `0f108d0a1ad1ebbfcf1aac85ca3f8a34b10188af` |

## 已识别风险

| ID | 级别 | 描述 | 缓解 | 状态 |
|----|------|------|------|------|
| R-P0-01 | MED | Windows 长路径导致上游 `docs/implementation/annotation-interactions/...` checkout 失败 | `core.longpaths=true`；只读审计可用 `signal_studio_rebuild`；`.work` 已恢复主要源树 | MITIGATED |
| R-P0-02 | LOW | `@types/uplot` 不存在 | 使用 uplot 自带类型 / 本地声明 | MITIGATED |
| R-P0-03 | MED | 目标仓库 `yulongpo/web-signal-studio` 可能尚不存在 | P0 仅本地 `git init`，暂不设 origin；P6 前创建并 push | OPEN |
| R-P0-04 | HIGH | GPU / 检测模型权重可能在本机不可用 | 保留明确阻断证据，继续完成独立功能；禁止用假推理冒充 | OPEN |
| R-P0-05 | MED | 本地 `signal_studio_rebuild` 检出提交（`6499a64`）可能与远端 `0f108d0` 不一致 | 以远端 `rebuild/a143-native` HEAD 为对齐基准；持续 `fetch` 差异分析 | OPEN |
| R-P0-06 | HIGH | 大文件 IQ / 实时谱性能 | WASM + Worker + 抽稀 / 视口渲染；parity 测试 | OPEN |
| R-P0-07 | MED | 原生 shader 图表 vs WebGL/Canvas 能力差 | uPlot + 必要时 WebGL；记录视觉 parity 差距 | OPEN |

## 硬约束（不可违反）

1. `D:\project\signal_studio_rebuild` **完全只读**
2. 禁止向 `yulongpo/signal_studio` push
3. 禁止用模拟数据冒充真实 DSP / 模型推理
4. 禁止删除失败测试或虚构通过结果
