/**
 * Bot-B nav chrome (rebuild f9f05bb / 17471a6): segments + zoom/pause/segment.
 * NavigationChart remains time-window only (Bot-C). Settings do NOT live here.
 */
import { useUiStore } from '../store/uiStore';

export function NavChrome() {
  const chartMode = useUiStore((s) => s.chartMode);
  const setChartMode = useUiStore((s) => s.setChartMode);
  const auxChartKind = useUiStore((s) => s.auxChartKind);
  const setAuxChartKind = useUiStore((s) => s.setAuxChartKind);
  const setRightPage = useUiStore((s) => s.setRightPage);
  const setRightPanelCollapsed = useUiStore((s) => s.setRightPanelCollapsed);
  const navPaused = useUiStore((s) => s.navPaused);
  const setNavPaused = useUiStore((s) => s.setNavPaused);
  const full = useUiStore((s) => s.navFullTime);
  const win = useUiStore((s) => s.navWindowTime);
  const setWin = useUiStore((s) => s.setNavWindowTime);
  const setActiveTool = useUiStore((s) => s.setActiveTool);

  const zoomWindow = (factor: number) => {
    const span = Math.max(1e-9, win.max - win.min);
    const mid = (win.min + win.max) / 2;
    const nextSpan = Math.min(full.max - full.min, Math.max(span * factor, (full.max - full.min) * 0.02));
    let min = mid - nextSpan / 2;
    let max = mid + nextSpan / 2;
    if (min < full.min) {
      max += full.min - min;
      min = full.min;
    }
    if (max > full.max) {
      min -= max - full.max;
      max = full.max;
    }
    setWin({
      min: Math.max(full.min, min),
      max: Math.min(full.max, max),
    });
  };

  return (
    <div className="nav-chrome" data-testid="nav-chrome" role="toolbar" aria-label="chart-navigation">
      <div className="nav-segments" data-testid="nav-segments">
        <button
          type="button"
          data-testid="nav-seg-time"
          data-active={auxChartKind === 'wave'}
          onClick={() => setAuxChartKind('wave')}
        >
          时域
        </button>
        <button
          type="button"
          data-testid="nav-seg-power"
          data-active={auxChartKind === 'psd'}
          onClick={() => setAuxChartKind('psd')}
        >
          功率
        </button>
        <button
          type="button"
          data-testid="nav-seg-detect"
          onClick={() => {
            setRightPanelCollapsed(false);
            setRightPage('detect');
          }}
        >
          检测
        </button>
        <span className="toolbar-sep" aria-hidden />
        <button
          type="button"
          data-testid="nav-seg-stft"
          data-active={chartMode === 'stft'}
          onClick={() => setChartMode('stft')}
        >
          时频
        </button>
        <button
          type="button"
          data-testid="nav-seg-waterfall"
          data-active={chartMode === 'waterfall'}
          onClick={() => setChartMode('waterfall')}
        >
          瀑布
        </button>
      </div>
      <div className="nav-transport" data-testid="nav-transport">
        <button type="button" data-testid="nav-zoom-out" onClick={() => zoomWindow(1.25)} title="Zoom out window">
          −
        </button>
        <button type="button" data-testid="nav-zoom-in" onClick={() => zoomWindow(0.8)} title="Zoom in window">
          +
        </button>
        <button
          type="button"
          data-testid="nav-pause"
          data-active={navPaused}
          aria-pressed={navPaused}
          onClick={() => setNavPaused(!navPaused)}
        >
          {navPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          data-testid="nav-segment"
          onClick={() => setActiveTool('detection-roi')}
          title="Detection ROI tool"
        >
          Segment
        </button>
      </div>
    </div>
  );
}
