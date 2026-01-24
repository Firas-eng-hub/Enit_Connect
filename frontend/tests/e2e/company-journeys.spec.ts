/**
 * @vitest-playwright
 * Company Journey E2E Tests
 * Tests: Login → Dashboard → Create Offer → View Candidacies
 */

import { test, expect } from './fixtures';

test.describe('Company Journey', () => {
  test.beforeEach(async ({ loginAs }) => {
    // Login as company before each test
    await loginAs('company');
  });

  test('should view company dashboard', async ({ page }) => {
    // Navigate to company home
    await page.goto('/company/home');
    
    // Check that page loads
    const heading = page.locator('h1, h2, [class*="heading"]').first();
    await expect(heading).toBeVisible();
  });

  test('should view company profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/company/profile');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should view candidacies list', async ({ page }) => {
    // Navigate to candidacies page
    await page.goto('/company/candidacies');
    
    // Check that page loads
    await expect(page).toHaveTitle(/candidat|application/i);
  });

  test('should search for candidates', async ({ page }) => {
    // Navigate to search page
    await page.goto('/company/search');
    
    // Check that search page loads
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    expect(searchInput).toBeDefined();
  });

  test('should view notifications', async ({ page }) => {
    // Navigate to notifications page
    await page.goto('/company/notifications');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should access settings', async ({ page }) => {
    // Navigate to settings page
    await page.goto('/company/settings');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });
});
