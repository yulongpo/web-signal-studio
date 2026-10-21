# UI parity comparison notes — Bot-G evidence (NOT PASS)

| Field | Value |
|-------|--------|
| Asia/Shanghai | 2026-10-21 |
| Web tip (this pack) | `905cdadda26b0ef453256be8352a30824851addf` (≥ DDC `ef2713a`) |
| DDC feature tip | `ef2713a735cc96407ff2dcf7156f08fffb74a6a3` |
| Interim G01 (folded) | `d9263ac` / `qa/web-d8297d1` — superseded |
| Desktop tip | `17471a6488383b456281d12cb1a6d3d80290205d` |
| **ui_parity_pass_claimed** | **false** |
| **matrix_pass_claimed** | **false** |

## Evidence dirs

| Dir | Contents |
|-----|----------|
| `qa/web-905cdad/` | **Current:** G01 menubar + NB observe DDC filled (`data-nb-chart-ready=true`) |
| `qa/web-6c17a53/` | Prior NB shell; observe **STALE empty DDC** |
| `qa/web-d8297d1/` | Interim G01-only — **superseded** by web-905cdad |
| `qa/web-17937bb/` | Older full pack; G01/G06 STALE markers |
| `bot-b/` | Bot-B wiring shots (not Bot-G PASS) |

## G01 + NB observe before / after

| | Before | After (`web-905cdad`) |
|--|--------|----------------------|
| G01 | absent / interim d9263ac @ d8297d1 | menubar+command-bar 34px; File Open IQ; View↔NB |
| NB observe | `web-6c17a53` empty hosts | wave/PSD/STFT **ready**; pipeline `sigmf_data_demo→DDC` LO~2.15MHz R=1/16 |
| Stub | cleared since 6c17a53 | still cleared |

## Observations (not PASS)

- `nb_charts_non_empty: true`; charts mounted; pipeline kind `ddc`.
- Menubar height 34; menu Open IQ visible.
- Demod pages still honest empty (not claimed filled).
- Desktop interactive parity not re-done.

## Gaps

1. Not UI_PARITY PASS — CAO decides.
2. Desktop menubar / filled-NB side-by-side incomplete.
3. G02 chrome / other gates untouched.
4. Modulation/demod/DL pages still awaiting real paths.

## Reproduce

```text
cd apps/web && npx playwright test e2e/bot-g-g01-nb-observe-capture.spec.ts
```
