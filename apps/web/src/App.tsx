/**
 * PROVISIONAL - Bot-B Web UI shell composition.
 * Hosts Bot-C embeddables: NavChartHost / AuxChartHost / VerticalSplitter / MainChartHost.
 * Chrome (nav segments + zoom/pause; aux/spec param strips) is Bot-B — not reimplemented charts.
 * Splitter defaults align rebuild enforceLayout: nav=82 / aux=205 (short window aux=176).
 */
import { type CSSProperties, useEffect, useState } from 'react';
import './App.css';
import { ProjectTree } from './components/ProjectTree';
import { StatusBar } from './components/StatusBar';
import { BottomPanel } from './components/BottomPanel';
import { TempLayers } from './components/TempLayers';
import { RightRail } from './components/RightRail';
import { MainChartHost } from './components/MainChartHost';
import { useEscClearPinnedCursor } from './hooks/useEscClearPinnedCursor';
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


const SHELL_COL_KEY = 'wss.shellColumns.v1';
const LEFT_DEFAULT = 278;
const RIGHT_DEFAULT = 390;
const LEFT_MIN = 190;
const LEFT_MAX = 450;
const RIGHT_MIN = 320;
const RIGHT_MAX = 650;

const LEFT_COLLAPSE_MIN = 8;
const RIGHT_COLLAPSE_MIN = 8;

type ShellColumns = { left: number; right: number; leftCollapsed: boolean; rightCollapsed: boolean };

function readShellColumns(): ShellColumns {
  try {
    const raw = localStorage.getItem(SHELL_COL_KEY);
    if (!raw) return { left: LEFT_DEFAULT, right: RIGHT_DEFAULT, leftCollapsed: false, rightCollapsed: false };
    const parsed = JSON.parse(raw) as { left?: number; right?: number; leftCollapsed?: boolean; rightCollapsed?: boolean };
    const leftCollapsed = Boolean(parsed.leftCollapsed);
    const rightCollapsed = Boolean(parsed.rightCollapsed);
    return {
      left: leftCollapsed
        ? LEFT_COLLAPSE_MIN
        : Math.min(LEFT_MAX, Math.max(LEFT_MIN, Number(parsed.left) || LEFT_DEFAULT)),
      right: rightCollapsed
        ? RIGHT_COLLAPSE_MIN
        : Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, Number(parsed.right) || RIGHT_DEFAULT)),
      leftCollapsed,
      rightCollapsed,
    };
  } catch {
    return { left: LEFT_DEFAULT, right: RIGHT_DEFAULT, leftCollapsed: false, rightCollapsed: false };
  }
}

export default function App() {
  const [shellCols, setShellCols] = useState(readShellColumns);
  const leftColPx = shellCols.leftCollapsed ? LEFT_COLLAPSE_MIN : shellCols.left;
  const rightColPx = shellCols.rightCollapsed ? RIGHT_COLLAPSE_MIN : shellCols.right;
  useEffect(() => {
    try {
      localStorage.setItem(SHELL_COL_KEY, JSON.stringify(shellCols));
    } catch {
      /* ignore */
    }
    document.documentElement.style.setProperty('--shell-left-w', `${shellCols.left}px`);
    document.documentElement.style.setProperty('--shell-right-w', `${shellCols.right}px`);
  }, [shellCols]);

  const startResize = (side: 'left' | 'right', clientX0: number) => {
    const startLeft = shellCols.leftCollapsed ? LEFT_DEFAULT : shellCols.left;
    const startRight = shellCols.rightCollapsed ? RIGHT_DEFAULT : shellCols.right;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - clientX0;
      if (side === 'left') {
        const next = Math.min(LEFT_MAX, Math.max(LEFT_MIN, startLeft + dx));
        setShellCols((c) => ({ ...c, left: next, leftCollapsed: false }));
      } else {
        const next = Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, startRight - dx));
        setShellCols((c) => ({ ...c, right: next, rightCollapsed: false }));
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };


  const collapsed = useUiStore((s) => s.rightPanelCollapsed);
  const setRightPanelCollapsed = useUiStore((s) => s.setRightPanelCollapsed);
  const workspaceMode = useUiStore((s) => s.workspaceMode);
  const navPaneHeightPx = useUiStore((s) => s.navPaneHeightPx);
  const auxPaneHeightPx = useUiStore((s) => s.auxPaneHeightPx);
  const setNavPaneHeightPx = useUiStore((s) => s.setNavPaneHeightPx);
  const setAuxPaneHeightPx = useUiStore((s) => s.setAuxPaneHeightPx);
  const shellClass = collapsed ? 'app-shell app-shell-rail-collapsed' : 'app-shell';

  // G18 Esc clear pin (desktop Key_Escape → clearActiveLinkedCursor)
  useEscClearPinnedCursor();

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
    <div className={shellClass} data-testid="app-shell" data-workspace-mode={workspaceMode} data-g18-esc-clear="true">
      <MenuBar />
      <div
        className="app-shell-body"
        data-testid="app-shell-body"
        data-shell-columns={`${leftColPx}-${rightColPx}`}
        data-shell-left-collapsed={shellCols.leftCollapsed ? 'true' : 'false'}
        data-shell-collapse-min={String(LEFT_COLLAPSE_MIN)}
        data-shell-right-collapsed={shellCols.rightCollapsed ? 'true' : 'false'}
        data-shell-right-collapse-min={String(RIGHT_COLLAPSE_MIN)}
        data-shell-resizable="true"
        data-shell-edge-pair="lr" data-shell-persist="wss.shellColumns.v1" data-shell-desktop-left="278" data-shell-desktop-right="390"
        data-shell-reshot="wave8" data-shell-wave="wave9 wave11 wave14 wave17" data-shell-keyboard="wave17" data-shell-desktop-defaults="278/390"
        style={{
          gridTemplateColumns: collapsed
            ? `${leftColPx}px 6px 1fr 48px`
            : `${leftColPx}px 6px 1fr 6px ${rightColPx}px`,
        }}
      >
      <ProjectTree />
        <div
          className="shell-col-resize shell-col-resize-left"
          data-testid="shell-col-resize-left"
          aria-valuemin={LEFT_COLLAPSE_MIN}
          aria-valuemax={800}
          aria-valuenow={leftColPx}
          data-shell-edge="left"
          data-edge-side="left"
          data-hit-min-px="8"
          tabIndex={0}
          data-shell-focus="wave9"
          data-shell-reshot="wave8"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整工程树宽度"
          onPointerDown={(e) => {
            e.preventDefault();
            startResize('left', e.clientX);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            setShellCols((c) => {
              if (c.leftCollapsed) {
                return { ...c, leftCollapsed: false, left: Math.max(LEFT_MIN, c.left === LEFT_COLLAPSE_MIN ? LEFT_DEFAULT : c.left) };
              }
              return { ...c, leftCollapsed: true, left: LEFT_COLLAPSE_MIN };
            });
          }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 24 : 8;
            if (e.key === 'Escape') {
              (e.currentTarget as HTMLElement).blur();
              return;
            }
            if (e.key === 'Home') {
              e.preventDefault();
              setShellCols((c) => ({ ...c, leftCollapsed: false, left: LEFT_DEFAULT }));
              return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              const dir = e.key === 'ArrowLeft' ? -step : step;
              setShellCols((c) => {
                const base = c.leftCollapsed ? LEFT_DEFAULT : c.left;
                const next = Math.min(LEFT_MAX, Math.max(LEFT_MIN, base + dir));
                return { ...c, left: next, leftCollapsed: false };
              });
            }
          }}
          data-shell-keydown="wave17"
          title="Drag resize; double-click collapse-to-min (8px)"
          data-collapse-min="true"
        />

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
          minPx={62}
          maxPx={128}
          defaultPx={DESKTOP_NAV_DEFAULT}
          onChange={setNavPaneHeightPx}
          testId="splitter-nav-aux"
          handleWidth={10}
        />

        <section className="aux-chart" aria-label="aux-chart" data-testid="aux-chart">
          <AuxParamStrip />
          <AuxChartHost />
        </section>

        <VerticalSplitter
          sizePx={auxPaneHeightPx}
          minPx={116}
          maxPx={360}
defaultPx={auxDefaultPx}
          onChange={setAuxPaneHeightPx}
          testId="splitter-aux-main"
          handleWidth={10}
        />

        <section className="main-chart" aria-label="main-chart" data-testid="main-chart">
          <SpecParamStrip />
          {workspaceMode === 'narrowband' ? (
            <NarrowbandWorkspace />
          ) : (
            <MainChartHost />
          )}
        </section>

        <BottomPanel />
        <StatusBar />
      </main>

      <div
          className="shell-col-resize shell-col-resize-right"
          data-testid="shell-col-resize-right"
          aria-valuemin={RIGHT_COLLAPSE_MIN}
          aria-valuemax={800}
          aria-valuenow={rightColPx}
          data-shell-edge="right"
          data-edge-side="right"
          data-hit-min-px="8"
          tabIndex={0}
          data-shell-focus="wave9"
          data-shell-reshot="wave8"
          role="separator"
          aria-orientation="vertical"
          aria-label="调整右栏宽度"
          onPointerDown={(e) => {
            e.preventDefault();
            startResize('right', e.clientX);
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            setShellCols((c) => {
              if (c.rightCollapsed) {
                setRightPanelCollapsed(false);
                return {
                  ...c,
                  rightCollapsed: false,
                  right: Math.max(RIGHT_MIN, c.right === RIGHT_COLLAPSE_MIN ? RIGHT_DEFAULT : c.right),
                };
              }
              setRightPanelCollapsed(true);
              return { ...c, rightCollapsed: true, right: RIGHT_COLLAPSE_MIN };
            });
          }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 24 : 8;
            if (e.key === 'Escape') {
              (e.currentTarget as HTMLElement).blur();
              return;
            }
            if (e.key === 'Home') {
              e.preventDefault();
              setShellCols((c) => ({ ...c, rightCollapsed: false, right: RIGHT_DEFAULT }));
              return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
              e.preventDefault();
              const dir = e.key === 'ArrowLeft' ? step : -step;
              setShellCols((c) => {
                const base = c.rightCollapsed ? RIGHT_DEFAULT : c.right;
                const next = Math.min(RIGHT_MAX, Math.max(RIGHT_MIN, base + dir));
                return { ...c, right: next, rightCollapsed: false };
              });
            }
          }}
          data-shell-keydown="wave17"
          title="Drag resize; double-click collapse-to-min (8px) + rail fold"
          data-collapse-min="true"
        />
        <RightRail />
      <TempLayers />
      </div>
    </div>
  );
}
