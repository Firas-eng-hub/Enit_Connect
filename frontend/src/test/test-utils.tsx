/**
 * Frontend Test Utilities
 * Custom render functions and testing helpers for React components
 */

import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock the useAuth hook
vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    userType: null,
    user: null,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    checkAuth: vi.fn(),
    userName: '',
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
}));

/**
 * Create a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Custom render function that includes all necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    initialRoute = '/',
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set initial route if using BrowserRouter
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Mock authentication context
 */
function createMockAuthContext(overrides: Record<string, unknown> = {}) {
  return {
    user: null,
    loading: false,
    error: null,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    ...overrides,
  };
}

/**
 * Mock user object for testing
 */
function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    type: 'student',
    status: 'Active',
    firstname: 'Test',
    lastname: 'User',
    ...overrides,
  };
}

/**
 * Mock API response helper
 */
function createMockApiResponse(
  data: Record<string, unknown> = {},
  options: Record<string, unknown> = {}
) {
  return {
    status: 200,
    data,
    headers: {},
    config: {},
    statusText: 'OK',
    ...options,
  };
}

/**
 * Wait for async operations
 */
function waitForAsync() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Mock fetch for API calls
 */
type FetchMockResponse = {
  status: number;
  message?: string;
  [key: string]: unknown;
};

function setupFetchMock(responses: Record<string, FetchMockResponse> = {}) {
  global.fetch = vi.fn((url: string) => {
    const key = Object.keys(responses).find((k) => (url as string).includes(k));
    const response = key ? responses[key] : { status: 404, message: 'Not found' };
    
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(response)])),
    } as Response);
  }) as typeof fetch;
}

// Re-export everything from React Testing Library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

export {
  renderWithProviders,
  createTestQueryClient,
  createMockAuthContext,
  createMockUser,
  createMockApiResponse,
  waitForAsync,
  setupFetchMock,
};
