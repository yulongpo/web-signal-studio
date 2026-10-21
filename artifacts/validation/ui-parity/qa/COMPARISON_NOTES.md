# UI parity comparison notes — Bot-G evidence (NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Web tip | `17937bb3a735d0df7058a3714aa353a88abb0e23` |
| Desktop tip | `17471a6488383b456281d12cb1a6d3d80290205d` (`rebuild/a143-native`) |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |
| CAO decides PASS | yes |

## Evidence dirs

| Dir | Contents |
|-----|----------|
| `qa/web-17937bb/` | Playwright captures + `capture-notes.json` |
| `qa/desktop-17471a6/` | Fresh primary-screen + archival chart-rendering-final refs (labeled reference) |
| `qa/desktop-stale-note.txt` | Prior baseline desktop PNGs remain STALE for PASS judgment |
| `qa/qa-detect-*` | Prior detection-path smoke (separate from UI screenshot PASS) |

## Side-by-side file list

| Theme | Web (`web-17937bb/`) | Desktop (`desktop-17471a6/`) |
|-------|----------------------|------------------------------|
| Shell / primary | `01-shell-default.png` | `desktop-primary-screen.png` |
| Wideband + IQ | `03-wideband-with-sigmf-demo.png` (G26 `sigmf_data_demo`) | `ref-wideband-release.png` (archival ref) |
| Narrowband | `06-narrowband.png` (**stub still visible**) | `ref-narrowband-release.png` (archival ref) |
| Tri-chart / splitter | `02-tri-chart-hosts.png` (nav/aux/main + splitters present) | (primary screen may show desktop strip) |
| Aux wave/PSD | `05-aux-wave-or-psd.png` | — |
| Status bar G25 | `04-status-bar-g25.png` (height ≈28px; file `0000000`) | — |
| Rails | `07`–`10` display/detect/marker/channel | — |

## Observations (evidence, not PASS)

- Web loaded G26 IQ: `status_file=0000000`, `dsp_source=file-stft-worker`.
- Nav/aux hosts + VerticalSplitter testids present (C+B wiring).
- Narrowband **still shows stub** banner (G06 gap remains).
- Status bar present ~28px with file name (G25 partial evidence only — no gesture-hint proof in this pack).
- Desktop: launched `vs2026-qt611-release_bin\SignalStudio.exe` briefly; primary-screen PNG captured. Full interactive desktop walkthrough (open IQ, rails) **not** automated — archival wide/narrow refs copied as **reference only**.
- Baseline `baseline/desktop-*.png` remain **STALE** for PASS; do not use alone.

## Gaps / blockers (WIP)

1. G06 narrowband real workspace still stub on Web.
2. Desktop interactive parity shots (same IQ open, same rails) not fully scripted — only primary + archival refs.
3. G01 menubar / G02 toolbar chrome gaps from ACCEPTANCE not closed by screenshots alone.
4. Detection UI not verified for engine-picker G26 list in this pack (detect page screenshot only).
5. **No PASS** — CAO decides after review.

## Reproduce

```text
# Web
cd apps/web && npx playwright test e2e/bot-g-ui-parity-capture.spec.ts

# Desktop (Windows)
powershell -File _botg_desktop_capture.ps1   # optional helper; or use capture under qa/desktop-17471a6
```
