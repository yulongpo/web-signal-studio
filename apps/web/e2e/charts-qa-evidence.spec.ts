/**
 * Bot-C QA-G evidence: M-03 screenshot, M-04 pan/zoom, C-03 resize (WIP — not PASS).
 */
import { expect, test } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EVIDENCE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../../docs/acceptance/evidence/bot-c",
);

function ensureEvidenceDir(): void {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
}

test.describe("Bot-C charts QA evidence (WIP)", () => {
  test("M-03 screenshot of MainChartHost / SpectrumChart", async ({ page }) => {
    ensureEvidenceDir();
    await page.goto("/");
    const host = page.getByTestId("main-chart-host");
    await expect(host).toBeVisible({ timeout: 30_000 });
    const chart = page.getByTestId("chart-main");
    await expect(chart).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(800);
    await host.screenshot({ path: join(EVIDENCE_DIR, "m03_spectrum_chart.png") });
    await chart.screenshot({ path: join(EVIDENCE_DIR, "m03_chart_main.png") });
  });

  test("M-04 pan/zoom sets data-interaction-mode preview then refine", async ({ page }) => {
    ensureEvidenceDir();
    await page.goto("/");
    const chart = page.getByTestId("chart-main");
    await expect(chart).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500);
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    const cx = box!.x + box!.width * 0.5;
    const cy = box!.y + box!.height * 0.5;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 40, cy + 20, { steps: 6 });
    await expect(chart).toHaveAttribute("data-interaction-mode", "preview", { timeout: 2000 });
    await page.mouse.up();
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -120);
    await expect(chart).toHaveAttribute("data-interaction-mode", "preview", { timeout: 2000 });
    await page.waitForTimeout(400);
    const mode = await chart.getAttribute("data-interaction-mode");
    expect(["refine", "idle", "preview"]).toContain(mode);
    writeFileSync(
      join(EVIDENCE_DIR, "m04_playwright_pan_zoom_2026-10-21.json"),
      JSON.stringify({
        bot: "bot-c",
        gate: "M-04",
        writtenAt: new Date().toISOString(),
        interactionModeAfterGesture: mode,
        note: "Playwright pan/zoom on chart-main; Node CPU synthetic alone is not this evidence",
        status: "WIP",
      }, null, 2),
      "utf8",
    );
  });

  test("C-03 resize viewport records canvas buffer + dpr", async ({ page }) => {
    ensureEvidenceDir();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    const chart = page.getByTestId("chart-main");
    await expect(chart).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500);
    const before = await chart.evaluate((el) => {
      const canvas = el.querySelector("canvas");
      return {
        cssW: (el as HTMLElement).clientWidth,
        cssH: (el as HTMLElement).clientHeight,
        bufferWidth: canvas?.width ?? 0,
        bufferHeight: canvas?.height ?? 0,
        dpr: window.devicePixelRatio,
        dataDpr: el.getAttribute("data-dpr"),
        dataBufferWidth: el.getAttribute("data-buffer-width"),
        dataBufferHeight: el.getAttribute("data-buffer-height"),
      };
    });
    await page.setViewportSize({ width: 900, height: 600 });
    await page.waitForTimeout(400);
    const after = await chart.evaluate((el) => {
      const canvas = el.querySelector("canvas");
      return {
        cssW: (el as HTMLElement).clientWidth,
        cssH: (el as HTMLElement).clientHeight,
        bufferWidth: canvas?.width ?? 0,
        bufferHeight: canvas?.height ?? 0,
        dpr: window.devicePixelRatio,
        dataDpr: el.getAttribute("data-dpr"),
        dataBufferWidth: el.getAttribute("data-buffer-width"),
        dataBufferHeight: el.getAttribute("data-buffer-height"),
      };
    });
    expect(after.bufferWidth).toBeGreaterThan(0);
    expect(after.bufferHeight).toBeGreaterThan(0);
    expect(after.cssW).not.toBe(before.cssW);
    await chart.screenshot({ path: join(EVIDENCE_DIR, "c03_resize_chart.png") });
    writeFileSync(
      join(EVIDENCE_DIR, "c03_resize_dpr_2026-10-21.json"),
      JSON.stringify({
        bot: "bot-c",
        gate: "C-03",
        writtenAt: new Date().toISOString(),
        before,
        after,
        screenshot: "c03_resize_chart.png",
        status: "WIP",
        note: "Playwright viewport resize; canvas backing store reflects DPR",
      }, null, 2),
      "utf8",
    );
  });
});
