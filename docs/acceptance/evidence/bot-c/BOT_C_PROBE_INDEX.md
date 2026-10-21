# Bot-C probe evidence index



> Owner of status PASS: **WSS-QA-G** only. This package places **WIP** evidence; Bot-C does **not** claim PASS.



Updated: 2026-10-21 (Asia/Shanghai)  

Worktree: `D:\project\wss-wt-c` · branch `work/bot-c-charts`  

Synced main tip: **`610a79c`** (`610a79c464493cf600ad6b109704ca372cb2958b`)  

Feature commits: tile/DPI/preview **`7b21dff`**; interaction P95 **`694dc10`** (branch tip then `2ee8435`, merge included in `610a79c`)



## What each probe measures



| File (tracked here) | Origin (`artifacts/validation/bot-c/`, gitignored) | Measures |

|---------------------|----------------------------------------------------|----------|

| `bot_c_tile_dpi_preview_2026-10-21.json` | same name | Preview vs refine extract samples; frameMs/extractMs/dpr/mode meta |

| `charts_probe_tile_dpi_preview_2026-10-21.json` | same name | Single gate sample (refine) after tile/DPI run |

| `bot_c_probe_run_summary_2026-10-21.json` | same name | Run summary: previewOut/refineOut sizes+ms, dpr buffer, viewport window |

| `charts_probe_interaction_p95_2026-10-21.json` | same name | Synthetic pan/zoom loop; **summary.frameMs.{p50,p95}** and **summary.extractMs.{p50,p95}** |

| `p2c_charts_gate_2026-10-21.json` | same name | Early P2-C gate (typecheck + unit count at skeleton) |

| `CONDENSED_tile_dpi_preview.json` | derived | Condensed tile/DPI/preview numbers for matrix links |

| `CONDENSED_interaction_p95.json` | derived | Condensed P50/P95 frame/extract for matrix links |



### Headline numbers (synthetic Node CPU; not GPU)



From `CONDENSED_interaction_p95.json` / interaction probe summary:



- **frameMs**: p50 ≈ 1.47 ms · p95 ≈ 5.65 ms · n=32 · dpr=2

- **extractMs**: p50 ≈ 1.24 ms · p95 ≈ 5.22 ms

- Modes: `preview` then `refine` (PreviewRefineController)



From tile/DPI summary:



- preview out **320×160** (~2.3 ms extract) · refine out **512×256** (~8.5 ms)

- CSS 640×320 → buffer **1280×640** at dpr=2



## Preview vs refine



- **preview**: during pan/zoom (`PreviewRefineController.noteInteraction`) → coarser `suggestExtractOutSize(..., mode:"preview")`

- **refine**: after idle / `requestRefine` → denser grid, peak reduce

- Display extract is **display-only** (`assertDisplayOnlyExtract` / forbidden Hz·marker·detection keys)



## How to re-run



```powershell

cd D:\project\wss-wt-c\packages\charts

npm install

npm run typecheck

npm test

# rewrite interaction P95 into worktree artifacts (then re-copy into this folder if needed):

$env:WSS_PROBE_REPO = "D:\project\wss-wt-c"

npm test -- src/probe/performanceProbe.test.ts

```



Helpers: `writeChartsValidationProbe`, `PerformanceProbeSession`, `runSyntheticInteractionProbe`, `percentile` / `aggregateMsStats` in `@wss/charts` (`packages/charts/src/probe/performanceProbe.ts`).



Unit coverage at packaging time: **38** tests in `@wss/charts` (vitest).



## Matrix cross-links



- M-03 / M-04 → WIP (this index + condensed JSON)

- C-01..C-04 → WIP rows for WebGL2+LUT, display tile extract, DPR, pan-zoom+context restore



**Do not set PASS here.** QA verifies against these paths.

