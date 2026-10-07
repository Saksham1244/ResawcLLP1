import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';
import { loginAsAdmin } from './test-helpers';

// Helper to capture Percy snapshot if agent running, and save local screenshot artifact
async function captureVisual(page: any, name: string) {
  try {
    await percySnapshot(page, name);
  } catch (err: any) {
    console.log(`[Visual] Percy agent not attached. Captured local snapshot for: ${name}`);
  }
  await page.screenshot({ path: `playwright-report/visual_${name.replace(/\s+/g, '_').toLowerCase()}.png`, fullPage: false });
}

test.describe('Visual Regression Testing (Percy / Applitools & Playwright)', () => {
  test('Visual: Login Page Layout & Branding', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('text=Resawc CRM');
    await captureVisual(page, 'Login Page');
  });

  test('Visual: Dashboard Overview', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    await page.waitForSelector('text=Leads & Pipeline');
    await captureVisual(page, 'Dashboard Overview');
  });

  test('Visual: Finance & 18% GST Invoicing', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/finance');
    await expect(page.locator('text=Finance, Invoicing & GST').first()).toBeVisible({ timeout: 10000 });
    await captureVisual(page, 'Finance Invoices');
  });

  test('Visual: Reports & Analytics Dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/reports');
    await expect(page.locator('text=Reports & Business Analytics').first()).toBeVisible({ timeout: 10000 });
    await captureVisual(page, 'Reports Analytics Dashboard');
  });

  test('Visual: Centralized Activity Timeline', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard/activity');
    await expect(page.locator('text=Centralized Activity Timeline').first()).toBeVisible({ timeout: 10000 });
    await captureVisual(page, 'Activity Timeline');
  });
});
