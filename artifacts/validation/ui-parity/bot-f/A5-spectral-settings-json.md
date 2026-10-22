# A5 spectral_settings_json persistence (Bot-F)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base tip | `2ce34a937c5927eb39108ac7ca865646134ba4ae` |
| Desktop | `spectral_settings_json.h` + `project_store` `spectrogramSettings` |
| Status | **WIP evidence** — not ACCEPTANCE PASS |
| matrix_pass_claimed | **false** |

## Scope

Persist landable SpectralSettings prefs via `@wss/project-io`:

- Wire key `display.spectral_settings_json`: window, overlap, segmentMilliseconds, kaiserBeta, removeMean, autoNb
- Bridge `display.spectrogramSettings` (desktop int window / segmentMilliseconds=0 when autoNb)
- Optional `display.stftSize` from B `stftN`
- Chrome prefs helpers aligned to Bot-B uiStore: `stftWindowPref`, `stftOverlapPref`, `stftSegmentMsPref`, `stftKaiserBetaPref`, `stftAutoNbPref`, `stftRemoveMeanPref`, `stftN`

## Non-claims / honesty fence

- No Multitaper / DPSS / Burg / non-PoT / STFT-DDC
- Desktop bridge writes Welch method ordinal only as inert schema shape
- Bot-B must call `applySpectralChromePrefsToProject` / `readSpectralChromePrefsFromFile` on save/open (thin re-exports in `apps/web/src/projectIo`)

## Tests

```
npx vitest run packages/project-io/src/spectral-settings-json.test.ts
# 4 passed
```
