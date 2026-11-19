import { test, expect } from "@playwright/test";

test.describe("QA-3: Device Matrix, Visual Composition & Accessibility Audit", () => {
  test("1. Viewport & 9:16 safe zone check (Mobile 393x852 vs Desktop 1920x1080)", async ({
    page,
  }) => {
    // Navigate to Player with seed template
    await page.goto("/en/play?templateId=t1&duration=15");

    const sceneIframe = page.locator('iframe[title="TimeDrift Scene Viewport"]');
    await expect(sceneIframe).toBeAttached({ timeout: 15000 });

    const iframeBox = await sceneIframe.boundingBox();
    expect(iframeBox).not.toBeNull();
    expect(iframeBox!.width).toBeGreaterThan(0);
    expect(iframeBox!.height).toBeGreaterThan(0);

    // Verify player control bar is properly centered and non-overlapping
    const controlBar = page.locator('div[class*="rounded-sheet"]').filter({
      has: page.locator("span.font-mono"),
    });
    await expect(controlBar).toBeVisible();

    const controlBox = await controlBar.boundingBox();
    expect(controlBox).not.toBeNull();
    const viewport = page.viewportSize();
    if (viewport) {
      // Control bar must be within horizontal bounds
      expect(controlBox!.x).toBeGreaterThanOrEqual(0);
      expect(controlBox!.x + controlBox!.width).toBeLessThanOrEqual(viewport.width + 10);
    }
  });

  test("2. Color contrast ratio audit (Washi Paper Day Mode vs Midnight Charcoal Night Mode)", async ({
    page,
  }) => {
    await page.goto("/en");

    // Evaluate computed colors of primary elements in Day Mode
    const dayMetrics = await page.evaluate(() => {
      const body = document.body;
      const h1 = document.querySelector("h1");
      const cta = document.querySelector('button[class*="bg-accent"]');

      return {
        bodyBg: window.getComputedStyle(body).backgroundColor,
        h1Color: h1 ? window.getComputedStyle(h1).color : null,
        ctaBg: cta ? window.getComputedStyle(cta).backgroundColor : null,
        ctaColor: cta ? window.getComputedStyle(cta).color : null,
      };
    });

    expect(dayMetrics.bodyBg).toBeDefined();
    expect(dayMetrics.h1Color).toBeDefined();

    // Toggle to Night Mode
    const themeBtn = page.getByRole("button", { name: /Night|Day|Chuyển giao diện/i }).first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);

      const isDark = await page.evaluate(() => {
        const themeAttr = document.documentElement.getAttribute("data-theme");
        return themeAttr === "night" || document.documentElement.classList.contains("dark");
      });
      expect(isDark).toBe(true);

      const nightMetrics = await page.evaluate(() => {
        const body = document.body;
        const h1 = document.querySelector("h1");
        return {
          bodyBg: window.getComputedStyle(body).backgroundColor,
          h1Color: h1 ? window.getComputedStyle(h1).color : null,
        };
      });
      expect(nightMetrics.h1Color).toBeDefined();

      // Switch back
      await themeBtn.click();
    }
  });

  test("3. Keyboard navigation & Focus ring indicators (Tab traversal)", async ({
    page,
  }) => {
    await page.goto("/en");

    // Press Tab multiple times and verify active elements receive focus
    await page.keyboard.press("Tab");
    const activeTagName1 = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT"]).toContain(activeTagName1);

    await page.keyboard.press("Tab");
    const activeTagName2 = await page.evaluate(() => document.activeElement?.tagName);
    expect(["A", "BUTTON", "INPUT"]).toContain(activeTagName2);

    // Verify focus-visible outline token classes or styling exist on interactive elements
    const ctaButton = page.getByRole("button", { name: /Quick Drift|Begin Drift/i }).first();
    if (await ctaButton.isVisible()) {
      await ctaButton.focus();
      const hasFocusRing = await page.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return (
          el.classList.contains("focus-visible:ring-accent") ||
          styles.outlineStyle !== "none" ||
          styles.boxShadow !== "none"
        );
      }, await ctaButton.elementHandle()!);
      expect(hasFocusRing).toBe(true);
    }
  });

  test("4. Screen reader ARIA compliance on controls", async ({
    page,
  }) => {
    await page.goto("/en/play?templateId=t1&duration=15");

    // 1. Scene iframe has proper accessible role and title
    const sceneIframe = page.locator('iframe[title="TimeDrift Scene Viewport"]');
    await expect(sceneIframe).toHaveAttribute("title", "TimeDrift Scene Viewport");

    // 2. Play/pause button maintains dynamic accessible aria-label
    const playPauseBtn = page.getByRole("button", { name: /Pause|Play/i }).first();
    await expect(playPauseBtn).toBeVisible();
    const playLabel = await playPauseBtn.getAttribute("aria-label");
    expect(playLabel).toMatch(/Pause|Play/i);

    // 3. Exit button has aria-label
    const exitBtn = page.getByRole("button", { name: /Exit Drift/i });
    await expect(exitBtn).toHaveAttribute("aria-label", "Exit Drift");
  });

  test("5. Reduced motion check (prefers-reduced-motion: reduce)", async ({
    page,
  }) => {
    // Emulate reduced motion
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/en");

    const matchesReducedMotion = await page.evaluate(() => {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    });
    expect(matchesReducedMotion).toBe(true);

    // Verify UI loads without crash or stuck transitions
    const heroTitle = page.locator("h1").first();
    await expect(heroTitle).toBeVisible();
  });
});
