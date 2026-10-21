# UI parity gap patch — Web `196db21` vs desktop `17471a6`

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-21 21:28:00 |
| Author | Bot-A (`work/bot-a-audit`) |
| Desktop | `rebuild/a143-native` **`17471a6`** = `17471a6488383b456281d12cb1a6d3d80290205d`（unchanged） |
| Prior Bot-A tip | `16abb2a`（audit vs Web `563458a`） |
| **This Web tip** | **`196db21`** = `196db218cee37d2e212a6c3a20a409138e33d52a` |
| Scope | Re-base incremental audit only; **no implementation edits** |

## What landed on Web since `563458a`

| Commit | Subject |
|--------|---------|
| `60b3a90` | feat(charts): G03–G05 tri-chart nav/aux/splitter embeddables (WIP) |
| `8c14346` | chore(charts): track bot-c ui-parity evidence screenshots |
| `ebdf359` | docs(bot-c): STATUS desktop对照 @ 17471a6 + f9f05bb note |
| `196db21` | merge(bot-c): G03–G05 nav/aux charts + VerticalSplitter |

## Status deltas (G03–G05 only)

| ID | Was @ `16abb2a`/`563458a` | Now @ `196db21` | Evidence | Residual (blocks full PASS) |
|----|---------------------------|-----------------|----------|------------------------------|
| **G03** | OPEN（placeholder） | **PARTIAL** | `NavChartHost` + `NavigationChart`；`global-nav` 无 placeholder 文案；`data-testid="navigation-chart"`；窗与主图 `timeSec` 联动；e2e + `g03-global-nav.png` | 无桌面 zoom/pause / 导航图头设置条（`f9f05bb`→Bot-B）；默认条高 36px |
| **G04** | OPEN（ChartPlaceholder） | **PARTIAL** | `AuxChartHost` + `WaveformChart`；Wave/PSD 切换改 `data-chart-kind`；无 ChartPlaceholder；e2e + screenshots | **Wave = STFT time-envelope**，非 raw IQ（Bot-D follow-up）；无谱前显示 Waiting |
| **G05** | OPEN（CSS 固定） | **PARTIAL** | `VerticalSplitter` ×2：`splitter-nav-aux` / `splitter-aux-main`；拖拽改高；双击复位；e2e | 默认 **36/160** CSS px，桌面 enforceLayout **82/205** 未对齐 |

## Unchanged from `16abb2a` audit

- Desktop tip still `17471a6`（f9f05bb / a64117e / 696ce12 加严仍适用）。
- G01–G02 / G06–G10 / G15–G18 / G21–G24：仍 OPEN（G02/G06/G18 加严保留）。
- G11–G14 / G19–G20 / G26：仍 PARTIAL；G25 DOCS。
- **G02 note**：`196db21` 上 `SpectrumToolbar` **仍**夹在 aux↔main（`App.tsx`），G05 splitter 落地不关闭 G02。

## Counts after this patch

| 状态 | IDs |
|------|-----|
| OPEN | G01–G02, G06–G10, G15–G18, G21–G24 |
| PARTIAL | **G03–G05**, G11–G14, G19–G20, G26 |
| DOCS | G25 |
| CLOSED | （无） |

P0 仍 14 个 ID；其中 G03–G05 现为 PARTIAL。

## Canonical docs updated

- `artifacts/validation/ui-parity/baseline/UI_PARITY_GAP_AUDIT.md`
- `artifacts/validation/ui-parity/baseline/UI_PARITY_ACCEPTANCE.md`
- mirrors: `docs/migration/ui-parity/*`
- `docs/migration/UPSTREAM_BASELINE.json` / `UPSTREAM_SYNC_LOG.md`

**No self-PASS for G03–G05.** Bot-C STATUS agrees.
