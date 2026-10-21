# UI parity QA checklist (Bot-G skeleton)

> Asia/Shanghai · seeded on tip `be885f2` · **no full smoke yet** (wait CAO for B/C/E/F tips).  
> Writes only under `D:\project\wss-wt-g`. Shared `web_signal_studio` baseline originals and `signal_studio_rebuild` are **read-only**.

## Baseline refs (copied into this worktree)

Path: `artifacts/validation/ui-parity/baseline/` (copy of shared `web_signal_studio\artifacts\validation\ui-parity\baseline\`, 14 files).

| Ref | Role |
|-----|------|
| `desktop-main-window-primary.png` | Desktop primary capture note shot |
| `desktop-ref-wideband-release.png` / `desktop-ref-narrowband-release.png` | Archival desktop wide/narrow refs |
| `DESKTOP_SCREENSHOT_NOTE.txt` | How desktop shots were taken |
| `UI_PARITY_GAP_AUDIT.md` | Gap audit (desktop vs Web @ be885f2) |
| `web-shell-default.png` / `web-wideband.png` | Web shell / wideband |
| `web-narrowband-stub.png` | Narrowband stub banner |
| `web-rail-collapsed.png` | Collapsed rail |
| `web-right-rail-{display,detect,marker,channel}.png` | Right-rail pages |
| `web-temp-layer-level.png` | Level / temp layer |

## Planned Web screenshots → `qa/` (after B/C/E/F tip + smoke)

Capture into `artifacts/validation/ui-parity/qa/` (suggested names; adjust if UI changes):

1. `qa-web-shell-default.png` — default shell after load
2. `qa-web-wideband-with-iq.png` — wideband after opening rebuild SigMF demo
3. `qa-web-narrowband.png` — narrowband workspace (not stub-only if C/B tip lands real view)
4. `qa-web-right-rail-display.png` / `detect.png` / `marker.png` / `channel.png`
5. `qa-web-rail-collapsed.png`
6. `qa-web-charts-stft-or-waterfall.png` — if charts tip exposes STFT/waterfall
7. Optional desktop re-shot only if CAO asks (prefer reuse baseline desktop refs)

Pair each capture against the matching `baseline/web-*.png` or desktop ref; note residual gaps vs `UI_PARITY_GAP_AUDIT.md` (G01…).

## Rebuild inputs (read-only; smoke later — not now)

| Kind | Path |
|------|------|
| IQ / SigMF demo | `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\` (`0000000.sigmf-meta` + `.sigmf-data`) |
| FFSCN engine | `D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\ffscn-gui-iq-v1\` (e.g. `ffscn_epoch1200_fp32.engine`) |
| SCN engine | `D:\project\signal_studio_rebuild\out\vs2026-qt611-release_bin\detection-models\scn-max-psd-v1\scn_model.engine` |

Smoke targets in this worktree: `apps/web`, `services/local-compute`.

## Rules

1. **No fake detection PASS** — without real GPU/weights/engines wired, detection stays BLOCKED / degrade; do not invent candidates.
2. **Matrix / parity claims only with evidence** under `artifacts/validation/ui-parity/` (and acceptance evidence paths). Implementer chat ≠ PASS.
3. **WIP if missing** — if a planned screenshot or tip is absent, leave checklist item WIP; do not mark parity closed.
4. Do **not** modify shared baseline originals or rebuild trees.

## Status

| Item | Status |
|------|--------|
| Baseline seeded in wss-wt-g | DONE (copy) |
| `qa/` screenshot pack | WIP — wait B/C/E/F tip + smoke |
| Parity closeout / matrix flip | WIP — evidence after smoke |
