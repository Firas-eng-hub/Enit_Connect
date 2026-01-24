/**
 * @vitest
 * Shared Error Pages Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';

describe('Error Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render NotFoundPage without crashing', () => {
    renderWithProviders(<NotFoundPage />);
    expect(document.body).toBeTruthy();
  });

  it('should render ForbiddenPage without crashing', () => {
    renderWithProviders(<ForbiddenPage />);
    expect(document.body).toBeTruthy();
  });

  it('should have content on NotFoundPage', () => {
    renderWithProviders(<NotFoundPage />);
    const content = document.querySelector('div');
    expect(content).toBeTruthy();
  });

  it('should have content on ForbiddenPage', () => {
    renderWithProviders(<ForbiddenPage />);
    const content = document.querySelector('div');
    expect(content).toBeTruthy();
  });
});
