/**
 * @vitest
 * Admin Documents Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { DocumentsPage } from '@/pages/admin/DocumentsPage';
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

describe('AdminDocumentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.get.mockResolvedValue({ data: [] });
  });

  it('should render documents page without crashing', async () => {
    renderWithProviders(<DocumentsPage />);
    const heading = await screen.findByRole('heading', { name: /document management/i });
    expect(heading).toBeTruthy();
  });

  it('should display page heading or title', async () => {
    renderWithProviders(<DocumentsPage />);
    const heading = await screen.findByRole('heading', { name: /document management/i });
    expect(heading).toBeTruthy();
  });

  it('should have page content', async () => {
    renderWithProviders(<DocumentsPage />);
    const content = await screen.findByText(/manage platform documents/i);
    expect(content).toBeTruthy();
  });
});
