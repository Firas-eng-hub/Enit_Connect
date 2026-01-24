/**
 * @vitest
 * Company Candidacies Page Tests
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CandidaciesPage } from '@/pages/company/CandidaciesPage';
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

describe('CompanyCandidaciesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpClientMock.get.mockResolvedValue({
      data: { title: 'Test Offer', candidacies: [] },
    });
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/company/candidacies/507f1f77bcf86cd799439011']}>
        <Routes>
          <Route path="/company/candidacies/:id" element={<CandidaciesPage />} />
        </Routes>
      </MemoryRouter>
    );

  it('should render candidacies page without crashing', async () => {
    renderPage();
    const heading = await screen.findByRole('heading', { name: /test offer/i });
    expect(heading).toBeTruthy();
  });

  it('should display page content', async () => {
    renderPage();
    const heading = await screen.findByRole('heading', { name: /test offer/i });
    expect(heading).toBeTruthy();
  });

  it('should have page content', async () => {
    renderPage();
    const emptyState = await screen.findByText(/no applications yet/i);
    expect(emptyState).toBeTruthy();
  });
});
