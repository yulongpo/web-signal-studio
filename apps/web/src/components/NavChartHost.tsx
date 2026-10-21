/**
 * Bot-C G03 host: global time navigation for `global-nav` slot.
 * Envelope derived from main spectrogram (display only).
 */
import { useMemo } from 'react';
import { NavigationChart } from '@wss/charts/NavigationChart';
import { useUiStore } from '../store/uiStore';
import { deriveNavEnvelope } from '../dsp/chartDisplayDerive';

export function NavChartHost() {
  const full = useUiStore((s) => s.navFullTime);
  const win = useUiStore((s) => s.navWindowTime);
  const setWin = useUiStore((s) => s.setNavWindowTime);
  const snap = useUiStore((s) => s.spectrogramDisplay);

  const envelope = useMemo(() => {
    if (!snap || snap.frameCount < 2) return undefined;
    return deriveNavEnvelope(snap);
  }, [snap]);

  return (
    <div
      style={{ width: '100%', height: '100%', minHeight: 28 }}
      data-nav-ready={snap ? 'true' : 'false'}
      data-testid="nav-chart-host"
    >
      <NavigationChart
        fullTime={{ min: full.min, max: full.max, unit: 's', label: 'Time' }}
        windowTime={win}
        envelope={envelope}
        height="100%"
        testId="navigation-chart"
        onWindowChange={setWin}
      />
    </div>
  );
}
