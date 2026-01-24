/**
 * Playwright Global Teardown
 * Runs once after all tests complete
 */

async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test suite...');

  // Optional: Perform any global teardown tasks
  // - Stop test database
  // - Clean up temporary files
  // - Generate reports
  // - etc.

  console.log('✅ Global teardown complete');
}

export default globalTeardown;
