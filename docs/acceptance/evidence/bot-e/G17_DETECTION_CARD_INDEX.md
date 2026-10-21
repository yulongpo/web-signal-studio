# Bot-E G17 DetectionCard - selectable .engine - 2026-10-21 Asia/Shanghai

**Baseline (base):** `23412f2886eee00781ac070ef38c24425fa9cfa2` (`23412f2`)  
**Branch:** `work/bot-e-g17-detection-card`  
**Desktop ref:** `signal_studio_rebuild` @ `17471a6` (`ui/detection/detection_card.*`)  
**CAO note:** `INCREMENTAL_425cb40` marked G17 PARTIAL — DetectionCard + selectable `.engine` NOT MET  
**matrix_pass_claimed:** false

## Closed this tip

| Area | Gap (INCREMENTAL_425cb40) | Change |
|------|---------------------------|--------|
| Selectable `.engine` | display-only inventory | `detection-engine-select` + inventory `data-selectable` / pick |
| G26 | .pth must not be choosable | `.pth` `data-selectable=false`; never options in select |
| DetectionCard chrome | strategy / phase / profile | spectrum mode, time strategy, split bursts, draft/preflight/summary, phase bar |
| Wiring | params ignored | `params.modelId`/`enginePath` → pipeline resolve under model roots only |

## Still PARTIAL / BLOCKED

- Full desktop parameter grid (timing/thresholds/branches) — residual PARTIAL
- Narrowband recognition — BLOCKED (do not fake)
- **No matrix PASS**

See `g17_detection_card_summary_2026-10-21.json`.

**Tip (HEAD):** 8bf1390b08a855fc37659df71d3f05dad24ae83d (8bf1390)

