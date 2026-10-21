# UI parity comparison notes — Bot-G evidence (NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Web tip (narrowband refresh) | `6c17a53d4731ca0984b43a1e3cb837ae5c6224f7` (G06 merged) |
| Web tip (prior full pack) | `17937bb3a735d0df7058a3714aa353a88abb0e23` |
| Desktop tip | `17471a6488383b456281d12cb1a6d3d80290205d` (`rebuild/a143-native`) |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |
| CAO decides PASS | yes |

## Evidence dirs

| Dir | Contents |
|-----|----------|
| `qa/web-6c17a53/` | **G06 narrowband refresh** (stub gone): observe / page-switch / overflow / demod + `capture-notes.json` |
| `qa/web-17937bb/` | Prior full pack; `06-narrowband.png` is **STALE stub** — superseded by `web-6c17a53/` |
| `qa/desktop-17471a6/` | Fresh primary-screen + archival chart-rendering-final refs (labeled reference) |
| `qa/desktop-stale-note.txt` | Prior baseline desktop PNGs remain STALE for PASS judgment |
| `qa/qa-detect-*` | Prior detection-path smoke (separate from UI screenshot PASS) |
| `bot-b/` | Bot-B G06 wiring screenshots (WIP; not Bot-G PASS) |

## Side-by-side file list

| Theme | Web | Desktop (`desktop-17471a6/`) |
|-------|-----|------------------------------|
| Shell / primary | `web-17937bb/01-shell-default.png` | `desktop-primary-screen.png` |
| Wideband + IQ | `web-17937bb/03-wideband-with-sigmf-demo.png` (G26) | `ref-wideband-release.png` (archival ref) |
| **Narrowband (G06)** | **`web-6c17a53/06-narrowband.png`** (+ `06b` page-switch, `06c` overflow, `06d` demod) — **stub not visible** | `ref-narrowband-release.png` (archival ref) |
| Tri-chart / splitter | `web-17937bb/02-tri-chart-hosts.png` | (primary screen may show desktop strip) |
| Aux wave/PSD | `web-17937bb/05-aux-wave-or-psd.png` | — |
| Status bar G25 | `web-17937bb/04-status-bar-g25.png` | — |
| Rails | `web-17937bb/07`–`10` | — |

## Narrowband before / after (this refresh)

| | Before (`web-17937bb`) | After (`web-6c17a53`) |
|--|------------------------|----------------------|
| Tip | `17937bb` | `6c17a53` (G06 merge) |
| Stub | `narrowband_stub_visible: true` | `narrowband_stub_visible: false` |
| Host | stub banner | `workspace-narrowband` four-tab stacked |
| status_workspace | (was wideband then stub) | `narrowband` |
| Chart data | n/a stub | honest empty hosts awaiting Bot-D DDC (demod note: 无伪解调) |

## Observations (evidence, not PASS)

- Web loaded G26 IQ: `status_file=0000000`; after switch `status_workspace=narrowband`.
- Nav/aux hosts + VerticalSplitter testids present (C+B wiring) — from prior pack.
- **G06:** stub removed; NarrowbandWorkspace observe/modulation/dl/demod tabs + overflow retention captured.
- Status bar present ~28px with file name (G25 partial evidence only — no gesture-hint proof in this pack).
- Desktop: archival wide/narrow refs remain **reference only**; interactive desktop walkthrough not re-done this refresh.
- Baseline `baseline/desktop-*.png` / `baseline/web-narrowband-stub.png` remain **STALE / historical** for PASS; do not use alone.

## Gaps / blockers (WIP)

1. ~~G06 narrowband real workspace still stub on Web.~~ **Stub cleared at tip `6c17a53`** — still **not** UI_PARITY PASS (chart panels empty awaiting DDC; desktop interactive parity incomplete).
2. Desktop interactive parity shots (same IQ open, same rails) not fully scripted — only primary + archival refs.
3. G01 menubar / G02 toolbar chrome gaps from ACCEPTANCE not closed by screenshots alone.
4. Detection UI not verified for engine-picker G26 list in this pack (detect page screenshot only).
5. Narrowband chart panels are honest empty hosts (Bot-D DDC) — visual parity vs desktop filled charts incomplete.
6. **No PASS** — CAO decides after review.

## Reproduce

```text
# Narrowband refresh @ 6c17a53
cd apps/web && npx playwright test e2e/bot-g-g06-narrowband-capture.spec.ts

# Prior full pack
cd apps/web && npx playwright test e2e/bot-g-ui-parity-capture.spec.ts
```
