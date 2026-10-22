# BOT_B_A5 — spectral_settings_json open/save wire (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Tip | `66b09938ac2acb9bb952f6523922c7ed5ae37d63` |
| Base | `0f1183af9972ddc70a995ceb64474f0d4bac940b` (`merge(bot-c): A2`; includes F `6bf49bb` A5 helpers) |
| Branch | `work/bot-b-ui` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |
| Fence | No Multitaper / Burg / non-PoT invent; no dual-write of C `visibleBandwidthHz` |

## What landed

Wire apps/web project open/save to `file.display.spectral_settings_json` via `@wss/project-io`:

- **open** (`uiStore.openProjectFromText`): `readSpectralChromePrefsFromFile(activeFile)` → chrome prefs (`stftWindowPref`, `stftOverlapPref`, `stftSegmentMsPref`, `stftKaiserBetaPref`, `stftAutoNbPref`, `stftRemoveMeanPref`, `stftN`)
- **save** (`uiStore.saveProjectJsonText`): chrome prefs → `applySpectralChromePrefsToProject` → persist updated `projectDocument` + JSON text

JSON shape (F helpers): `{ window, overlap, segmentMilliseconds, kaiserBeta, removeMean, autoNb }` + desktop `spectrogramSettings` bridge + optional `stftSize`.

## Round-trip

Vitest: `apps/web/src/store/uiStore.spectralSettingsA5.test.ts` — **2 passed**.

## Changed paths

- `apps/web/src/store/uiStore.ts`
- `apps/web/src/store/uiStore.spectralSettingsA5.test.ts`
- `docs/acceptance/evidence/bot-b/BOT_B_A5_SPECTRAL_SETTINGS_6bf49bb.md`
- `artifacts/validation/ui-parity/bot-b/BOT_B_A5_SPECTRAL_SETTINGS_6bf49bb.md`

## Honesty

G02 remains PARTIAL. A5 is prefs persistence only. Did not touch C A2 `visibleBandwidthHz` / MainChartHost bandwidth wiring. No PASS claim.
