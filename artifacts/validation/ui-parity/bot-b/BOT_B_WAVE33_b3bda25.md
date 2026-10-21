# BOT_B_WAVE33 — Incremental UI parity tip (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Tip | `3f2fb2bed55591f14cb62b1774b80424bf47474a` (3f2fb2b)
| Base | `b3bda2505226baa744b8b469068e7b7fa14696b6` (`merge(A): INCREMENTAL_ab82146`) |
| Branch | `work/bot-b-ui` |
| Desktop rebuild | `17471a6` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |
| data-native-qfiledialog | **false** |
| data-native-worker | **false** |
| G06/G17 | **BLOCKED** (not touched) |
| Multitaper/Burg/non-PoT/STFT-DDC | **BLOCKED** (not invent) |

## Job A — bandwidthHz API facts for Bot-C (read-only)

**What B passes today as `bandwidthHz`:**

| Path | Call site | `bandwidthHz` | Notes |
|------|-----------|---------------|-------|
| File IQ STFT | `MainChartHost.tsx` → `computeFileSpectrogram` | `session.sampleRateHz` (full-band `fs`) | auto-N **and** fixed SegmentMs |
| Synthetic STFT | `MainChartHost.tsx` → `computeMainSpectrogram` | `1_000_000` | fixture fs |
| Contract | `packages/contracts/src/spectral.ts` `resolveAnalysisSamples` | required `bandwidthHz > 0` | with `points` + `segmentMilliseconds` |

**Visible span store key:** **none**. `uiStore` has `navWindowTime` (time nav, G03/C) — **not** freq span / `bandwidthHz`. Annotation `bandwidthKhz` in BottomPanel is mark metadata, not STFT analysis BW.

**C should read (do not dual-write B prefs):**

- `apps/web/src/components/MainChartHost.tsx` — auto-N / fixed SegmentMs options object
- `apps/web/src/dsp/computeMainSpectrogram.ts` / `computeFileSpectrogram.ts` — options `bandwidthHz?` / `analysisPoints?` / `segmentMilliseconds?`
- `apps/web/src/store/uiStore.ts` — `stftAutoNbPref` / `stftSegmentMsPref` / `stftN` (chrome); **no** visible-bandwidth field

**A2 (display BW from chart zoom):** still needs C-owned freq-span state; B keeps fallback `fs`. Do not invent a second writer.

## Wave33 landings

| ID | Item | Status |
|----|------|--------|
| **A1** | Fixed SegmentMs `0.1/1/10/100` when auto-N off → `resolveAnalysisSamples` PoT | **landed** — `stftSegmentMsPref`, `select-stft-segment-ms`, compute resolve branch |
| **A2** | Visible `bandwidthHz` | **not this tip** — Job A docs only; still `fs` |
| **A4** | PSD-only SpectrumStatistic / STFT `NA_PSD_ONLY` | **reinforced** — overflow stamp `data-stft-statistic="NA_PSD_ONLY"` |
| **A5** | `spectral_settings_json` project persist | **skipped** — needs F/`project-io` schema owner |
| **A6** | Overlap/SegmentMs validation tooltips (`lastValid` / reject invalid draft) | **landed** |
| **B1** | Ctrl+A SelectAll marks | **landed** — shortcut + Edit menu item |
| **B3** | open-folder / load-sample honesty titles | **landed** |
| **B4** | recent-menu Esc/focus a11y | **landed** |
| **C1** | Detect LocalCompute progress/cancel/error honesty | **landed** — inspector error row + progress % |
| **C2** | `data-native-worker="false"` | **landed** — DetectPage + BottomPanel feed |
| **D2** | Save picker mime/name polish | **landed** — `acceptExts`; qfiledialog stays false |

## Explicit fence

- No Multitaper / Burg / non-PoT window length / STFT-DDC
- No G06 eye/bitstream / G17 recognition elevation
- Never claim PASS / CLOSED for G02/G07/G08/G19
- G02 remains **PARTIAL**

## Files touched

- `apps/web/src/store/uiStore.ts`
- `apps/web/src/components/MainChartHost.tsx`
- `apps/web/src/components/ChartParamStrip.tsx`
- `apps/web/src/dsp/computeMainSpectrogram.ts`
- `apps/web/src/dsp/computeFileSpectrogram.ts`
- `apps/web/src/hooks/useMenuBarShortcuts.ts`
- `apps/web/src/components/MenuBar.tsx`
- `apps/web/src/components/DetectPage.tsx`
- `apps/web/src/components/BottomPanel.tsx`
- `apps/web/src/components/browserSaveFile.ts`
- `artifacts/validation/ui-parity/bot-b/BOT_B_WAVE33_*.md` (this file)

