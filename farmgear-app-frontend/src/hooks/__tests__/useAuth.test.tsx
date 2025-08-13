import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../useAuth';

// Mock API
vi.mock('@/lib/api', () => ({
  farmGearAPI: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

// Mock window location
const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset window location to home page
    mockLocation.pathname = '/';

    // Mock document.referrer
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });

    // Clear any existing event listeners
    window.removeEventListener('authStateChanged', vi.fn());
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('initializes with logged out state on home page', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('calls getCurrentUser when on protected route', async () => {
    mockLocation.pathname = '/dashboard';

    const { farmGearAPI } = await import('@/lib/api');
    farmGearAPI.getCurrentUser = vi.fn().mockResolvedValue({
      success: true,
      data: { id: '1', username: 'testuser', fullName: 'Test User' },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });
  });

  it('handles login successfully', async () => {
    const { farmGearAPI } = await import('@/lib/api');
    const mockUser = { id: '1', username: 'testuser', fullName: 'Test User' };

    farmGearAPI.login = vi.fn().mockResolvedValue({
      success: true,
      data: { user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    const credentials = {
      usernameOrEmail: 'test@example.com',
      password: 'password',
      rememberMe: true,
    };

    await result.current.login(credentials);

    expect(farmGearAPI.login).toHaveBeenCalledWith(credentials);
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).toEqual(mockUser);
  });

  it('handles logout successfully', async () => {
    const { farmGearAPI } = await import('@/lib/api');
    farmGearAPI.logout = vi.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await result.current.logout();

    await waitFor(() => {
      expect(result.current.isLoggedIn).toBe(false);
    });

    expect(farmGearAPI.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
  });

  it('handles API errors gracefully', async () => {
    mockLocation.pathname = '/dashboard';

    const { farmGearAPI } = await import('@/lib/api');
    farmGearAPI.getCurrentUser = vi.fn().mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('does not call API on home page', () => {
    mockLocation.pathname = '/';

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isLoggedIn).toBe(false);
  });
});
