# EXECUTION_STATUS

| Field | Value |
|------|-----|
| Phase | **P1** (Bot-B detection polish + wide/narrow workspace e2e) |
| Status | **DONE** (awaiting CAO merge) |
| Mode | ONE-SHOT FULL DELIVERY |
| Shared tree | D:\project\web_signal_studio (no Bot checkout) |
| Bot-B worktree | D:\project\wss-wt-b → work/bot-b-web-shell |
| Synced main tip | 70347e14765116989055bbf942c41f91c5fb658b |
| Updated (Asia/Shanghai) | 2026-10-21 19:15:00 |

## P1 Bot-B

- [x] Compose ProjectTree / StatusBar / ChartPlaceholder / SpectrumToolbar / TempLayers / RightRail
- [x] Main chart: SpectrumChart via MainChartHost
- [x] Aux chart placeholder slot
- [x] Right rail four pages including DetectPage
- [x] Temp layers Esc / outside / Enter-Tab
- [x] Toolbar overflow
- [x] @wss/charts + @wss/project-io + @wss/contracts
- [x] Project open/save/summarize via Bot-F `ProjectSessionHookApi` / `asProjectSessionHook`
- [x] Detect page: Bot-E `LocalComputeClient` class (loopback, :8000), capabilities gate, no fake candidates
- [x] Detection polish: uiMessages code chips, MODEL_MISSING_*/GPU_*/SOURCE_MISSING (server copy), BLOCKED no-draw, verifiedForward-only draw
- [x] Wide/narrow workspace toggle + narrowband stub banner (Bot-D DDC later)
- [x] STFT UX: `dsp-source-chip` + StatusBar dsp mirror; Playwright leaves `loading`
- [x] Open IQ (FSA or file input) → `stftFromChunkedReader`; synthetic fixture parallel fallback
- [x] WEIGHT_HASH_MISMATCH detect fixture/e2e via server `uiMessages` (no fake candidates)
- [x] Playwright: shell + detect + project-io + STFT + workspace toggle (12 passed)
- [x] Vitest: 20 passed
- [x] npm run build pass

## Rules

- Only work/bot-b-web-shell worktree; never write shared tree / signal_studio_rebuild.
- Never invent FFSCN/SCN detection candidates client-side.
- Draw only when succeeded + `verifiedForward===true` + `PYTORCH_*` engine.
- Sample indexes: decimal strings only.
