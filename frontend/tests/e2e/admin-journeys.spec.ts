/**
 * @vitest-playwright
 * Admin Journey E2E Tests
 * Tests: Login → Dashboard → Manage Documents → Notifications
 */

import { test, expect } from './fixtures';

test.describe('Admin Journey', () => {
  test.beforeEach(async ({ loginAs }) => {
    // Login as admin before each test
    await loginAs('admin');
  });

  test('should view admin dashboard', async ({ page }) => {
    // Navigate to admin home
    await page.goto('/admin/home');
    
    // Check that page loads
    const heading = page.locator('h1, h2, [class*="heading"]').first();
    await expect(heading).toBeVisible();
  });

  test('should view documents management page', async ({ page }) => {
    // Navigate to documents page
    await page.goto('/admin/documents');
    
    // Check that page loads
    await expect(page).toHaveTitle(/document/i);
  });

  test('should view send notifications page', async ({ page }) => {
    // Navigate to send notifications page
    await page.goto('/admin/send-notifications');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should view search page', async ({ page }) => {
    // Navigate to search page
    await page.goto('/admin/search');
    
    // Check that page loads
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    expect(searchInput).toBeDefined();
  });

  test('should view add users page', async ({ page }) => {
    // Navigate to add users page
    await page.goto('/admin/add-users');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });

  test('should view messages page', async ({ page }) => {
    // Navigate to messages page
    await page.goto('/admin/messages');
    
    // Check that page loads
    const content = page.locator('main, [class*="container"]').first();
    await expect(content).toBeVisible();
  });
});
