# INCREMENTAL_0e31e6d — G06 golden delta (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-21 22:37 Asia/Shanghai |
| Web tip (audit subject) | **`0e31e6d`** = `5d33611` (E G06 recognition BLOCKED assess) + Bot-D **`9e65f0f`** golden tighten; prior Bot-A `35abc07` already on main via `04e1ee2` |
| Desktop | **`17471a6`** (`rebuild/a143-native`) |
| Prior Bot-A | `INCREMENTAL_ba868e4.md` @ `35abc07` (merged main `04e1ee2` / lineage through `5d33611`) |
| Scope | **G06** primary; siblings only if clearly affected by this tip |
| Rule | Read-only; **no matrix PASS**; screenshots alone never CLOSE; goldens alone never CLOSE |
| Next tip note | `origin/main` already advanced to **`e134bb6`** (F G19 residual tree API). **This deliverable stays on audit subject `0e31e6d` / G06**; full e134bb6 reopen deferred (G19 next wave). |

## Verified SHAs

| SHA | Role |
|-----|------|
| `0e31e6d58867deb3e76ce1645346aecd0dc66481` | `origin/main` tip at audit start (G06 golden merge) |
| `9e65f0f5d9373735035047a0d915f54f909db995` | Bot-D: constellation/demod/STFT/NB DDC **test** goldens |
| `2d05b7348a1084ea340681475f8023878f267011` | Bot-E: `G06_RECOGNITION_ASSESS_BLOCKED.md` |
| `5d33611` | merge(bot-e) recognition assess |
| `17471a6488383b456281d12cb1a6d3d80290205d` | Desktop tip |
| `e134bb6` | **post-audit** main tip (F G19) — noted only; not this audit subject |

## Diff vs prior (`ba868e4` → `0e31e6d`)

**No non-test implementation `.ts`/`.tsx` changes.** Delta is:

1. Unit-test golden tighten (`9e65f0f`) on already-wired Bot-D paths
2. Bot-E recognition honesty assess (docs only)
3. Prior Bot-A `INCREMENTAL_ba868e4` / GAP refresh already on lineage

Therefore: **no gap status flip** expected for G06; deepen evidence / residuals only.

## Verdict summary

| ID | Prior (`ba868e4`) | Now (`0e31e6d`) | One-liner |
|----|-------------------|-----------------|-----------|
| **G06** | PARTIAL (deepened) | **PARTIAL (goldens + BLOCKED assess)** | Wired constellation/AM·FM·RMS/STFT/NB DDC paths keep numerical goldens; eye/bitstream/recognition remain honest BLOCKED; chrome/title/interactive STFT residual unchanged |
| G07 / G02 / G11 / G13 / G14 / G17 / G19 | as `ba868e4` | **unchanged** | No impl in this tip |

**Counts (membership-normalized):** OPEN **9** · PARTIAL **14** · CLOSED **2** (G05, G14) · DOCS **1** (G25). **No PASS.**

- OPEN: G08–G10, G16, G18, G21–G24
- PARTIAL: G01, G02–G04, **G06**, G07, G11–G13, G15, G17, G19–G20, G26
- CLOSED: G05, G14

## G06 detail

| Sub-item | Verdict | Evidence |
|----------|---------|----------|
| Observe-page real DDC | **MET** (prior) | unchanged vs `ef2713a`/`ba868e4` |
| Mod constellation + STFT DDC preview | **MET (wired + golden)** | `narrowbandModulationDdc.ts` + `constellationFromIq.ts` + `stftFromChunkedReader.ts`; tests assert non-empty constellation, `stft.frameCount`/`binCount`/power geometry (`9e65f0f`) |
| Demod AM / FM / RMS DDC preview | **MET (wired + golden)** | `narrowbandDemodDdc.ts` + `simpleDemodFromIq.ts`; AM/FM/RMS finite + RMS bounds goldens (`9e65f0f`) |
| Eye diagram | **BLOCKED (honest)** | `reasonCode: 'EYE_TIMING_SYNC_MISSING'`; test expects `result.eye.status === 'BLOCKED'` |
| Bitstream / protocol demod | **BLOCKED (honest)** | `reasonCode: 'BITSTREAM_DEMOD_MISSING'`; AM/FM/RMS tests keep bitstream BLOCKED |
| DL modulation recognition | **BLOCKED (honest)** | Contract `RECOGNITION_ENGINE_MISSING`; Bot-E assess: FFSCN/SCN are **detection** heads only — refuse remap to fake labels (`docs/acceptance/evidence/bot-e/G06_RECOGNITION_ASSESS_BLOCKED.md`) |
| Four-page chrome (prior B) | **MET (chrome)** | prior `15022b5`; not re-opened here |
| Workbench title parity / channel-linked interactive STFT | **NOT MET** | residual vs desktop `NarrowbandWorkspace` / a64117e semantics |
| IQ / models hard rule | **MET (honesty)** | Runtime UI path `sigmf_data_demo`; unit fixtures synthetic-only; models still rebuild `*.engine` for detect (G17), not invent recognition weights |

**Item not CLOSED.** Goldens strengthen confidence in wired previews; they do **not** satisfy desktop four-page product parity (eye / recognition / bitstream / interactive STFT / title).

Code paths: `apps/web/src/dsp/narrowbandPageDspContracts.ts`, `narrowbandModulationDdc.ts`, `narrowbandDemodDdc.ts`, `constellationFromIq.ts`, `simpleDemodFromIq.ts`, `stftFromChunkedReader.ts` (+ `*.test.ts` @ `9e65f0f`).

## Sibling note

No status change claimed for G17 (detection ≠ recognition), G26 (engine picker), G07, G02, G19. Recognition BLOCKED assess **reinforces** G06 residual; does not reopen G17.

## TOP residual (max 8, parallel-friendly)

1. **G06 residual** — eye timing sync; recognition engine+ok contract; bitstream demod; workbench title + channel-linked interactive STFT (Bot-D/B/E; product unblock for recognition model)
2. **G17 residual** — DetectionCard fields + selectable `.engine` picker (overlaps G26)
3. **G02 residual** — retire aux→main SpectrumToolbar habit; f9f05bb overflow focus
4. **G07 residual** — AnnotationPanel / DetectionPanel full bottom hosts
5. **G11 residual** — axis-only / middle-button pan
6. **G08** — left/right column widths 278/390 (OPEN)
7. **G19 residual** — desktop badge/relation/compact-detail (**next baseline `e134bb6`** may deepen API; re-audit separately)
8. **G18** — display/channel page fill + 参考/动态 summary copy (OPEN)

## Explicit

**matrix_pass_claimed: false**  
**No ACCEPTANCE_MATRIX PASS. No self-declared PASS.**  
G06 remains **PARTIAL** — not CLOSED. Counts unchanged from `ba868e4`.