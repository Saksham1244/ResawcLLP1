import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './test-helpers';

test.describe('Dashboard & Core Modules', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should render dashboard overview with quick access cards', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=Leads & Pipeline').first()).toBeVisible();
    await expect(page.locator('text=Team Tasks').first()).toBeVisible();
    await expect(page.locator('text=Attendance').first()).toBeVisible();
  });

  test('should navigate to Leads CRM and display tabs', async ({ page }) => {
    await page.goto('/dashboard/leads');
    await expect(page.locator('text=Leads & Pipeline').first()).toBeVisible();
    await expect(page.locator('text=All Leads').first()).toBeVisible();
    await expect(page.locator('text=New').first()).toBeVisible();
    await expect(page.locator('text=Converted').first()).toBeVisible();

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
  });

  test('should navigate to Tasks page and display task list', async ({ page }) => {
    await page.goto('/dashboard/tasks');
    await expect(page.locator('h1').filter({ hasText: 'Tasks' }).first()).toBeVisible();
    await expect(page.locator('button:has-text("Create Task")').first()).toBeVisible();
  });

  test('should navigate to Team Management page and display team members', async ({ page }) => {
    await page.goto('/dashboard/team');
    await expect(page.locator('text=Team & Members').first()).toBeVisible();
    await expect(page.locator('button:has-text("Add Member")').first()).toBeVisible();
  });

  test('should navigate to Attendance page', async ({ page }) => {
    await page.goto('/dashboard/attendance');
    await expect(page.locator('text=Attendance').first()).toBeVisible();
  });
});
