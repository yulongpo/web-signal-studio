# Bot-C handoff — G18 modulation STFT linkedCursor (no PASS)

| Field | Value |
|-------|-------|
| Asia/Shanghai | 2026-10-22 02:00 |
| Base | d4f0943 (origin/main) |
| Branch | work/bot-c-charts |
| Desktop | 17471a6 NarrowbandWorkspace::updateLinkedCursors — modulationStft_/recognitionStft_ setLinkedCursor |
| matrix_pass_claimed | false |

## Landed

| Item | Note |
|------|------|
| G18 mod STFT linkedCursor | NarrowbandModulationCharts: resolveNbStftLinkedCursor + SpectrumChart linkedCursor; pin host click/Alt-clear; stamps data-g18-nb-mod-stft-linked-cursor |
| Helper | nbMultiViewLinked comment + pinned-only vitest |
| Recognition STFT pane | **no tip** — web deepLearning page is BLOCKED ChartPanel (no SpectrumChart); not inventing STFT feed / G06/G17 |
| G11 | none |

## Desktop evidence

- ui/narrowband_workspace.cpp updateLinkedCursors: for (waveform_, psd_, stft_, modulationStft_, recognitionStft_) setLinkedCursor
- bindGesture(modulationStft_/recognitionStft_)
- Web recognition: nb-panel-dl-stft status BLOCKED only — no chart to wire

## Owner split

| Item | Owner |
|------|-------|
| Mod STFT linked chrome | Bot-C (this tip) |
| Recognition algorithm / STFT feed | BLOCKED / not C invent |
| Rail | Bot-B untouched |
| DSP | Bot-D untouched |
