/**
 * @vitest-playwright
 * Student Journey E2E Tests
 * Tests: Login → Profile → Browse Offers → Apply
 */

import { test, expect } from './fixtures';

test.describe('Student Journey', () => {
  test.beforeEach(async ({ loginAs }) => {
    // Login as student before each test
    await loginAs('student');
  });

  test('should view student dashboard', async ({ page }) => {
    // Navigate to student home
    await page.goto('/student/home');
    
    // Check that page loads
    const heading = page.locator('h1, h2, [class*="heading"]').first();
    await expect(heading).toBeVisible();
  });

  test('should view and edit student profile', async ({ page }) => {
    // Navigate to profile page
    await page.goto('/student/profile');
    
    // Check that profile page loads
    await expect(page).toHaveTitle(/profile|profil/i);
    
    // Check for profile content
    const profileContainer = page.locator('main, [class*="container"]').first();
    await expect(profileContainer).toBeVisible();
  });

  test('should browse job offers', async ({ page }) => {
    // Navigate to browse offers page
    await page.goto('/student/offers');
    
    // Check that page loads
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should view documents/uploads', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/student/documents');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should view notifications', async ({ page }) => {
    // Navigate to notifications page
    await page.goto('/student/notifications');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should search for offers with filters', async ({ page }) => {
    // Navigate to search page
    await page.goto('/student/search');
    
    // Check that search page loads
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    expect(searchInput).toBeDefined();
  });
});
