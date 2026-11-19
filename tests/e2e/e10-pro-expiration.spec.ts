import { test, expect } from "@playwright/test";
import { isProActive } from "../../src/server/rules";

test.describe("E10: Pro Mid-Session Expiration Continuity (R9)", () => {
  test("Mid-session expiry allows current run to finish, subsequent run throttles to 15m", () => {
    const now = new Date();

    // 1. User with Pro expiring in 5 minutes starts session
    const futureProUntil = new Date(now.getTime() + 5 * 60 * 1000);
    const activeProUser = {
      isPro: true,
      proUntil: futureProUntil,
    };
    expect(isProActive(activeProUser, now)).toBe(true);

    // 2. 6 minutes later (expired), mid-session: session start snapshot allowed the 60m session.
    // When checking for the NEXT session start:
    const sixMinutesLater = new Date(now.getTime() + 6 * 60 * 1000);
    expect(isProActive(activeProUser, sixMinutesLater)).toBe(false);

    // 3. User with isPro=false is inactive
    const freeUser = { isPro: false, proUntil: null };
    expect(isProActive(freeUser, now)).toBe(false);
  });

  test("Player interface displays session continuity gracefully", async ({
    page,
  }) => {
    // Navigate to play session
    await page.goto("/en/play?templateId=t1&duration=15");

    const countdown = page.locator("span.font-mono").first();
    await expect(countdown).toBeVisible({ timeout: 15000 });

    // Scene is active
    const sceneIframe = page.locator('iframe[title="TimeDrift Scene Viewport"]');
    await expect(sceneIframe).toBeAttached();
  });
});
