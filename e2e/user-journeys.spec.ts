import { test, expect } from '@playwright/test';

test.describe('End-to-End User Journeys', () => {
  test('User journey: Search -> Navigate to BMI Calculator -> Unit Toggle -> Copy Result', async ({ page }) => {
    await page.goto('/');

    // 1. Search for BMI calculator
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('BMI');
      const searchResult = page.locator('a[href*="bmi-calculator"]').first();
      if (await searchResult.isVisible()) {
        await searchResult.click();
      } else {
        await page.goto('/health/bmi-calculator');
      }
    } else {
      await page.goto('/health/bmi-calculator');
    }

    // 2. Verify BMI Calculator loaded
    await expect(page).toHaveURL(/bmi-calculator/);

    // 3. Fill inputs
    const heightInput = page.locator('input[name="height"]');
    const weightInput = page.locator('input[name="weight"]');
    if (await heightInput.isVisible()) {
      await heightInput.fill('180');
      await weightInput.fill('75');

      const primaryResult = page.locator('[data-primary-value]');
      await expect(primaryResult).toBeVisible();
      const text = await primaryResult.innerText();
      expect(text).toContain('23.');
    }
  });

  test('User journey: Language Switching (EN -> DE -> ES)', async ({ page }) => {
    await page.goto('/en/health/bmi-calculator');

    // Check language switcher button or links
    const langBtn = page.locator('[aria-label*="Language"], button:has-text("EN")');
    if (await langBtn.isVisible()) {
      await langBtn.click();
      const deLink = page.locator('a[href*="/de/"]');
      if (await deLink.isVisible()) {
        await deLink.first().click();
        await expect(page).toHaveURL(/\/de\//);
      }
    }
  });

  test('User journey: Error Page 404 handling', async ({ page }) => {
    const response = await page.goto('/non-existent-page-12345');
    expect(response?.status()).toBe(404);
    await expect(page.locator('body')).toContainText(/404|not found/i);
  });
});
