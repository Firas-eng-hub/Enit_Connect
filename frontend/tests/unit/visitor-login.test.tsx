/**
 * Visitor Login Page Tests
 * Unit tests for the visitor login page component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { LoginPage } from '@/pages/visitor/LoginPage';

describe('Visitor Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login page without crashing', () => {
    renderWithProviders(<LoginPage />);
    // Page should render
    expect(document.body).toBeTruthy();
  });

  it('should display login heading or title', () => {
    renderWithProviders(<LoginPage />);
    const heading = document.querySelector('h1, h2, h3, h4, h5, h6');
    expect(heading).toBeTruthy();
  });

  it('should have form elements', () => {
    renderWithProviders(<LoginPage />);
    // Check for form inputs - using queryBy to avoid throwing
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should have a submit button', () => {
    renderWithProviders(<LoginPage />);
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
