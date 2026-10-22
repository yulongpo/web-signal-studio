# BOT_B_A5 — spectral_settings_json open/save wire (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | `6bf49bb47600d55e0499bf638478d74a86474560` (`merge(F): A5 spectral_settings_json`) |
| Branch | `work/bot-b-ui` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |
| Fence | No Multitaper / Burg / non-PoT invent |

## What landed

Wire apps/web project open/save to `file.display.spectral_settings_json` via `@wss/project-io`:

- **open** (`uiStore.openProjectFromText`): `readSpectralChromePrefsFromFile(activeFile)` → chrome prefs (`stftWindowPref`, `stftOverlapPref`, `stftSegmentMsPref`, `stftKaiserBetaPref`, `stftAutoNbPref`, `stftRemoveMeanPref`, `stftN`)
- **save** (`uiStore.saveProjectJsonText`): chrome prefs → `applySpectralChromePrefsToProject` → persist updated `projectDocument` + JSON text

JSON shape (F helpers): `{ window, overlap, segmentMilliseconds, kaiserBeta, removeMean, autoNb }` + desktop `spectrogramSettings` bridge + optional `stftSize`.

## Round-trip

Vitest: `apps/web/src/store/uiStore.spectralSettingsA5.test.ts` — **2 passed** (`npm test -- --run src/store/uiStore.spectralSettingsA5.test.ts`).

## Changed paths

- `apps/web/src/store/uiStore.ts`
- `apps/web/src/store/uiStore.spectralSettingsA5.test.ts`
- evidence (this file, both trees)

## Honesty

G02 remains PARTIAL. A5 is prefs persistence only — not Multitaper/Burg/non-PoT/STFT-DDC. No PASS claim.
