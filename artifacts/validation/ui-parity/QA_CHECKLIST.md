# UI parity QA checklist (Bot-G)

> Asia/Shanghai · tip `7a84739` (includes Bot-G seed `90cb96d` + Bot-A `866e699`) · **no full smoke yet** (wait CAO for B/C/E/F tips).  
> Writes only under `D:\project\wss-wt-g`. Shared `web_signal_studio` baseline originals and `signal_studio_rebuild` are **read-only**.

**Source of gate text:** `artifacts/validation/ui-parity/baseline/UI_PARITY_ACCEPTANCE.md` (also `docs/migration/ui-parity/UI_PARITY_ACCEPTANCE.md`) — G01–G26 + PRE-*.

## Baseline refs (copied into this worktree)

Path: `artifacts/validation/ui-parity/baseline/` (14 files from shared copy + Bot-A ACCEPTANCE/gap docs).

| Ref | Role |
|-----|------|
| `desktop-main-window-primary.png` | Desktop primary capture note shot |
| `desktop-ref-wideband-release.png` / `desktop-ref-narrowband-release.png` | Archival desktop wide/narrow refs |
| `DESKTOP_SCREENSHOT_NOTE.txt` | How desktop shots were taken |
| `UI_PARITY_GAP_AUDIT.md` / `UI_PARITY_ACCEPTANCE.md` | Gap audit + executable PASS matrix (G01–G26) |
| `web-shell-default.png` / `web-wideband.png` | Web shell / wideband |
| `web-narrowband-stub.png` | Narrowband stub banner |
| `web-rail-collapsed.png` | Collapsed rail |
| `web-right-rail-{display,detect,marker,channel}.png` | Right-rail pages |
| `web-temp-layer-level.png` | Level / temp layer |

## Global PRE gates (from ACCEPTANCE — all cases)

| ID | PASS | FAIL |
|----|------|------|
| **PRE-1** | `data-testid="app-shell"` visible; no uncaught console errors | Shell missing / hard crash |
| **PRE-2 (IQ · G26)** | Open **only** `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.sigmf-*` via formal open; status/`status-file` reflects that file | Any other IQ path → **entire run FAIL (G26)** |
| **PRE-3 (engine · G26)** | If testing detection (G14/G17): model picker options **all** resolve to rebuild-tree `*.engine` | Tree-external `.pth`/`.onnx` as selectable options → **FAIL (G26)** |
| **PRE-4** | No writes under `D:\project\signal_studio_rebuild` | Any write to rebuild |

## G25 / G26 acceptance (folded from Bot-A)

| ID | Sev | Observe | PASS (all required) | Fail signals |
|----|-----|---------|---------------------|--------------|
| **G25** | P2 | `status-bar` | ① height ~25±4px; ② ready (or equiv) + t/f + filename; ③ gesture shows transient hint; ④ dsp/fft diagnostics do **not** replace the main hint | Diagnostics-only bar; no ready/hint |
| **G26** | P0 | runbook / config | ① IQ path documented/scripted = `resources\sigmf_data_demo`; ② model glob limited to rebuild `*.engine` (canonical: `out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\`, `...\scn-max-psd-v1\`); ③ CI/manual must **not** treat RadioAI / `.pth` as primary acceptance path | Old RadioAI/`.pth` baseline still used as main gate |

**No fake detection PASS:** without real GPU + in-tree `.engine` wired, detection stays BLOCKED/degrade; do not invent candidates. G17 model items must be rebuild `.engine` only.

## Planned Web screenshots → `qa/` (after B/C/E/F tip + smoke)

Capture into `artifacts/validation/ui-parity/qa/` (after PRE-2 IQ load):

1. `qa-web-shell-default.png` — default shell (`app-shell`)
2. `qa-web-wideband-with-iq.png` — wideband after `sigmf_data_demo`
3. `qa-web-narrowband.png` — narrowband workspace (not stub-only if tip lands)
4. `qa-web-right-rail-display.png` / `detect.png` / `marker.png` / `channel.png`
5. `qa-web-rail-collapsed.png`
6. `qa-web-status-bar.png` — **G25** evidence (ready + t/f + file)
7. `qa-web-charts-stft-or-waterfall.png` — if charts tip exposes STFT/waterfall
8. Optional: detect model picker showing rebuild `.engine` only (**G26/PRE-3**)

Pair against `baseline/web-*.png` / desktop refs; residual gaps vs G01–G24 in ACCEPTANCE/GAP_AUDIT → WIP if missing.

## Rebuild inputs (read-only; smoke later — not now)

| Kind | Path |
|------|------|
| IQ / SigMF demo | `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\` |
| FFSCN engine | `...\out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\` (e.g. `ffscn_epoch1200_fp32.engine`) |
| SCN engine | `...\out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine` |

Smoke targets: `apps/web`, `services/local-compute`.

## Rules

1. **No fake detection PASS** — BLOCKED/degrade without real engines; never invent candidates.
2. **Matrix / parity claims only with evidence** under `artifacts/validation/ui-parity/` (+ ACCEPTANCE IDs). Chat ≠ PASS.
3. **WIP if missing** — missing screenshot or tip ⇒ leave WIP; do not close parity.
4. Do **not** modify shared baseline originals or rebuild trees.
5. **G26 hard fail** if smoke uses non-demo IQ or non-rebuild `.engine`/`.pth` as acceptance primary.

## Detection-path smoke (Bot-G independent)

> Ran @ tip `563458a` (Asia/Shanghai). **Not** UI-parity / desktop screenshot PASS. Desktop baseline PNGs are **stale** (`qa/desktop-stale-note.txt`) until Bot-A re-capture.

| Check | Result | Evidence |
|-------|--------|----------|
| PRE-2 IQ locked to `sigmf_data_demo` | PASS | live result `sourcePath` + `qa-detect-live-trt_*.json` g26 |
| PRE-3 / G26 engines under rebuild `detection-models` `*.engine` | PASS | FFSCN/SCN paths in live JSON; no RadioAI/`.pth` primary |
| Live TRT capabilities + `ffscn.detect` | PASS | `engine=TENSORRT_CUDA`, `verifiedForward=true`, `canInventResults=false`, status `succeeded` |
| Degrade `DISABLE_TENSORRT=1` | PASS | `BLOCKED`, `result=null`, no fake green (`qa-detect-degrade_*.json`) |
| Contract pytest (stub) | PASS | **62 passed** (`qa-detect-pytest-contract_*.txt`) |
| Tip CI (web build) | FAIL (unrelated) | [run 39606352080](https://github.com/yulongpo/web-signal-studio/actions/runs/39606352080) — do not treat as detection FAIL |
| UI parity / desktop PNGs | **not judged** | stale desktop baseline; wait B/C tip + A re-audit |

**Verdict (detection subset only):** PASS — see `qa/qa-detect-summary_2026-10-21.json`. `matrix_pass_claimed:false` / `ui_parity_pass_claimed:false`.

## Status

| Item | Status |
|------|--------|
| Baseline seeded in wss-wt-g | DONE |
| G25/G26 folded into this checklist | DONE @ `7a84739` / `f77b933` |
| Detection-path smoke (local-compute TRT + degrade) | **PASS** @ `563458a` (evidence in `qa/qa-detect-*`) |
| Desktop baseline PNGs for UI compare | **STALE** — do not use for PASS (`qa/desktop-stale-note.txt`) |
| `qa/` full UI screenshot pack | WIP — wait B/C tip + A re-audit |
| UI parity closeout / matrix flip | WIP — no PASS from stale desktop shots |
