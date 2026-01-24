/**
 * Playwright Global Setup
 * Runs once before all tests
 */

import type { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Starting E2E test suite...');
  const baseURL = config.projects[0]?.use?.baseURL;
  if (baseURL) {
    console.log(`Base URL: ${baseURL}`);
  }

  // Optional: Perform any global setup tasks
  // - Start test database
  // - Seed test data
  // - Clear cache
  // - etc.

  console.log('Global setup complete');
}

export default globalSetup;
