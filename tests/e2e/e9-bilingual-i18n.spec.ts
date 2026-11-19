import { test, expect } from "@playwright/test";

test.describe("E9: Bilingual Locale Switching & Cookie Persistence (next-intl)", () => {
  test("Switching between EN and VI updates copy immediately and persists across page reload", async ({
    page,
    context,
  }) => {
    // 1. Visit /en
    await page.goto("/en");
    await expect(page).toHaveTitle(/TimeDrift/);

    // Assert English copy
    const enHero = page.locator("h1").filter({ hasText: "Drift into stillness" });
    await expect(enHero).toBeVisible();

    const enQuickDrift = page.getByRole("button", { name: "Quick Drift (15 min)" });
    await expect(enQuickDrift).toBeVisible();

    // 2. Click language switcher to switch to VI
    const viBtn = page.getByRole("button", { name: /Chuyển sang Tiếng Việt|VI/i });
    await expect(viBtn).toBeVisible();
    await viBtn.click();

    // 3. Assert URL changed to /vi
    await page.waitForURL(/\/vi/, { timeout: 10000 });

    // 4. Assert Vietnamese copy
    const viHero = page.locator("h1").filter({ hasText: "Trôi vào tĩnh lặng" });
    await expect(viHero).toBeVisible();

    const viQuickDrift = page.getByRole("button", { name: /Bắt đầu nhanh \(15p\)/i });
    await expect(viQuickDrift).toBeVisible();

    // 5. Verify cookie NEXT_LOCALE=vi was set
    const cookies = await context.cookies();
    const localeCookie = cookies.find((c) => c.name === "NEXT_LOCALE");
    expect(localeCookie?.value).toBe("vi");

    // 6. Reload page and assert Vietnamese copy persists
    await page.reload();
    await expect(viHero).toBeVisible();
    expect(page.url()).toContain("/vi");

    // 7. Switch back to EN
    const enBtn = page.getByRole("button", { name: /Switch to English|EN/i });
    await expect(enBtn).toBeVisible();
    await enBtn.click();

    await page.waitForURL(/\/en/, { timeout: 10000 });
    await expect(enHero).toBeVisible();
  });
});
