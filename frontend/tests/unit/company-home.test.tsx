/**
 * @vitest
 * Company Home Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { HomePage } from '@/pages/company/HomePage';
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

describe('CompanyHomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const localStorageMock = window.localStorage as unknown as {
      getItem: ReturnType<typeof vi.fn>;
    };
    localStorageMock.getItem.mockImplementation((key: string) => (
      key === 'company_id' ? 'company-123' : null
    ));
    httpClientMock.get.mockResolvedValue({ data: [] });
  });

  it('should render company home page without crashing', async () => {
    renderWithProviders(<HomePage />);
    const heading = await screen.findByRole('heading', { name: /company dashboard/i });
    expect(heading).toBeTruthy();
  });

  it('should display page heading or title', async () => {
    renderWithProviders(<HomePage />);
    const heading = await screen.findByRole('heading', { name: /company dashboard/i });
    expect(heading).toBeTruthy();
  });

  it('should have page content', async () => {
    renderWithProviders(<HomePage />);
    const latestNews = await screen.findByRole('heading', { name: /latest news/i });
    expect(latestNews).toBeTruthy();
  });
});
