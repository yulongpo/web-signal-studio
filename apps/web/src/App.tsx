/**
 * PROVISIONAL - Bot-B Web UI shell composition.
 * Bot-C G03–G05: NavigationChart / WaveformChart / VerticalSplitter plug into host slots.
 * G11–G14 live on main (PR#2) via MainChartHost / HeatmapCanvas — not reimplemented here.
 */
import type { CSSProperties } from 'react';
import './App.css';
import { ProjectTree } from './components/ProjectTree';
import { StatusBar } from './components/StatusBar';
import { SpectrumToolbar } from './components/SpectrumToolbar';
import { TempLayers } from './components/TempLayers';
import { RightRail } from './components/RightRail';
import { MainChartHost } from './components/MainChartHost';
import { NavChartHost } from './components/NavChartHost';
import { AuxChartHost } from './components/AuxChartHost';
import { VerticalSplitter } from '@wss/charts/VerticalSplitter';
import { useUiStore } from './store/uiStore';

export default function App() {
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const navPaneHeightPx = useUiStore((s) => s.navPaneHeightPx);
  const auxPaneHeightPx = useUiStore((s) => s.auxPaneHeightPx);
  const setNavPaneHeightPx = useUiStore((s) => s.setNavPaneHeightPx);
  const setAuxPaneHeightPx = useUiStore((s) => s.setAuxPaneHeightPx);
  const shellClass = collapsed ? 'app-shell app-shell-rail-collapsed' : 'app-shell';

  return (
    <div className={shellClass} data-testid="app-shell" data-workspace-mode={workspaceMode}>
      <ProjectTree />

      <main
        className="workspace workspace-split"
        data-testid="workspace"
        data-workspace-mode={workspaceMode}
        style={
          {
            ['--nav-pane-h' as string]: `${navPaneHeightPx}px`,
            ['--aux-pane-h' as string]: `${auxPaneHeightPx}px`,
          } as CSSProperties
        }
      >
        <div className="global-nav" aria-label="global-nav" data-testid="global-nav">
          <NavChartHost />
        </div>

        <VerticalSplitter
          sizePx={navPaneHeightPx}
          minPx={28}
          maxPx={80}
          defaultPx={36}
          onChange={setNavPaneHeightPx}
          testId="splitter-nav-aux"
        />

        <section className="aux-chart" aria-label="aux-chart" data-testid="aux-chart">
          <AuxChartHost />
        </section>

        <VerticalSplitter
          sizePx={auxPaneHeightPx}
          minPx={80}
          maxPx={360}
          defaultPx={160}
          onChange={setAuxPaneHeightPx}
          testId="splitter-aux-main"
        />

        <SpectrumToolbar />

        <section className="main-chart" aria-label="main-chart" data-testid="main-chart">
          {workspaceMode === 'narrowband' ? (
            <div
              className="workspace-stub-banner"
              data-testid="workspace-narrowband-stub"
              role="status"
            >
              窄带工作区占位（stub）— DDC/解调由 Bot-D 提供；此处不伪解调。
            </div>
          ) : null}
          <MainChartHost />
        </section>

        <StatusBar />
      </main>

      <RightRail />
      <TempLayers />
    </div>
  );
}
