# NB06_DDC_ENTRY_b1541be — Bot-B Mark→Observe→DDC entry check (no PASS)

| Field | Value |
| --- | --- |
| When | 2026-10-22 Asia/Shanghai |
| Base | **b1541be** = b1541be9dc22db41a60abf66d985c6ab3275de47 (origin/main after fetch) |
| Branch | work/bot-b-ui |
| Tip | **bd4f874** = bd4f874757cd29d627b1ea86bf0ca2d49ae855f2 |
| Desktop | **17471a6** |
| Status | PARTIAL — UI entry clickable; residual EN on Observe pipeline chrome cleared; no PASS |
| matrix_pass_claimed | **false** |

## CAO ask

G residual: NB **06 DDC/pipeline** shot missing (05 Observe OK). Check Mark→Observe→DDC entry clickability + residual EN blocking; fix UI wiring only; do **not** invent DSP. Evidence tip; no PASS.

## Findings (before)

### Entry path (clickable — NOT missing wire)

1. **Mark** — broadband mark via toolbar **标记** / chart marker tool / tree mark / M06 panel (existing).
2. **→ Narrowband** — `btn-workspace-narrowband` on SpectrumToolbar + ChartParamStrip label **窄带** (already CN); MenuBar View → 窄带工作区.
3. **→ Observe** — CAO P1#8 product surface default: only **信号观察** tab visible; mod/demod/DL demoted under `nb-demoted-pages`. `workspace-narrowband-observe` mounts by default.
4. **→ DDC** — **not a separate button**. Auto pipeline strip `data-testid="nb-observe-pipeline"` (`data-nb-pipeline="ddc"`) on Observe mount. Drive = active broadband mark/channel via `__wssM06` → `resolveObserveDdcDrive` / `computeNarrowbandObserveDdc` (Bot-D existing APIs; demo-annotation fallback when no mark).

Disabled / hidden / unwired? **No.** Strip always rendered; CSS `.nb-observe-pipeline` visible; charts wait on same DDC result (`data-nb-chart-ready`).

### Residual EN that could block G (Observe chrome)

| Location | Before (EN) | After (CN) |
| --- | --- | --- |
| `NarrowbandObserveCharts` statusText error | `DDC unavailable: …` | `真实 DDC 不可用：…` |
| statusText loading | `Loading sigmf_data_demo → DDC…` | `正在加载 sigmf_data_demo → 真实 DDC…` |
| pipeline body fallback | `Waiting for DDC…` | `等待真实 DDC…` |
| `narrowbandObserveMarkerDdc` statusStamp kind | `channel` / `marker` | `通道` / `标记` |
| demo fallback statusStamp | `demo-annotation (no active broadband mark/channel)` | `演示标注（无活动宽带标记/通道）` |
| `NarrowbandWorkspace` dataStatus | `Observe：真实 DDC…` | `信号观察：真实 DDC…` |

Kept (honesty / tests / tech tokens): `pipelineLabel` still contains `not demod` + `no Multitaper/Burg`; `data-nb-ddc-kind` attrs (`real-marker` / `real-demo-annotation`); filename `sigmf_data_demo`.

### G 06 gap classification

- Pack `web-7969aba-quality` MANIFEST: *"Salvaged mid-run; NB 05 present; 06 PARTIAL"* — **primarily pure missing-shot** (05 written, 06 not pushed before salvage). Spec already shoots `06-nb-ddc-pipeline-state.png` right after 05 against `nb-observe-pipeline`.
- Bot-B still fixed Observe pipeline **residual EN** so G re-capture sees CN `真实 DDC` stamp, not EN waiting copy that looks like an empty/foreign path.

## What Bot-B did **not** invent

- No new DDC math, Multitaper, Burg, G06 recognition, G16/G17 matrix, fake pipeline workers.
- Demoted mod/demod EN strings left (behind P1#8 demote; out of Mark→Observe→DDC path).
- No ACCEPTANCE_MATRIX PASS flip.

## How G should click / shoot 06

1. Load demo IQ (`menu-load-demo-iq` / tree).
2. Optional: create/select broadband **标记** (pipeline drive = mark; else demo-annotation fallback still stamps **真实 DDC**).
3. Click toolbar **窄带** (`btn-workspace-narrowband`).
4. Confirm **信号观察** (`nb-page-observe` / `workspace-narrowband-observe`).
5. Wait `nb-panel-waveform|psd|stft` `data-nb-chart-ready=true`.
6. Shoot **`[data-testid=nb-observe-pipeline]`** (crop or fullpage) → `06-nb-ddc-pipeline-state.png`. Expect visible text starting with **真实 DDC** (or loading **正在加载 … 真实 DDC**). Read attrs `data-nb-pipeline=ddc`, `data-nb-ddc-status`.

## Residual gaps (honest)

- 06 PNG itself not produced by Bot-B this tip — G re-run pack on this tip.
- Demoted pages still have some EN waiting copy (not product surface).
- `pipelineLabel` title tooltip retains English honesty fences (`not demod`).
- data-native-qfiledialog=false (N/A this tip).

## Self-check

1. Mark → 窄带 → 信号观察 → `nb-observe-pipeline` visible / not disabled.
2. Unit: `narrowbandObserveMarkerDdc.test.ts` + `narrowbandObserveDdc.test.ts` **17 passed**.
3. matrix_pass_claimed=false; no PASS.

## Deliver

- feature_sha (fix): **bd4f874** = bd4f874757cd29d627b1ea86bf0ca2d49ae855f2
- base_sha: **b1541be** = b1541be9dc22db41a60abf66d985c6ab3275de47
- parent: b1541be9dc22db41a60abf66d985c6ab3275de47

- Tip: **bd4f874** = bd4f874757cd29d627b1ea86bf0ca2d49ae855f2
- Evidence: `docs/acceptance/evidence/bot-b/NB06_DDC_ENTRY_b1541be.md`
- matrix_pass_claimed=false
