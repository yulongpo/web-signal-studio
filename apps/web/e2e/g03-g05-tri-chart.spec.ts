/**
 * Bot-C G03–G05 evidence: nav + aux Wave/PSD + vertical splitters.
 * Does not claim PASS; writes screenshots under artifacts/validation/ui-parity/bot-c/.
 */
import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const OUT = path.resolve(
  process.cwd(),
  "../../artifacts/validation/ui-parity/bot-c",
);
const DOCS = path.resolve(
  process.cwd(),
  "../../docs/acceptance/ui-parity/bot-c",
);

function ensureDirs() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(DOCS, { recursive: true });
}

async function dualShot(
  page: import("@playwright/test").Page,
  name: string,
  locator?: import("@playwright/test").Locator,
) {
  ensureDirs();
  const target = locator ?? page.locator('[data-testid="app-shell"]');
  const a = path.join(OUT, name);
  const b = path.join(DOCS, name);
  await target.screenshot({ path: a });
  fs.copyFileSync(a, b);
}

test.describe("G03–G05 tri-chart / splitter evidence", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-shell")).toBeVisible();
  });

  test("G03 global-nav is NavigationChart (not placeholder)", async ({ page }) => {
    const nav = page.getByTestId("global-nav");
    await expect(nav).toBeVisible();
    await expect(nav).not.toContainText(/placeholder/i);
    await expect(page.getByTestId("navigation-chart")).toBeVisible();
    await dualShot(page, "g03-global-nav.png", nav);
  });

  test("G04 aux Wave then PSD (no ChartPlaceholder)", async ({ page }) => {
    const aux = page.getByTestId("chart-aux");
    await expect(aux).toBeVisible();
    await expect(aux).toHaveAttribute("data-chart-kind", "waveform");
    await dualShot(page, "g04-aux-wave.png", page.getByTestId("aux-chart"));

    await page.getByTestId("btn-aux-psd").click();
    await expect(aux).toHaveAttribute("data-chart-kind", "psd");
    await dualShot(page, "g04-aux-psd.png", page.getByTestId("aux-chart"));
  });

  test("G05 vertical splitters drag + double-click reset", async ({ page }) => {
    const splitAux = page.getByTestId("splitter-aux-main");
    const splitNav = page.getByTestId("splitter-nav-aux");
    await expect(splitAux).toBeVisible();
    await expect(splitNav).toBeVisible();

    const before = Number(await splitAux.getAttribute("data-size-px"));
    const box = await splitAux.boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.mouse.down();
    await page.mouse.move(box!.x + box!.width / 2, box!.y + 40);
    await page.mouse.up();
    const after = Number(await splitAux.getAttribute("data-size-px"));
    expect(after).not.toBe(before);

    await splitAux.dblclick();
    const reset = Number(await splitAux.getAttribute("data-size-px"));
    expect([205, 176]).toContain(reset);

    await dualShot(page, "g05-splitters.png");
  });
});
