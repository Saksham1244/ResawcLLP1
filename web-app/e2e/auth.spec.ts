import { test, expect } from '@playwright/test';

test.describe('Authentication & Access Control', () => {
  test('should display login page with Resawc branding', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Resawc/i);
    await expect(page.locator('text=Resawc CRM').first()).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should show error message on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wronguser@resawc.com');
    await page.fill('input[type="password"]', 'WrongPassword123');
    await page.click('button:has-text("Sign In")');

    await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
  });

  test('should open and close Forgot Password modal', async ({ page }) => {
    await page.goto('/login');
    const forgotBtn = page.locator('button:has-text("Forgot password?")');
    await expect(forgotBtn).toBeVisible();
    await forgotBtn.click();

    await expect(page.locator('h2:has-text("Reset Password")')).toBeVisible();
    await expect(page.locator('text=Registered Email Address')).toBeVisible();

    await page.click('button:has-text("Cancel")');
    await expect(page.locator('h2:has-text("Reset Password")')).not.toBeVisible();
  });

  test('should successfully log in with valid credentials and redirect to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'mukul@resawc.com');
    await page.fill('input[type="password"]', 'Admin@1234');
    await page.click('button:has-text("Sign In")');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
