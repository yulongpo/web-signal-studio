import { expect, test } from "@playwright/test";

const RAIL: { label: string; body: RegExp }[] = [
  { label: "显示", body: /显示参数/ },
  { label: "检测", body: /检测首屏/ },
  { label: "标记", body: /三来源标记/ },
  { label: "通道", body: /窄带通道/ },
];

test.describe("shell navigation", () => {
  test("switches four context-rail pages", async ({ page }) => {
    await page.goto("/");
    const rail = page.getByLabel("context-rail");
    await expect(rail).toBeVisible();

    for (const item of RAIL) {
      const tab = rail.getByRole("button", { name: item.label, exact: true });
      await tab.click();
      await expect(tab).toHaveAttribute("data-active", "true");
      await expect(rail.locator(".rail-body")).toContainText(item.body);
    }
  });

  test("toggles aux chart between waveform and PSD", async ({ page }) => {
    await page.goto("/");
    const aux = page.getByLabel("aux-chart");
    await expect(aux).toBeVisible();

    await aux.getByRole("button", { name: "PSD", exact: true }).click();
    await expect(aux.getByRole("button", { name: "PSD", exact: true })).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(aux.locator(".chart-canvas")).toContainText(/PSD/i);

    await aux.getByRole("button", { name: "波形", exact: true }).click();
    await expect(aux.getByRole("button", { name: "波形", exact: true })).toHaveAttribute(
      "data-active",
      "true",
    );
    await expect(aux.locator(".chart-canvas")).toContainText(/WAVE/i);
  });
});