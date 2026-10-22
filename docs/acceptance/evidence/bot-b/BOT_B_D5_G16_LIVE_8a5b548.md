# BOT_B_D5_G16_LIVE — mode-wheel on live chart-header-toolbar (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Base | `8a5b548b47908fc92c3e1855af630e77a0597590` (`merge(bot-g): web-555d001 QA`) |
| Branch | `work/bot-b-ui` |
| matrix_pass_claimed | **false** |
| ui_parity_pass_claimed | **false** |
| pass_claimed | **false** |
| Fence | no G06/G17 invent; modes only STFT/Waterfall/Wave/PSD |

## Why tip (not demoted-intentional)

G `web-555d001` shot: live App DOM `chart-header-toolbar` had STFT/Waterfall/Wave/PSD **without** `data-g16` / `mode-wheel`. Prior D5 stamps lived only on demoted `SpectrumToolbar.tsx` (not mounted in App).

## What landed

- Live `SpecParamStrip` → `chart-header-toolbar` wraps modes in `data-testid="mode-wheel"` + `data-g16="partial"` + `data-g16-host="chart-header-toolbar"` + `data-live-dom="true"`.
- Includes STFT / Waterfall / Wave / PSD (existing store setters only).
- Aux strip buttons renamed to `btn-aux-*-strip` (mirror) to avoid duplicate live testids.
- Demoted `SpectrumToolbar` mode-wheel → `mode-wheel-demoted` + `data-live-dom="false"`.

## Status

**PARTIAL** — live DOM host fixed; enable/disable matrix still insufficient (no invent).

## Changed paths

- `apps/web/src/components/ChartParamStrip.tsx`
- `apps/web/src/components/SpectrumToolbar.tsx`
- dual evidence

Never PASS.
