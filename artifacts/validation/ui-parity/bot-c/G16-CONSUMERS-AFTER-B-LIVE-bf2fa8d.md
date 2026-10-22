# Bot-C written close — G16 chart consumers after B D5 live (no tip)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 ~08:25 |
| Base / HEAD synced | `7fec50c5047c052723b9ce090635f39130ffc437` (origin/main; includes B D5 live bf2fa8d + A audit) |
| Branch | `work/bot-c-charts` |
| Tip | **none** (written PARTIAL / BLOCKED) |
| matrix_pass_claimed | **false** |

## B live mounts found (confirmed on bf2fa8d)

Live App tree (`App.tsx`):
- `SpecParamStrip` from `ChartParamStrip.tsx` (live header)
- `MainChartHost` / `AuxChartHost` (C chart hosts)
- **No** `<SpectrumToolbar` mount

Live mode-wheel (`ChartParamStrip.tsx` → `chart-header-toolbar`):
- `data-testid="mode-wheel"`
- `data-g16="partial"` / `data-g16-owner="bot-b"` / `data-g16-host="chart-header-toolbar"`
- `data-live-dom="true"`
- `data-matrix="insufficient"` / `data-no-invent="true"`
- Buttons: STFT / Waterfall / Wave / PSD → `setChartMode` / `setAuxChartKind`
- Desktop stamps: `data-desktop-main-mode="TimeFrequency|Waterfall"` · `data-desktop-aux-mode="Waveform|Psd"`

Demoted (not live):
- `SpectrumToolbar.tsx` `data-testid="mode-wheel-demoted"` · `data-live-dom="false"` · `data-g16-host="demoted-not-live-app-dom"` · same `data-matrix="insufficient"`

Evidence: `artifacts/validation/ui-parity/bot-b/BOT_B_D5_G16_LIVE_8a5b548.md` (merged via e9d84be → bf2fa8d)

## Chart consumers (C) — already wired; no new tip

| Consumer | Store | Status |
|----------|-------|--------|
| `MainChartHost` | `chartMode` (`stft` \| `waterfall`) | MET for store→paint (axis swap, view, BW, overlays) |
| `AuxChartHost` | `auxChartKind` (`wave` \| `psd`) | MET for store→paint (wave IQ / PSD derive) |
| BottomScale / strips | `chartMode` readout | present |

No missing desktop-backed consumer wiring was found that is clear enough to implement without inventing enable rules.

## Desktop enable/disable matrix — still insufficient → BLOCKED invent

- B shell stamps `data-matrix="insufficient"` on both live and demoted wheels.
- Bot-B D4/D5 notes: "Desktop mode enable/disable matrix — missing — PARTIAL" (`BOT_B_D4_D5_G09_G16_6fdd5fe.md` / `54445c0.md`).
- Desktop rebuild@`17471a6` QA folder has screenshots + capture notes; **no enable/disable matrix table** for MainMode×Aux×workspace that would justify disabling buttons or inventing narrowband/demod rules.
- Fence: no invent enable matrix; G06/G17 modes stay BLOCKED.

## Written conclusion

**PARTIAL** — B live shell + C store consumers for STFT/Waterfall/Wave/PSD.
**BLOCKED** — chart-side enable/disable matrix (desktop evidence insufficient; would be invent).

No code tip. matrix_pass_claimed=false. Never PASS.

## Paths cited

- `apps/web/src/components/ChartParamStrip.tsx` (live mode-wheel)
- `apps/web/src/components/SpectrumToolbar.tsx` (demoted)
- `apps/web/src/components/MainChartHost.tsx`
- `apps/web/src/components/AuxChartHost.tsx`
- `apps/web/src/App.tsx`
- `artifacts/validation/ui-parity/bot-b/BOT_B_D5_G16_LIVE_8a5b548.md`
- `artifacts/validation/ui-parity/bot-b/BOT_B_D4_D5_G09_G16_6fdd5fe.md`
- `artifacts/validation/ui-parity/INCREMENTAL_555d001/MATRIX.md`
