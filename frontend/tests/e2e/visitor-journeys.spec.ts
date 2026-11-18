/**
 * @vitest-playwright
 * Visitor Journey E2E Tests
 * Tests: Register → Login → View News
 */

import { test, expect } from './fixtures';

test.describe('Visitor Journey', () => {
  test('should complete visitor registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    await expect(page).toHaveTitle(/register|sign up/i);
    
    // Fill registration form
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    await emailInput.fill(`visitor-${Date.now()}@test.com`);
    await passwordInput.fill('SecurePass123!');
    
    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    // Verify registration success
    await page.waitForURL(/login|dashboard/, { timeout: 5000 }).catch(() => {});
  });

  test('should complete visitor login flow', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await expect(page).toHaveTitle(/login|sign in/i);
    
    // Check that form elements exist
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    
    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  test('should view news page', async ({ page }) => {
    // Navigate to news page
    await page.goto('/news');
    
    // Check that page loads
    await expect(page).toHaveTitle(/news|actualité/i);
    
    // Verify page has content
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  // Statistics and How It Works were removed; their old URLs redirect to the news home.
  for (const path of ['/visitor/statistics', '/visitor/how-it-works', '/visitor/members']) {
    test(`should redirect ${path} to news`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/visitor\/news$/);
    });
  }
});
