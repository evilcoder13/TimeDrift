import { test, expect } from "@playwright/test";

test.describe("E2: Guest Duration Limits & 403 on >15m (R1, R3, R4)", () => {
  test("Guest Duration Sheet locks presets > 15m and shows Pro upsell sheet", async ({
    page,
  }) => {
    await page.goto("/en");

    // Open Duration Sheet by clicking any template
    const templateCard = page.locator('article, div[class*="rounded-card"]').filter({
      hasText: /Lantern|Rain|River|Focus|Stars/i,
    }).first();
    await templateCard.click();

    const durationSheet = page.locator('div[role="dialog"][aria-modal="true"]').filter({
      hasText: /Choose Duration|Select how long/i,
    });
    await expect(durationSheet).toBeVisible();

    // Presets 3, 5, 10, 15 must be available
    for (const min of ["3 min", "5 min", "10 min", "15 min"]) {
      await expect(durationSheet.getByRole("button", { name: min, exact: true })).toBeVisible();
    }

    // Preset 30m is locked with lock emoji 🔒 or Pro title
    const lockedPreset = durationSheet.locator("button").filter({ hasText: /30m|30 min/i }).first();
    await expect(lockedPreset).toBeVisible();
    
    // Click 30m locked preset -> Pro Upsell modal surfaces
    await lockedPreset.click();

    const upsellModal = page.locator('div[role="dialog"]').filter({
      hasText: /Sanctuary Pass|Deepen Your Drift/i,
    });
    await expect(upsellModal).toBeVisible();

    // Close upsell modal via "Maybe later" or close button
    const closeBtn = upsellModal.getByRole("button", { name: /Maybe later|Close/i }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press("Escape");
    }
  });

  test("Direct API POST /api/sessions with minutes=30 rejected with 403 PRO_REQUIRED", async ({
    request,
  }) => {
    const res = await request.post("/api/sessions", {
      data: {
        entityId: "t1",
        type: "TEMPLATE",
        minutes: 30,
      },
    });

    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error).toBeDefined();
    expect(body.error.code).toBe("PRO_REQUIRED");
  });
});
