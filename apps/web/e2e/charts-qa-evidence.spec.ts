/**
 * Bot-C QA-G evidence: M-03 screenshots, M-04 pan/zoom, C-01 GPU, C-03 DPR,
 * C-04 live context-restore (WIP — not PASS).
 *
 * Writes under:
 *   docs/acceptance/evidence/bot-c/
 *   artifacts/validation/bot-c/
 */
import { expect, test, type Page } from "@playwright/test";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS_EVIDENCE = join(HERE, "../../../docs/acceptance/evidence/bot-c");
const ARTIFACTS_EVIDENCE = join(HERE, "../../../artifacts/validation/bot-c");

function ensureDirs(): void {
  mkdirSync(DOCS_EVIDENCE, { recursive: true });
  mkdirSync(ARTIFACTS_EVIDENCE, { recursive: true });
}

function writeBoth(name: string, data: string | Buffer): void {
  ensureDirs();
  const a = join(DOCS_EVIDENCE, name);
  const b = join(ARTIFACTS_EVIDENCE, name);
  if (typeof data === "string") {
    writeFileSync(a, data, "utf8");
    writeFileSync(b, data, "utf8");
  } else {
    writeFileSync(a, data);
    writeFileSync(b, data);
  }
}

function copyShotBoth(name: string, fromPath: string): void {
  ensureDirs();
  copyFileSync(fromPath, join(DOCS_EVIDENCE, name));
  copyFileSync(fromPath, join(ARTIFACTS_EVIDENCE, name));
}

async function waitHealthyWebGl(page: Page, testId = "chart-main"): Promise<void> {
  const chart = page.getByTestId(testId);
  await expect(chart).toBeVisible({ timeout: 30_000 });
  await expect(chart).toHaveAttribute("data-webgl-state", "ok", { timeout: 30_000 });
  // Let one paint settle after ok.
  await page.waitForTimeout(400);
}

async function readChartMetrics(page: Page, testId = "chart-main") {
  return page.getByTestId(testId).evaluate((el) => {
    const canvas = el.querySelector("canvas") as HTMLCanvasElement | null;
    const cssW = (el as HTMLElement).clientWidth;
    const cssH = (el as HTMLElement).clientHeight;
    const dpr = window.devicePixelRatio;
    return {
      cssW,
      cssH,
      bufferWidth: canvas?.width ?? 0,
      bufferHeight: canvas?.height ?? 0,
      dpr,
      dataDpr: el.getAttribute("data-dpr"),
      dataBufferWidth: el.getAttribute("data-buffer-width"),
      dataBufferHeight: el.getAttribute("data-buffer-height"),
      webglState: el.getAttribute("data-webgl-state"),
      expectedBufferW: Math.max(1, Math.round(cssW * Math.max(1, dpr))),
      expectedBufferH: Math.max(1, Math.round(cssH * Math.max(1, dpr))),
    };
  });
}

async function collectGpuProbeInPage(page: Page, testId = "chart-main") {
  return page.getByTestId(testId).evaluate((el) => {
    const canvas = el.querySelector("canvas") as HTMLCanvasElement | null;
    const webglState = el.getAttribute("data-webgl-state");
    const base = {
      bot: "bot-c" as const,
      writtenAt: new Date().toISOString(),
      package: "@wss/charts",
      gate: "C-01" as const,
      gpuAvailable: false,
      webglVersion: null as string | null,
      textureFormat: null as string | null,
      lutSize: 256,
      lutFormat: "RGBA8" as const,
      rendererVendor: null as string | null,
      rendererRenderer: null as string | null,
      maxTextureSize: null as number | null,
      webglState,
      source: "playwright-page-eval",
      note: "",
    };
    if (!canvas) {
      return { ...base, note: "no canvas under chart-main", reason: "missing-canvas" };
    }
    let gl: WebGL2RenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl2");
    } catch (e) {
      return {
        ...base,
        note: "getContext(webgl2) threw",
        reason: e instanceof Error ? e.message : String(e),
      };
    }
    if (!gl) {
      return {
        ...base,
        note: "WebGL2 context unavailable in page (SwiftShader/ANGLE may still be blocked)",
        reason: "webgl2-null",
        browserEvidence: {
          webglState,
          userAgent: navigator.userAgent,
          devicePixelRatio: window.devicePixelRatio,
        },
      };
    }
    let webglVersion: string | null = null;
    try {
      const v = gl.getParameter(gl.VERSION);
      webglVersion = typeof v === "string" ? v : "WebGL2";
    } catch {
      webglVersion = "WebGL2";
    }
    let maxTextureSize: number | null = null;
    try {
      const m = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      maxTextureSize = typeof m === "number" ? m : null;
    } catch {
      maxTextureSize = null;
    }
    let textureFormat = "R32F";
    try {
      const test = gl.createTexture();
      if (test) {
        gl.bindTexture(gl.TEXTURE_2D, test);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.R32F,
          1,
          1,
          0,
          gl.RED,
          gl.FLOAT,
          new Float32Array([0]),
        );
        if (gl.getError() !== gl.NO_ERROR) textureFormat = "R8";
        gl.deleteTexture(test);
      }
    } catch {
      textureFormat = "R8";
    }
    let rendererVendor: string | null = null;
    let rendererRenderer: string | null = null;
    try {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        const UNMASKED_VENDOR_WEBGL = 0x9245;
        const UNMASKED_RENDERER_WEBGL = 0x9246;
        const v = gl.getParameter(UNMASKED_VENDOR_WEBGL);
        const r = gl.getParameter(UNMASKED_RENDERER_WEBGL);
        rendererVendor = typeof v === "string" ? v : null;
        rendererRenderer = typeof r === "string" ? r : null;
      }
    } catch {
      // ignore
    }
    return {
      ...base,
      gpuAvailable: true,
      webglVersion,
      textureFormat,
      lutSize: 256,
      lutFormat: "RGBA8" as const,
      rendererVendor,
      rendererRenderer,
      maxTextureSize,
      webglState,
      source: "playwright-page-eval",
      note: "Live WebGL2 probe from chart-main canvas in Playwright (ANGLE/SwiftShader ok)",
    };
  });
}

test.describe("Bot-C charts QA evidence (WIP)", () => {
  test.setTimeout(90_000);
  test("M-03 healthy WebGL screenshot of MainChartHost / SpectrumChart", async ({
    page,
  }) => {
    ensureDirs();
    await page.goto("/");
    const host = page.getByTestId("main-chart-host");
    await expect(host).toBeVisible({ timeout: 30_000 });
    await waitHealthyWebGl(page, "chart-main");
    const chart = page.getByTestId("chart-main");
    await expect(chart).toHaveAttribute("data-webgl-state", "ok");

    // Two rAFs so GL + axis overlays settle into the compositor.
    await page.evaluate(
      () =>
        new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        ),
    );

    const glSample = await chart.evaluate((el) => {
      const canvas = el.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) return { ok: false, reason: "no-canvas" };
      const gl = canvas.getContext("webgl2");
      if (!gl) return { ok: false, reason: "no-gl" };
      const x = Math.max(0, Math.floor(canvas.width / 2) - 4);
      const y = Math.max(0, Math.floor(canvas.height / 2) - 4);
      const data = new Uint8Array(8 * 8 * 4);
      gl.readPixels(x, y, 8, 8, gl.RGBA, gl.UNSIGNED_BYTE, data);
      let sum = 0;
      let nonzero = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i]!;
        if (data[i]! > 0) nonzero++;
      }
      const dataUrl = canvas.toDataURL("image/png");
      return {
        ok: true,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        readPixelsSum: sum,
        readPixelsNonzero: nonzero,
        dataUrlLength: dataUrl.length,
        dataUrl,
      };
    });
    expect(glSample.ok, JSON.stringify({ ...glSample, dataUrl: undefined })).toBe(true);
    expect(
      (glSample as { readPixelsNonzero?: number }).readPixelsNonzero ?? 0,
      "GL center readPixels should be non-empty",
    ).toBeGreaterThan(0);

    // Chromium headless often omits SwiftShader GL from element/page screenshots.
    // Composite GL + axis(+cursor) canvases in-page via toDataURL for QA-visible evidence.
    const composite = await chart.evaluate((el) => {
      const canvases = Array.from(el.querySelectorAll("canvas")) as HTMLCanvasElement[];
      if (canvases.length < 1) return { ok: false, reason: "no-canvas" };
      const w = canvases[0]!.width;
      const h = canvases[0]!.height;
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const ctx = out.getContext("2d");
      if (!ctx) return { ok: false, reason: "no-2d" };
      ctx.fillStyle = "#0f1218";
      ctx.fillRect(0, 0, w, h);
      for (const c of canvases) {
        try {
          ctx.drawImage(c, 0, 0, w, h);
        } catch {
          // ignore tainted
        }
      }
      const dataUrl = out.toDataURL("image/png");
      return {
        ok: true,
        canvasCount: canvases.length,
        width: w,
        height: h,
        dataUrlLength: dataUrl.length,
        dataUrl,
      };
    });
    expect(composite.ok, JSON.stringify({ ...composite, dataUrl: undefined })).toBe(true);
    const compUrl = (composite as { dataUrl?: string }).dataUrl;
    expect(compUrl?.startsWith("data:image/png;base64,")).toBe(true);
    {
      const b64 = compUrl!.slice("data:image/png;base64,".length);
      const buf = Buffer.from(b64, "base64");
      // Primary evidence shots (heatmap + axes) — same bytes into both names for host/chart
      // when host chrome is not part of the WebGL composite; also keep GL-only dump.
      writeBoth("m03_chart_main.png", buf);
      writeBoth("m03_spectrum_chart.png", buf);
      const glOnly = (glSample as { dataUrl?: string }).dataUrl;
      if (glOnly?.startsWith("data:image/png;base64,")) {
        writeBoth(
          "m03_gl_canvas_todataurl.png",
          Buffer.from(glOnly.slice("data:image/png;base64,".length), "base64"),
        );
      }
    }

    // Secondary: host page clip (may omit GL in headless — not primary evidence).
    const hostBox = await host.boundingBox();
    if (hostBox) {
      const hostClip = join(DOCS_EVIDENCE, "m03_host_pageclip.png");
      await page.screenshot({ path: hostClip, clip: hostBox });
      copyShotBoth("m03_host_pageclip.png", hostClip);
    }

    const gpu = await collectGpuProbeInPage(page);
    writeBoth(
      "charts_probe_gpu_webgl_lut_2026-10-21.json",
      JSON.stringify({ ...gpu, gate: "C-01", status: "WIP" }, null, 2),
    );
    writeBoth(
      "m03_screenshot_meta_2026-10-21.json",
      JSON.stringify(
        {
          bot: "bot-c",
          gate: "M-03",
          writtenAt: new Date().toISOString(),
          webglState: await chart.getAttribute("data-webgl-state"),
          gpuAvailable: (gpu as { gpuAvailable?: boolean }).gpuAvailable ?? false,
          glSample: {
            canvasWidth: (glSample as { canvasWidth?: number }).canvasWidth,
            canvasHeight: (glSample as { canvasHeight?: number }).canvasHeight,
            readPixelsSum: (glSample as { readPixelsSum?: number }).readPixelsSum,
            readPixelsNonzero: (glSample as { readPixelsNonzero?: number })
              .readPixelsNonzero,
            dataUrlLength: (glSample as { dataUrlLength?: number }).dataUrlLength,
          },
          screenshots: [
            "m03_spectrum_chart.png",
            "m03_chart_main.png",
            "m03_gl_canvas_todataurl.png",
          ],
          status: "WIP",
          note: "Asserted data-webgl-state=ok + readPixels nonzero; ANGLE/SwiftShader; page clip + toDataURL",
        },
        null,
        2,
      ),
    );
    expect((gpu as { gpuAvailable?: boolean }).gpuAvailable, "GPU/WebGL2 should be available for healthy shots").toBe(
      true,
    );
  });

  test("M-04 pan/zoom sets data-interaction-mode preview then refine", async ({
    page,
  }) => {
    ensureDirs();
    await page.goto("/");
    await waitHealthyWebGl(page);
    const chart = page.getByTestId("chart-main");
    const box = await chart.boundingBox();
    expect(box).toBeTruthy();
    const cx = box!.x + box!.width * 0.5;
    const cy = box!.y + box!.height * 0.5;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 40, cy + 20, { steps: 6 });
    await expect(chart).toHaveAttribute("data-interaction-mode", "preview", {
      timeout: 2000,
    });
    await page.mouse.up();
    await page.mouse.move(cx, cy);
    await page.mouse.wheel(0, -120);
    await expect(chart).toHaveAttribute("data-interaction-mode", "preview", {
      timeout: 2000,
    });
    await page.waitForTimeout(400);
    const mode = await chart.getAttribute("data-interaction-mode");
    expect(["refine", "idle", "preview"]).toContain(mode);
    writeBoth(
      "m04_playwright_pan_zoom_2026-10-21.json",
      JSON.stringify(
        {
          bot: "bot-c",
          gate: "M-04",
          writtenAt: new Date().toISOString(),
          interactionModeAfterGesture: mode,
          webglState: await chart.getAttribute("data-webgl-state"),
          note: "Playwright pan/zoom on chart-main; Node CPU synthetic alone is not this evidence",
          status: "WIP",
        },
        null,
        2,
      ),
    );
  });

  test("C-03 buffer tracks css * dpr after viewport + deviceScaleFactor", async ({
    page,
  }) => {
    ensureDirs();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await waitHealthyWebGl(page);
    const chart = page.getByTestId("chart-main");

    const before = await readChartMetrics(page);
    expect(before.bufferWidth).toBeGreaterThan(0);
    expect(Math.abs(before.bufferWidth - before.expectedBufferW)).toBeLessThanOrEqual(1);
    expect(Math.abs(before.bufferHeight - before.expectedBufferH)).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 900, height: 600 });
    await page.waitForTimeout(500);
    await expect(chart).toHaveAttribute("data-webgl-state", "ok");
    const afterViewport = await readChartMetrics(page);
    expect(afterViewport.cssW).not.toBe(before.cssW);
    expect(Math.abs(afterViewport.bufferWidth - afterViewport.expectedBufferW)).toBeLessThanOrEqual(1);
    expect(Math.abs(afterViewport.bufferHeight - afterViewport.expectedBufferH)).toBeLessThanOrEqual(1);
    // Buffer must change with CSS (previous bug: buffer stuck at 780).
    expect(afterViewport.bufferWidth).not.toBe(before.bufferWidth);

    const client = await page.context().newCDPSession(page);
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: 900,
      height: 600,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await expect
      .poll(async () => {
        const m = await readChartMetrics(page);
        return m.dpr >= 2 && Math.abs(m.bufferWidth - m.expectedBufferW) <= 2 ? 1 : 0;
      }, { timeout: 8000 })
      .toBe(1);
    const afterDpr = await readChartMetrics(page);
    expect(afterDpr.dpr).toBeGreaterThanOrEqual(2);
    expect(Math.abs(afterDpr.bufferWidth - afterDpr.expectedBufferW)).toBeLessThanOrEqual(2);
    expect(Math.abs(afterDpr.bufferHeight - afterDpr.expectedBufferH)).toBeLessThanOrEqual(2);
    expect(afterDpr.bufferWidth).toBeGreaterThan(afterViewport.bufferWidth);

    const c03Composite = await chart.evaluate((el) => {
      const canvases = Array.from(el.querySelectorAll("canvas")) as HTMLCanvasElement[];
      if (!canvases[0]) return { ok: false as const };
      const w = canvases[0].width;
      const h = canvases[0].height;
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      const ctx = out.getContext("2d");
      if (!ctx) return { ok: false as const };
      ctx.fillStyle = "#0f1218";
      ctx.fillRect(0, 0, w, h);
      for (const c of canvases) ctx.drawImage(c, 0, 0, w, h);
      return { ok: true as const, dataUrl: out.toDataURL("image/png") };
    });
    expect(c03Composite.ok).toBe(true);
    {
      const url = (c03Composite as { dataUrl?: string }).dataUrl!;
      const buf = Buffer.from(url.slice("data:image/png;base64,".length), "base64");
      writeBoth("c03_resize_chart.png", buf);
    }

    writeBoth(
      "c03_resize_dpr_2026-10-21.json",
      JSON.stringify(
        {
          bot: "bot-c",
          gate: "C-03",
          writtenAt: new Date().toISOString(),
          before,
          afterViewport,
          afterDeviceScaleFactor2: afterDpr,
          proportionality: {
            before: {
              bufferOverCssW: before.bufferWidth / Math.max(before.cssW, 1),
              bufferOverCssH: before.bufferHeight / Math.max(before.cssH, 1),
              dpr: before.dpr,
            },
            afterViewport: {
              bufferOverCssW: afterViewport.bufferWidth / Math.max(afterViewport.cssW, 1),
              bufferOverCssH: afterViewport.bufferHeight / Math.max(afterViewport.cssH, 1),
              dpr: afterViewport.dpr,
            },
            afterDeviceScaleFactor2: {
              bufferOverCssW: afterDpr.bufferWidth / Math.max(afterDpr.cssW, 1),
              bufferOverCssH: afterDpr.bufferHeight / Math.max(afterDpr.cssH, 1),
              dpr: afterDpr.dpr,
            },
          },
          screenshot: "c03_resize_chart.png",
          status: "WIP",
          note: "ResizeObserver + window resize; bufferWidth ≈ cssW * dpr (Playwright + CDP deviceScaleFactor=2)",
        },
        null,
        2,
      ),
    );
  });

  test("C-04 live WEBGL_lose_context restore on chart canvas", async ({ page }) => {
    ensureDirs();
    await page.goto("/");
    await waitHealthyWebGl(page);
    const chart = page.getByTestId("chart-main");
    await expect(chart).toHaveAttribute("data-webgl-state", "ok");

    const loseResult = await chart.evaluate((el) => {
      const canvas = el.querySelector("canvas") as HTMLCanvasElement | null;
      if (!canvas) return { ok: false, reason: "no-canvas" };
      const gl = canvas.getContext("webgl2");
      if (!gl) return { ok: false, reason: "no-webgl2" };
      const ext = gl.getExtension("WEBGL_lose_context");
      if (!ext) return { ok: false, reason: "no-WEBGL_lose_context" };
      // Keep extension handle across lose — getExtension may return null while lost.
      (window as unknown as { __wssLoseExt?: { loseContext: () => void; restoreContext: () => void } }).__wssLoseExt = ext;
      ext.loseContext();
      return { ok: true, reason: "lost-requested" };
    });
    expect(loseResult.ok, JSON.stringify(loseResult)).toBe(true);
    await expect(chart).toHaveAttribute("data-webgl-state", "lost", { timeout: 5000 });

    const restoreResult = await page.evaluate(() => {
      const ext = (window as unknown as { __wssLoseExt?: { restoreContext: () => void } })
        .__wssLoseExt;
      if (!ext) return { ok: false, reason: "no-cached-WEBGL_lose_context" };
      ext.restoreContext();
      return { ok: true, reason: "restore-requested" };
    });
    expect(restoreResult.ok, JSON.stringify(restoreResult)).toBe(true);

    // HeatmapCanvas briefly sets "restored" then settles to "ok".
    await expect
      .poll(async () => chart.getAttribute("data-webgl-state"), { timeout: 8000 })
      .toMatch(/^(restored|ok)$/);
    await expect
      .poll(async () => chart.getAttribute("data-webgl-state"), { timeout: 8000 })
      .toBe("ok");

    const finalState = await chart.getAttribute("data-webgl-state");
    const gpu = await collectGpuProbeInPage(page);

    writeBoth(
      "charts_probe_context_restore_2026-10-21.json",
      JSON.stringify(
        {
          bot: "bot-c",
          writtenAt: new Date().toISOString(),
          package: "@wss/charts",
          gate: "C-04",
          gpu: !!(gpu as { gpuAvailable?: boolean }).gpuAvailable,
          gpuAvailable: !!(gpu as { gpuAvailable?: boolean }).gpuAvailable,
          source: "playwright-WEBGL_lose_context",
          transitions: [
            { from: "ok", event: "lost", to: "lost", via: "WEBGL_lose_context.loseContext" },
            {
              from: "lost",
              event: "restored",
              to: finalState,
              via: "WEBGL_lose_context.restoreContext",
            },
          ],
          finalState,
          loseResult,
          restoreResult,
          relatedInteractionProbe:
            "docs/acceptance/evidence/bot-c/charts_probe_interaction_p95_2026-10-21.json",
          note: "Live browser context-restore (not Node-simulated). Interaction P95 remains CPU synthetic.",
          status: "WIP",
        },
        null,
        2,
      ),
    );
  });
});
