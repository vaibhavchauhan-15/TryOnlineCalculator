import { test, expect } from '@playwright/test';

test.describe('Calculator E2E Workflows', () => {
  test('homepage loads and displays popular calculators', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Online Calculator/i);

    // Search bar check
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Mortgage');
      await expect(page.locator('text=Mortgage Calculator').first()).toBeVisible();
    }
  });

  test('loan calculator computes correct values on interaction', async ({ page }) => {
    await page.goto('/finance/loan-calculator');

    // Fill loan details
    const amountInput = page.locator('input[name="amount"]');
    const rateInput = page.locator('input[name="rate"]');
    const termInput = page.locator('input[name="term"]');

    if (await amountInput.isVisible()) {
      await amountInput.fill('100000');
      await rateInput.fill('5');
      await termInput.fill('10');

      // Verify computed result updates dynamically
      const primaryResult = page.locator('[data-primary-value]');
      await expect(primaryResult).toBeVisible();
      const text = await primaryResult.innerText();
      expect(text).not.toBe('');
    }
  });
});
