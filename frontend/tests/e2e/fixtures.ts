/**
 * E2E Test Fixtures and Helpers
 * Provides reusable test utilities for Playwright E2E tests
 */

import { test as base, expect, type Page } from '@playwright/test';

/**
 * Validate non-production base URL
 */
function validateNonProductionBaseUrl() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:4200';
  const productionUrls = [
    'https://enit-connect.com',
    'https://www.enit-connect.com',
    'https://api.enit-connect.com',
  ];

  if (productionUrls.some(url => baseUrl.includes(url))) {
    throw new Error(
      `E2E tests cannot run against production URL: ${baseUrl}. ` +
      `Use a test or development environment instead.`
    );
  }
}

validateNonProductionBaseUrl();

/**
 * Authentication helper functions
 */
type UserRole = 'student' | 'company' | 'admin';
type LoginCredentials = { email: string; password: string };

async function loginAs(
  page: Page,
  role: UserRole,
  credentials?: LoginCredentials
) {
  const defaultCredentials = {
    student: { email: 'student@example.com', password: 'password123' },
    company: { email: 'company@example.com', password: 'password123' },
    admin: { email: 'admin@example.com', password: 'password123' },
  };

  const creds = credentials || defaultCredentials[role];

  await page.goto('/login');
  await page.fill('input[name="email"]', creds.email);
  await page.fill('input[name="password"]', creds.password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL('**/*', { timeout: 5000 });
}

/**
 * Logout helper
 */
async function logout(page: Page) {
  // Look for logout button or similar
  const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL('**/login', { timeout: 5000 });
  }
}

/**
 * Custom test fixture with auth helpers
 */
export const test = base.extend<{
  loginAs: (role: UserRole, credentials?: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  expectVisible: (selector: string) => Promise<void>;
  expectHidden: (selector: string) => Promise<void>;
}>({
  loginAs: async ({ page }, fixture) => {
    await fixture((role, credentials) => loginAs(page, role, credentials));
  },
  logout: async ({ page }, fixture) => {
    await fixture(() => logout(page));
  },
  expectVisible: async ({ page }, fixture) => {
    await fixture(async (selector) => {
      const element = page.locator(selector);
      await expect(element).toBeVisible();
    });
  },
  expectHidden: async ({ page }, fixture) => {
    await fixture(async (selector) => {
      const element = page.locator(selector);
      await expect(element).toBeHidden();
    });
  },
});

export { expect };

/**
 * API helper for testing endpoints
 */
export class ApiHelper {
  private baseUrl: string;
  private page: Page;

  constructor(baseUrl: string, page: Page) {
    this.baseUrl = baseUrl;
    this.page = page;
  }

  async request(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    options: Record<string, unknown> = {}
  ) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestMethod = method.toLowerCase() as 'get' | 'post' | 'put' | 'delete';
    return this.page.request[requestMethod](url, options);
  }

  async get(endpoint: string, options: Record<string, unknown> = {}) {
    return this.request('GET', endpoint, options);
  }

  async post(
    endpoint: string,
    data: Record<string, unknown> = {},
    options: Record<string, unknown> = {}
  ) {
    return this.request('POST', endpoint, {
      data,
      ...options,
    });
  }

  async put(
    endpoint: string,
    data: Record<string, unknown> = {},
    options: Record<string, unknown> = {}
  ) {
    return this.request('PUT', endpoint, {
      data,
      ...options,
    });
  }

  async delete(endpoint: string, options: Record<string, unknown> = {}) {
    return this.request('DELETE', endpoint, options);
  }
}

/**
 * Database seeding helper for E2E tests
 */
export class DatabaseHelper {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async seed(endpoint: string, data: unknown[]) {
    const response = await fetch(`${this.baseUrl}/api/test/seed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint, data }),
    });
    return response.json() as Promise<unknown>;
  }

  async clean(endpoint: string) {
    const response = await fetch(`${this.baseUrl}/api/test/clean`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    });
    return response.json() as Promise<unknown>;
  }
}
