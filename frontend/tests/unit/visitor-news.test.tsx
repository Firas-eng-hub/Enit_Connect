/**
 * @vitest
 * Visitor News Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { NewsPage } from '@/pages/visitor/NewsPage';
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

describe('VisitorNewsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.get.mockResolvedValue({ data: [] });
  });

  it('should render news page without crashing', async () => {
    renderWithProviders(<NewsPage />);
    const heading = await screen.findByRole('heading', { name: /news/i });
    expect(heading).toBeTruthy();
  });

  it('should display news heading or title', async () => {
    renderWithProviders(<NewsPage />);
    const heading = await screen.findByRole('heading', { name: /news/i });
    expect(heading).toBeTruthy();
  });

  it('should have content container', async () => {
    renderWithProviders(<NewsPage />);
    const subtitle = await screen.findByText(/stay informed/i);
    expect(subtitle).toBeTruthy();
  });
});
