# QUALITY_DEMO_TREE — demo IQ → engineering tree (no PASS)

| Field | Value |
|-------|-------|
| When | 2026-10-22 Asia/Shanghai |
| Branch | `work/bot-b-ui` |
| Base | **`ef0e273`** = `ef0e2735cc73fde1f922de15f9a27e72f9bf40db` (GAP_QUALITY merge; includes C HOTFIX) |
| Tip | **3656153** = 36561530509c5f11e11d70468ada30a0505f88f3 |
| Desktop ref | READ-ONLY ~`17471a6` tree behavior |
| IQ | `D:\project\signal_studio_rebuild\resources\sigmf_data_demo\0000000.*` only |
| Rule | **matrix_pass_claimed: false**; no invent DSP / G06 / G17 / Multitaper / Burg |

## Problem (from GAP_QUALITY_8f73f69)

1. After chart has file-stft / demo IQ, ProjectTree still showed empty shell「尚未打开工程」because `openDemoIqForMainChart` only published `iqFileSession` and never set `projectDocument`.
2. `menu-load-demo-iq` was skipped in G packs as hang-prone; MenuBar lacked busy/timeout and browser could mis-route to `node:fs`.

## Fixes (this tip)

| Area | Change |
|------|--------|
| `auxWaveRawIq.ts` | `DemoSigmfHandle` keeps `metaText` + `dataByteLength`; `isNodeFsAvailable` false in Vite browser / Playwright (vitest still uses disk) |
| `projectIo/syncDemoIqProject.ts` | **New** — `importSigmfStream({ enforceDemoPath: true })` → `uiStore` projectDocument / summary / status |
| `openIqForMainChart.ts` | `openDemoIqForMainChart` default `syncProjectTree: true` after chart publish |
| `MenuBar.tsx` | `begin/endIqFileOpen` + 45s AbortController + `clearDemoSigmfCache` on timeout; CN error surfaces |
| `SpectrumToolbar.tsx` | same timeout; button label「加载演示 IQ」 |
| Tests | `openDemoIqForMainChart.test.ts` asserts `projectDocument.files.length > 0` |

## Self-test (HH-laptop)

1. `cd apps/web` → `npx vitest run src/dsp/openDemoIqForMainChart.test.ts` → both cases green (requires demo files on disk).
2. Dev: open web shell → File → **加载宽带演示 IQ（sigmf_data_demo）** or toolbar **加载演示 IQ**.
3. Expect: main chart IQ session `via=demo`; **工程树** leaves empty-state; shows real file/channel nodes from SigMF import (not sample fallback).
4. If load fails: CN error in menu/toolbar error strip; busy ends within ~45s (no infinite hang).

## Honesty

| Claim | Value |
|-------|-------|
| **matrix_pass_claimed** | **false** |
| Tree vs desktop pixel parity | **PARTIAL** — structure via F import path; not claimed CLOSED vs 17471a6 shots |
| Demo hang | Mitigated (browser fs guard + timeout + busy); **PARTIAL** until G re-runs menu-load path |
| Shell zh | Incremental (demo button); residual EN (e.g. Wideband/Narrowband mode labels) remains PARTIAL |
| G06 / G17 / invent DSP | untouched |

## Paths

- Evidence: `docs/acceptance/evidence/bot-b/QUALITY_DEMO_TREE_ef0e273.md`
- Prior gap: `docs/acceptance/evidence/bot-a/GAP_QUALITY_8f73f69.md`

