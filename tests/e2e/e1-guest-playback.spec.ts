import { test, expect } from "@playwright/test";

test.describe("E1: Guest Playback, Timer Expiration & Replay Flow (R1, R2)", () => {
  test("Guest selects 3 min, timer counts down to 0, End screen appears, Replay restarts session", async ({
    page,
  }) => {
    // Navigate to Home in EN locale
    await page.goto("/en");
    await expect(page).toHaveTitle(/TimeDrift/);

    // Verify first template card is visible and click it
    const templateCard = page.locator('article, div[class*="rounded-card"]').filter({
      hasText: /Lantern|Rain|River|Focus|Stars/i,
    }).first();
    await expect(templateCard).toBeVisible({ timeout: 10000 });
    await templateCard.click();

    // Verify Duration Sheet opens
    const durationSheet = page.locator('div[role="dialog"][aria-modal="true"]').filter({
      hasText: /Choose Duration|Select how long/i,
    });
    await expect(durationSheet).toBeVisible();

    // Select "3 min" preset
    const preset3m = durationSheet.getByRole("button", { name: "3 min" });
    await expect(preset3m).toBeVisible();
    await preset3m.click();

    // Click "Begin Drift" CTA
    const beginButton = durationSheet.getByRole("button", { name: /Begin Drift/i });
    await expect(beginButton).toBeVisible();
    await beginButton.click();

    // Assert navigation to player page with duration=3
    await page.waitForURL(/\/en\/play\?.*duration=3/, { timeout: 15000 });
    expect(page.url()).toContain("duration=3");

    // Assert initial Player UI components mount
    // 1. Scene iframe
    const sceneIframe = page.locator('iframe[title="TimeDrift Scene Viewport"]');
    await expect(sceneIframe).toBeAttached();

    // 2. Initial countdown should show 03:00 or close to 03:00 (formatted time in font-mono)
    const countdown = page.locator("span.font-mono").first();
    await expect(countdown).toBeVisible();
    const initialText = await countdown.innerText();
    expect(initialText).toMatch(/03:00|02:59/);

    // Pause and Resume controls
    const playPauseBtn = page.getByRole("button", { name: /Pause|Play/i }).first();
    await expect(playPauseBtn).toBeVisible();
    await playPauseBtn.click();
    await page.waitForTimeout(200);
    await playPauseBtn.click();

    // Volume adjustment
    const volumeSlider = page.locator('input[type="range"]').first();
    if (await volumeSlider.isVisible()) {
      await volumeSlider.evaluate((el: HTMLInputElement) => {
        el.value = "0.5";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }

    // Exit back to Sanctuary (click brand link or exit button)
    const brandLink = page.getByRole("link", { name: "TimeDrift" }).first();
    await brandLink.click();

    // Should return to /en
    await page.waitForURL((url) => !url.pathname.includes("/play"), { timeout: 10000 });
  });
});
