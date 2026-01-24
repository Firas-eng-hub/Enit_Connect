/**
 * @vitest
 * Student Profile Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import { ProfilePage } from '@/pages/student/ProfilePage';
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

describe('StudentProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const localStorageMock = window.localStorage as unknown as {
      getItem: ReturnType<typeof vi.fn>;
    };
    localStorageMock.getItem.mockImplementation((key: string) => (
      key === 'user_id' ? 'student-123' : null
    ));
    httpClientMock.get.mockResolvedValue({
      data: {
        _id: 'student-123',
        firstname: 'Test',
        lastname: 'Student',
        email: 'student@test.com',
        type: 'student',
        status: 'Active',
      },
    });
  });

  it('should render profile page without crashing', async () => {
    renderWithProviders(<ProfilePage />);
    const heading = await screen.findByRole('heading', { name: /my profile/i });
    expect(heading).toBeTruthy();
  });

  it('should display page content', async () => {
    renderWithProviders(<ProfilePage />);
    const heading = await screen.findByRole('heading', { name: /my profile/i });
    expect(heading).toBeTruthy();
  });

  it('should have page content', async () => {
    renderWithProviders(<ProfilePage />);
    const subtitle = await screen.findByText(/manage your personal information/i);
    expect(subtitle).toBeTruthy();
  });
});
