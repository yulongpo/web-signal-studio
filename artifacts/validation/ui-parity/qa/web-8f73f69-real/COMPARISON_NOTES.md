# Bot-G web-8f73f69-real vs desktop 17471a6 (NOT PASS)

- tip_web_base: 8f73f69461c044fc8bce3cc6efbc4f0903e0af06
- tip_desktop_compare: 17471a6488383b456281d12cb1a6d3d80290205d
- SigMF: D:/project/signal_studio_rebuild/resources/sigmf_data_demo
- pass_claimed: false

## Observations
{
  "load": {
    "via": "input-iq (menu-load-demo skipped to avoid hang)"
  },
  "shot01": {
    "dsp_source": "file-stft-worker",
    "iq_format": "sigmf",
    "tree_snippet": "工程树\n样例\n\n尚未打开工程。\n\n加载样例树，或打开原生工程 JSON（IQ 仅 sigmf_data_demo）。\n\n打开文件…\n打开粘贴的 JSON",
    "has_cjk": true
  },
  "shot02": {
    "file_pick": "skipped-soft-only",
    "dialog_visible": true,
    "data_add_signal": "f-wire",
    "title": "添加信号"
  },
  "shot03": {
    "chart_mode": "stft",
    "has_cjk": true,
    "has_en": true
  },
  "shot04": {
    "chart_mode": "waterfall"
  },
  "shot06_mark_before": {
    "mark_count": "0"
  }
}

## Gaps
- 05/06 PARTIAL: [2mexpect([22m[31mlocator[39m[2m).[22mtoBeVisible[2m([22m[2m)[22m failed

Locator: getByTestId('workspace-narrowband')
Expected: visible
Timeout: 8000ms
Error: element(s) not found

Call log:
[2m  - Expect "toBeVisible" getByTestId('workspace-narrowband') with timeout 8000ms[22m
[2m  - waiting for getByTestId('workspace-narrowband')[22m


## Absolute PNG paths
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-01-primary.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-03-wideband-stft.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-03b-wideband-gpu.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-05-narrowband.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-05b-nb-chart-regression.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-05c-real-iq-wave.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-05d-real-iq-psd.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\desktop-04-wideband-baseline.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\01-project-tree-cn-demo-loaded.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\01b-project-tree-crop.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\02-add-signal-dialog.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\02b-add-signal-dialog-crop.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\03-broadband-shell-stft-cjk-en.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\04-broadband-waterfall.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\06a-broadband-mark-before-nb.png
- D:\project\wss-wt-g\artifacts\validation\ui-parity\qa\web-8f73f69-real\05-narrowband-PARTIAL.png

No PASS.