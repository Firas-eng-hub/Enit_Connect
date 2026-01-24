/**
 * @vitest
 * Student Browse Offers Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { BrowseOffersPage } from '@/pages/student/BrowseOffersPage';
import httpClient from '@/shared/api/httpClient';

vi.mock('@/shared/api/httpClient', () => {
  const mock = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  };
  return { default: mock, httpClient: mock };
});

const httpClientMock = httpClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

describe('StudentBrowseOffersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.get.mockResolvedValue({ data: [] });
  });

  it('should render offers page without crashing', async () => {
    renderWithProviders(<BrowseOffersPage />);
    const heading = await screen.findByRole('heading', { name: /browse offers/i });
    expect(heading).toBeTruthy();
  });

  it('should display page content', async () => {
    renderWithProviders(<BrowseOffersPage />);
    const heading = await screen.findByRole('heading', { name: /browse offers/i });
    expect(heading).toBeTruthy();
  });

  it('should have page content', async () => {
    renderWithProviders(<BrowseOffersPage />);
    const emptyState = await screen.findByText(/no offers available/i);
    expect(emptyState).toBeTruthy();
  });
});
