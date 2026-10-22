# Bot-G web-ce29329 G09 BottomScale vs desktop 17471a6 (NOT PASS / PARTIAL)

- HEAD/sync: ce29329c04a220894c7d4a367b203616e6029026
- Desktop: 17471a6488383b456281d12cb1a6d3d80290205d
- Scope: G09 physical-view bind screenshots only
- matrix_pass_claimed: false
- ui_parity_pass_claimed: false
- pass_claimed: false
- g09_status: PARTIAL

## Observed
- {"data_g09":"partial","data_g09_owner":"bot-b+c","data_axis_bind":"physical-view","bound_physical_view":true,"view_text":"| 视图 ΔT 33.536 ms · ΔF 1.000 MHz","delta_t":"0.033536","delta_f":"1000000","honesty_text":"axis bind: physical-view","honesty_bind":"physical-view","chart_mode":"stft","desktop_compare":"17471a6 viewData_/cursor meta chrome — web shows ΔT/ΔF via physical-view bind; PlotWidget tick paint / pixel parity vs rebuild not claimed (PARTIAL)"}

## Gaps / PARTIAL reason
- physical-view bind + ΔT/ΔF captured; no desktop pixel-parity screenshot available in this worktree — not inventing UI/screenshots

## Captures
- 01-g09-bottom-scale-full.png
- 01b-g09-bottom-scale-crop.png
- 01c-g09-delta-tf-crop.png

No PASS. No invented UI. Standby after this pack (no empty follow-on).