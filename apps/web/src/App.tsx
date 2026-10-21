/**
 * PROVISIONAL - Bot-B Web UI shell composition.
 * Main chart: @wss/charts SpectrumChart. Aux: placeholder slot for Bot-C waveform/PSD.
 */
import './App.css';
import { ProjectTree } from './components/ProjectTree';
import { StatusBar } from './components/StatusBar';
import { ChartPlaceholder } from './components/ChartPlaceholder';
import { SpectrumToolbar } from './components/SpectrumToolbar';
import { TempLayers } from './components/TempLayers';
import { RightRail } from './components/RightRail';
import { MainChartHost } from './components/MainChartHost';
import { useUiStore } from './store/uiStore';

export default function App() {
  const auxChartKind = useUiStore((s) => s.auxChartKind);
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const shellClass = collapsed ? 'app-shell app-shell-rail-collapsed' : 'app-shell';

  return (
    <div className={shellClass} data-testid="app-shell">
      <ProjectTree />

      <main className="workspace" data-testid="workspace">
        <div className="global-nav" aria-label="global-nav" data-testid="global-nav">
          <span>Global time nav (placeholder)</span>
        </div>

        <section className="aux-chart" aria-label="aux-chart" data-testid="aux-chart">
          <div className="chart-host" data-chart-slot="aux" data-chart-kind={auxChartKind}>
            <ChartPlaceholder
              title={auxChartKind === 'psd' ? 'PSD' : 'Waveform'}
              subtitle="aux slot - Bot-C @wss/charts"
              testId="chart-aux"
            />
          </div>
        </section>

        <SpectrumToolbar />

        <section className="main-chart" aria-label="main-chart" data-testid="main-chart">
          <MainChartHost />
        </section>

        <StatusBar />
      </main>

      <RightRail />
      <TempLayers />
    </div>
  );
}
