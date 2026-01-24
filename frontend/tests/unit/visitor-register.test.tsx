/**
 * @vitest
 * Visitor Register Component Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { RegisterPage } from '@/pages/visitor/RegisterPage';

describe('VisitorRegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render registration page without crashing', () => {
    renderWithProviders(<RegisterPage />);
    expect(document.body).toBeTruthy();
  });

  it('should display registration heading or title', () => {
    renderWithProviders(<RegisterPage />);
    const heading = document.querySelector('h1, h2, h3, h4, h5, h6');
    expect(heading).toBeTruthy();
  });

  it('should have form inputs', () => {
    renderWithProviders(<RegisterPage />);
    const inputs = document.querySelectorAll('input');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should have submit button or action buttons', () => {
    renderWithProviders(<RegisterPage />);
    const buttons = document.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
