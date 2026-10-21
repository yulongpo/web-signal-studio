/**
 * PROVISIONAL - Bot-B Web UI shell composition.
 * Hosts Bot-C embeddables: NavChartHost / AuxChartHost / VerticalSplitter / MainChartHost.
 * Chrome (nav segments + zoom/pause; aux/spec param strips) is Bot-B — not reimplemented charts.
 * Splitter defaults align rebuild enforceLayout: nav=82 / aux=205 (short window aux=176).
 */
import { useEffect, type CSSProperties } from 'react';
import './App.css';
import { ProjectTree } from './components/ProjectTree';
import { StatusBar } from './components/StatusBar';
import { TempLayers } from './components/TempLayers';
import { RightRail } from './components/RightRail';
import { MainChartHost } from './components/MainChartHost';
import { NavChartHost } from './components/NavChartHost';
import { AuxChartHost } from './components/AuxChartHost';
import { NavChrome } from './components/NavChrome';
import { AuxParamStrip, SpecParamStrip } from './components/ChartParamStrip';
import { NarrowbandWorkspace } from './components/NarrowbandWorkspace';
import { MenuBar } from './components/MenuBar';
import { VerticalSplitter } from '@wss/charts/VerticalSplitter';
import { useUiStore } from './store/uiStore';

const DESKTOP_NAV_DEFAULT = 82;
const DESKTOP_AUX_DEFAULT = 205;
const SHORT_WINDOW_AUX = 176;
const SHORT_WINDOW_H = 900;

export default function App() {
  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const navPaneHeightPx = useUiStore((s) => s.navPaneHeightPx);
  const auxPaneHeightPx = useUiStore((s) => s.auxPaneHeightPx);
  const setNavPaneHeightPx = useUiStore((s) => s.setNavPaneHeightPx);
  const setAuxPaneHeightPx = useUiStore((s) => s.setAuxPaneHeightPx);
  const shellClass = collapsed ? 'app-shell app-shell-rail-collapsed' : 'app-shell';

  // Short-window aux default 176 (rebuild note); otherwise 205.
  useEffect(() => {
    const short = window.innerHeight < SHORT_WINDOW_H;
    const auxDefault = short ? SHORT_WINDOW_AUX : DESKTOP_AUX_DEFAULT;
    const s = useUiStore.getState();
    if (s.auxPaneHeightPx === DESKTOP_AUX_DEFAULT || s.auxPaneHeightPx === SHORT_WINDOW_AUX || s.auxPaneHeightPx === 160) {
      setAuxPaneHeightPx(auxDefault);
    }
    if (s.navPaneHeightPx === 36) {
      setNavPaneHeightPx(DESKTOP_NAV_DEFAULT);
    }
  }, [setAuxPaneHeightPx, setNavPaneHeightPx]);

  const auxDefaultPx =
    typeof window !== 'undefined' && window.innerHeight < SHORT_WINDOW_H
      ? SHORT_WINDOW_AUX
      : DESKTOP_AUX_DEFAULT;

  return (
    <div className={shellClass} data-testid="app-shell" data-workspace-mode={workspaceMode}>
      <MenuBar />
      <div className="app-shell-body" data-testid="app-shell-body">
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
          <NavChrome />
          <div className="nav-chart-slot" data-testid="nav-chart-slot">
            <NavChartHost />
          </div>
        </div>

        <VerticalSplitter
          sizePx={navPaneHeightPx}
minPx={48}
          maxPx={160}
          defaultPx={DESKTOP_NAV_DEFAULT}
          onChange={setNavPaneHeightPx}
          testId="splitter-nav-aux"
        />

        <section className="aux-chart" aria-label="aux-chart" data-testid="aux-chart">
          <AuxParamStrip />
          <AuxChartHost />
        </section>

        <VerticalSplitter
          sizePx={auxPaneHeightPx}
          minPx={80}
          maxPx={360}
defaultPx={auxDefaultPx}
          onChange={setAuxPaneHeightPx}
          testId="splitter-aux-main"
        />

        <section className="main-chart" aria-label="main-chart" data-testid="main-chart">
          <SpecParamStrip />
          {workspaceMode === 'narrowband' ? (
            <NarrowbandWorkspace />
          ) : (
            <MainChartHost />
          )}
        </section>

        <StatusBar />
      </main>

      <RightRail />
      <TempLayers />
      </div>
    </div>
  );
}
