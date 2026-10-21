# Bot-E G17 DetectionCard full parameter grid — 2026-10-21 Asia/Shanghai

**Baseline (base):** `97fc7c0ab94507fc2c9d534b1c3e568458e128c7` (`97fc7c0`)  
**Branch:** `work/bot-e-g17-param-grid`  
**Desktop ref:** `signal_studio_rebuild` @ `17471a6` (`ui/detection/detection_card.*`, `domain/detection.h`)  
**CAO:** next-wave TOP — close G17 full parameter grid (was PARTIAL after DetectionCard selectable engine)  
**matrix_pass_claimed:** false

## Closed this tip

| Area | Desktop objectName | Web |
|------|--------------------|-----|
| Timing | `detectionFftSize`, `detectionHopMilliseconds`, `detectionModelFrames`, `detectionModelHopFrames` | inputs + createTask params |
| Threshold | `detectionScoreThreshold` | input + TRT scoreThreshold |
| Branch | `detectionNmsIou`, `detectionTopK`, `detectionBandwidthMarginDb`, `detectionSampleEdgeRatio`, `detectionSmoothMilliseconds`, `detectionMinOnMilliseconds`, `detectionMinOffMilliseconds`, `detectionCoarseSplitGapMilliseconds`, `detectionCoarseMinBurstMilliseconds` | grid + strategy/split gated enable |
| Advanced | `detectionBatchSize`, `detectionMinHits`, `detectionMaxMiss`, `detectionMergeFrequencyHz` | details section |
| Wiring | params → local-compute | `pipeline` passes params into `run_*_trt`; FFSCN/SCN honor score/topK/fft/frames |

## Still PARTIAL / BLOCKED

- Range origin / active segment / ROI select chrome vs desktop may still be lighter (sample range card exists elsewhere)
- Full desktop AdaptiveValueEdit validation / physical-times Fs calc (web notes only; no fake Fs)
- Narrowband recognition — BLOCKED (do not fake)
- **No matrix PASS**

## Verification

- objectName attributes present on param controls
- e2e: param grid visible; score edit; coarse disables margin; coarse+split enables coarse gap
- TRT path accepts params without inventing candidates
- `matrix_pass_claimed: false`

**Tip (HEAD):** `96deac987a8fa68cb8de132a49adec06f4236e3f`
