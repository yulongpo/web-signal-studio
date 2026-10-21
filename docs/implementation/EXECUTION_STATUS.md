# EXECUTION_STATUS

| Field | Value |
|------|-----|
| Phase | **P1** (Bot-B shell + project IO + detection page) |
| Status | **DONE** (awaiting CAO merge) |
| Mode | ONE-SHOT FULL DELIVERY |
| Shared tree | D:\project\web_signal_studio (no Bot checkout) |
| Bot-B worktree | D:\project\wss-wt-b -> work/bot-b-web-shell |
| Synced main tip | 8e4bf5f |
| Updated (Asia/Shanghai) | 2026-10-21 18:55:00 |

## P1 Bot-B

- [x] Compose ProjectTree / StatusBar / ChartPlaceholder / SpectrumToolbar / TempLayers / RightRail
- [x] Main chart: SpectrumChart via MainChartHost
- [x] Aux chart placeholder slot
- [x] Right rail four pages including DetectPage
- [x] Temp layers Esc / outside / Enter-Tab
- [x] Toolbar overflow
- [x] @wss/charts + @wss/project-io + @wss/contracts
- [x] Project open/save/summarize (paste/file; error safe)
- [x] Detect page capabilities gate + task poll/cancel (no fake candidates)
- [x] Unit tests: URL builders + gating
- [x] Playwright: detect mocked caps; project paste fixture
- [x] npm run build pass
- [x] Playwright e2e pass (8 tests)

## Rules

- Only work/bot-b-web-shell worktree; never write shared tree / signal_studio_rebuild.
- Never invent FFSCN/SCN detection candidates client-side.
- Sample indexes: decimal strings only.
