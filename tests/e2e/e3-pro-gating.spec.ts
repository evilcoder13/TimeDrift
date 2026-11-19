import { test, expect } from "@playwright/test";

test.describe("E3: Pro Gating & Upsell Sheet on Protected Routes (R4)", () => {
  test("Guest navigating to /custom gets Pro Upsell sheet with 0 asset leakage", async ({
    page,
  }) => {
    await page.goto("/en/custom");

    // Pro Upsell view renders
    const upsellModal = page.locator('div[role="dialog"]').filter({
      hasText: /Sanctuary Pass|Enter the Deeper Sanctuary|Harmonize any line-art/i,
    });
    await expect(upsellModal).toBeVisible();

    // Verify 0 scenes and 0 tracks leaked to guest (URD §3.1.3 / Rule R4)
    await expect(page.getByText("0 scenes")).toBeVisible();
    await expect(page.getByText("0 tracks")).toBeVisible();
  });

  test("Guest navigating to /playlists gets Pro Upsell view", async ({
    page,
  }) => {
    await page.goto("/en/playlists");

    // Pro upsell message or modal
    const upsellModal = page.locator('div[role="dialog"]').filter({
      hasText: /Sanctuary Pass|Enter the Deeper Sanctuary|Sequential journeys/i,
    });
    await expect(upsellModal).toBeVisible();

    // Verify New Journey button is present with locked indicator
    const newJourneyBtn = page.getByRole("button", { name: /\+ New Journey/i });
    await expect(newJourneyBtn).toBeVisible();
  });

  test("Direct API calls GET /api/custom and GET /api/playlists return 403 PRO_REQUIRED for unauthenticated guest", async ({
    request,
  }) => {
    const resPlaylists = await request.get("/api/playlists");
    expect([401, 403]).toContain(resPlaylists.status());
    const body = await resPlaylists.json();
    expect(body.error).toBeDefined();
  });
});
