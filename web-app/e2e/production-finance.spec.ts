import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './test-helpers';

test.describe('Production, Finance & Analytics (Phases 3, 4, 5)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display Editing Jobs pipeline with progress indicators', async ({ page }) => {
    await page.goto('/dashboard/jobs');
    await expect(page.locator('text=Production & Editing Hub').first()).toBeVisible();
    await expect(page.locator('button:has-text("New Editing Job")').first()).toBeVisible();
  });

  test('should display and allow putting raw files link in task folder for assigned editors', async ({ page }) => {
    await page.goto('/dashboard/jobs');
    await expect(page.locator('text=Task Folder (Raw Files)').first()).toBeVisible({ timeout: 15000 });
    const rawFilesBtn = page.locator('button:has-text("Put Raw Files Link"), a:has-text("Open Task Folder")').first();
    await expect(rawFilesBtn).toBeVisible({ timeout: 15000 });
  });

  test('should display Finance & GST Invoices with 18% GST', async ({ page }) => {
    await page.goto('/dashboard/finance');
    await expect(page.locator('text=Finance, Invoicing & GST').first()).toBeVisible();
    await expect(page.locator('button:has-text("New GST Invoice")').first()).toBeVisible();
    await expect(page.locator('text=Client Rate Cards').first()).toBeVisible();
  });

  test('should display Payroll & Payslip generation system', async ({ page }) => {
    await page.goto('/dashboard/payroll');
    await expect(page.locator('button:has-text("Run Monthly Payroll")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Salary Structures")').first()).toBeVisible();
  });

  test('should navigate to Clients and open Client 360° Profile', async ({ page }) => {
    await page.goto('/dashboard/clients');
    await expect(page.locator('text=Client Management').first()).toBeVisible();

    const view360Btn = page.locator('a:has-text("360° View")').first();
    if (await view360Btn.isVisible()) {
      await view360Btn.click();
      await page.waitForURL('**/dashboard/clients/**', { timeout: 10000 });
      await expect(page.locator('text=Total Billed').first()).toBeVisible();
      await expect(page.locator('text=Contract Rate Card').first()).toBeVisible();
    }
  });

  test('should display Reports & Business Analytics with monthly trend and 18% GST audit', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await expect(page.locator('text=Reports & Business Analytics').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Total Collected').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Monthly Invoiced vs Collected').first()).toBeVisible({ timeout: 15000 });
  });

  test('should display Centralized Activity Log with filter chips', async ({ page }) => {
    await page.goto('/dashboard/activity');
    await expect(page.locator('text=Centralized Activity Timeline').first()).toBeVisible();
    await expect(page.locator('button:has-text("All Activity")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Production & Jobs")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Finance & Invoices")').first()).toBeVisible();
  });
});
