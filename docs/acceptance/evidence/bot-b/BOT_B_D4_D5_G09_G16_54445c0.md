# BOT_B_D4_D5 — G09 bottom scale + G16 mode-wheel shell (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Tip | `6eb1992502614dd673d510e34fa081949a5f1c3f` |
| Base | `6fdd5fe8ff65a6d84e29bc50b860e7b433852656` |
| Branch | `work/bot-b-ui` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |
| Fence | no G06/G17/Multitaper/Burg/non-PoT invent |

## Per-item status

| Item | Status | Notes |
|------|--------|-------|
| **D4 G09** BottomPanel scale chrome | **PARTIAL** | `BottomScaleChrome` shows view ΔT/ΔF from `navWindowTime` + `spectrogramDisplay.freqHz` + cursor (desktop `viewData_` / `cursorData`). Axis tick paint / PlotWidget bind → **Bot-C** (`data-axis-bind=deferred-to-c`). Not MET. |
| **D5 G16** mode-wheel shell | **PARTIAL** | `data-testid=mode-wheel` wraps STFT/Waterfall + Wave/PSD. Desktop enums stamped. **`data-matrix=insufficient`** — no enable/disable matrix note @17471a6; **no empty invent**. Chart consumers → C; DSP enum → D N/A. |

## Gap list

### G09
1. PlotWidget bottom axis ticks (C)
2. Waterfall axis-swap readout copy (C)
3. Pixel screenshot parity vs rebuild (optional)

### G16
1. Desktop mode enable/disable matrix — missing → PARTIAL
2. Narrowband page interactions — not invented
3. Demod/recognition modes — BLOCKED (G06/G17)
4. Chart host consumers — C

## Changed paths

- `apps/web/src/components/BottomScaleChrome.tsx` (new)
- `apps/web/src/components/BottomPanel.tsx`
- `apps/web/src/components/SpectrumToolbar.tsx`
- `apps/web/src/App.css`
- dual evidence MDs

Never PASS.
