# BOT_B G18 — right-rail display-summary

| Field | Value |
|-------|-------|
| Branch | `work/bot-b-ui` |
| Base | `e134bb699232acf00ae4f9632b92d4b792302d32` |
| Desktop ref | `696ce12` `displaySummary_` |
| matrix_pass_claimed | **false** |

## What landed

- Right-rail **display** page renders live `data-testid="display-summary"`.
- Copy always includes **参考** + **动态** (from `uiStore.level`).
- Buttons open Level / Display temp layers (`openLayer`).

## Not claimed

- Full PSD N / STFT N / palette lines from desktop (needs file+channel DSP state; Bot-C/D).
- ACCEPTANCE PASS.
