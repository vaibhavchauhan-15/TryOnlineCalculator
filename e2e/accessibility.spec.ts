import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('WCAG 2.2 AA Accessibility Audits with axe-core', () => {
  const routes = [
    '/',
    '/finance',
    '/finance/loan-calculator',
    '/health/bmi-calculator',
    '/math/percentage-calculator',
    '/unit-converter',
    '/currency-converter',
    '/about',
    '/contact',
    '/privacy',
    '/terms',
  ];

  for (const route of routes) {
    test(`route "${route}" has zero WCAG 2.2 AA accessibility violations`, async ({ page }) => {
      await page.goto(route);
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }
});
