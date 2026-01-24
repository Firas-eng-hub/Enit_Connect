/**
 * @vitest
 * Admin Notifications Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { NotificationsPage } from '@/pages/admin/NotificationsPage';
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

describe('AdminNotificationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.get.mockResolvedValue({ data: [] });
  });

  it('should render notifications page without crashing', async () => {
    renderWithProviders(<NotificationsPage />);
    const heading = await screen.findByRole('heading', { name: /^notifications$/i });
    expect(heading).toBeTruthy();
  });

  it('should display page content', async () => {
    renderWithProviders(<NotificationsPage />);
    const heading = await screen.findByRole('heading', { name: /^notifications$/i });
    expect(heading).toBeTruthy();
  });

  it('should have page content', async () => {
    renderWithProviders(<NotificationsPage />);
    const emptyState = await screen.findByText(/no notifications/i);
    expect(emptyState).toBeTruthy();
  });
});
