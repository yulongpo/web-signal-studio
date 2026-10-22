/**
 * Continuation shots 03 colorbar + 04 aux for ab29e28 (NOT PASS).
 */
import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.cwd(), '../../artifacts/validation/ui-parity/qa/web-ab29e28-quality');
const META = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-meta';
const DATA = 'D:/project/signal_studio_rebuild/resources/sigmf_data_demo/0000000.sigmf-data';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => { t = setTimeout(() => rej(new Error(label + ' timeout')), ms); }),
    ]);
  } finally { if (t) clearTimeout(t); }
}

test('ab29e28 colorbar+aux continuation', async ({ page }) => {
  test.setTimeout(90000);
  fs.mkdirSync(OUT, { recursive: true });
  await page.goto('/');
  await expect(page.getByTestId('app-shell')).toBeVisible({ timeout: 20000 });
  try {
    const iq = (await page.getByTestId('input-iq-wav').count()) > 0 ? page.getByTestId('input-iq-wav') : page.getByTestId('menubar-input-iq');
    await withTimeout(iq.setInputFiles([META, DATA]), 8000, 'iq');
  } catch {}
  try { await page.getByTestId('btn-load-sample').click({ force: true, timeout: 2000 }); } catch {}
  await sleep(800);
  await page.getByTestId('btn-workspace-wideband').click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByTestId('btn-mode-waterfall').click({ force: true, timeout: 2000 }).catch(() => {});
  await sleep(500);
  await withTimeout(page.screenshot({ path: path.join(OUT, '03-colorbar-waterfall.png'), fullPage: true }), 10000, 's3');
  const cs = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="display-colorscale"]') as HTMLElement | null;
    return { visible: !!(el && el.offsetParent !== null), text: el?.textContent?.slice(0, 200) || null };
  });
  fs.writeFileSync(path.join(OUT, '_shot03.json'), JSON.stringify(cs, null, 2));
  if (cs.visible) {
    await page.locator('[data-testid="display-colorscale"]').screenshot({ path: path.join(OUT, '03b-colorbar-crop.png') }).catch(() => {});
  }
  await page.getByTestId('btn-mode-stft').click({ force: true, timeout: 2000 }).catch(() => {});
  await page.getByTestId('btn-aux-wave').click({ force: true, timeout: 2000 }).catch(() => {});
  await sleep(600);
  await withTimeout(page.screenshot({ path: path.join(OUT, '04-aux-wave-center.png'), fullPage: true }), 10000, 's4');
  const aux = await page.evaluate(() => {
    const chart = document.querySelector('[data-testid="aux-chart"]') as HTMLElement | null;
    const wait = document.querySelector('[data-testid="aux-chart-waiting"]') as HTMLElement | null;
    return {
      chart: !!(chart && chart.offsetParent !== null),
      waiting: !!(wait && wait.offsetParent !== null),
      waitingText: wait?.textContent?.slice(0, 120) || null,
    };
  });
  fs.writeFileSync(path.join(OUT, '_shot04.json'), JSON.stringify(aux, null, 2));
  if (aux.chart) {
    await page.locator('[data-testid="aux-chart"]').screenshot({ path: path.join(OUT, '04b-aux-chart-crop.png') }).catch(() => {});
  }
  expect(fs.existsSync(path.join(OUT, '03-colorbar-waterfall.png'))).toBe(true);
  expect(fs.existsSync(path.join(OUT, '04-aux-wave-center.png'))).toBe(true);
});
