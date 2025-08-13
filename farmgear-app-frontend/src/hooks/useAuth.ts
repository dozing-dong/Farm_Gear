import { useCallback, useEffect, useRef, useState } from 'react';
import { farmGearAPI, type User } from '../lib/api';

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
}

// Cross-tab auth sync utilities
const AUTH_BROADCAST_CHANNEL = 'auth';
const authBroadcastChannel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_BROADCAST_CHANNEL) : null;

const broadcastAuthChange = (action: 'login' | 'logout' | 'refresh'): void => {
  // Trigger storage event across tabs
  try {
    localStorage.setItem('auth:changed', String(Date.now()));
  } catch {
    // ignore storage quota/availability issues
  }
  // BroadcastChannel where supported
  try {
    authBroadcastChannel?.postMessage({ type: 'auth', action, timestamp: Date.now() });
  } catch {
    // ignore broadcast failures
  }
};

// Global state to avoid multiple components calling API repeatedly
let globalAuthState: AuthState = {
  isLoggedIn: false,
  user: null,
  isLoading: false,
  isInitialized: false,
};

const globalStateListeners: Set<() => void> = new Set();

// Global state manager
const authStateManager = {
  getState: () => globalAuthState,

  setState: (newState: Partial<AuthState>) => {
    globalAuthState = { ...globalAuthState, ...newState };
    globalStateListeners.forEach((listener) => listener());
  },

  subscribe: (listener: () => void) => {
    globalStateListeners.add(listener);
    return () => {
      globalStateListeners.delete(listener);
    };
  },

  // Smart authentication status check - avoid unnecessary API calls
  checkAuthStatus: async (force = false) => {
    // If already loading or (initialized and not forced), return directly
    if (globalAuthState.isLoading || (!force && globalAuthState.isInitialized)) {
      return globalAuthState;
    }

    authStateManager.setState({ isLoading: true });

    try {
      const userResponse = await farmGearAPI.getCurrentUser();

      if (userResponse.success && userResponse.data) {
        authStateManager.setState({
          isLoggedIn: true,
          user: userResponse.data,
          isLoading: false,
          isInitialized: true,
        });
      } else {
        authStateManager.setState({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    } catch {
      // Silently handle all auth check errors, avoid console noise
      authStateManager.setState({
        isLoggedIn: false,
        user: null,
        isLoading: false,
        isInitialized: true,
      });
    }

    return globalAuthState;
  },

  // Reset state (used when logging out)
  reset: () => {
    localStorage.removeItem('hasLoginIntent');
    localStorage.removeItem('lastLoginTime');
    authStateManager.setState({
      isLoggedIn: false,
      user: null,
      isLoading: false,
      isInitialized: false,
    });
    broadcastAuthChange('logout');
  },

  // Mark as logged in (used after successful login)
  markAsLoggedIn: (user: User) => {
    localStorage.setItem('hasLoginIntent', 'true');
    localStorage.setItem('lastLoginTime', Date.now().toString());
    authStateManager.setState({
      isLoggedIn: true,
      user,
      isLoading: false,
      isInitialized: true,
    });
    broadcastAuthChange('login');
  },
};

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>(globalAuthState);
  const hasCheckedRef = useRef(false);

  // Sync global state
  useEffect(() => {
    const unsubscribe = authStateManager.subscribe(() => {
      setAuthState({ ...globalAuthState });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Check auth status on initialization (only once)
  useEffect(() => {
    if (!hasCheckedRef.current && !globalAuthState.isInitialized && !globalAuthState.isLoading) {
      hasCheckedRef.current = true;
      // Force a real check regardless of route to restore session after refresh
      authStateManager.checkAuthStatus(true);
    }
  }, []);

  // Listen for authentication state change events
  useEffect(() => {
    const handleAuthChange = () => {
      // Check if current path is a protected page
      const protectedRoutes = ['/dashboard', '/equipment', '/profile'];
      const isProtectedRoute = protectedRoutes.some((route) =>
        window.location.pathname.startsWith(route)
      );
      const isHomePage = window.location.pathname === '/' || window.location.pathname === '';

      if (isProtectedRoute) {
        // Only check auth when on protected routes
        setTimeout(() => {
          authStateManager.checkAuthStatus();
        }, 100);
      } else {
        // On non-protected routes, clear local storage and reset to logged out state
        if (isHomePage) {
          localStorage.removeItem('hasLoginIntent');
          localStorage.removeItem('lastLoginTime');
        }

        authStateManager.setState({
          isLoggedIn: false,
          user: null,
          isLoading: false,
          isInitialized: true,
        });
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
    };
  }, []);

  // Cross-tab synchronization: storage + BroadcastChannel + visibility/focus
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'auth:changed') {
        authStateManager.checkAuthStatus(true);
      }
    };
    window.addEventListener('storage', onStorage);

    const onMessage = () => {
      authStateManager.checkAuthStatus(true);
    };
    try {
      authBroadcastChannel?.addEventListener?.('message', onMessage as EventListener);
    } catch {
      // ignore
    }

    const onVisibilityOrFocus = () => {
      if (!document.hidden) {
        authStateManager.checkAuthStatus(true);
      }
    };
    window.addEventListener('focus', onVisibilityOrFocus);
    document.addEventListener('visibilitychange', onVisibilityOrFocus);

    return () => {
      window.removeEventListener('storage', onStorage);
      try {
        authBroadcastChannel?.removeEventListener?.('message', onMessage as EventListener);
      } catch {
        // ignore
      }
      window.removeEventListener('focus', onVisibilityOrFocus);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await farmGearAPI.logout();
    } catch {
      // Silently handle logout failures, ensure local state is properly cleared
    } finally {
      // Reset state regardless of whether API call succeeds
      authStateManager.reset();
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
  }, []);

  const login = useCallback(
    async (credentials: { usernameOrEmail: string; password: string; rememberMe: boolean }) => {
      const response = await farmGearAPI.login(credentials);

      if (response.success && response.data?.user) {
        // Update state directly, avoid extra API calls
        authStateManager.markAsLoggedIn(response.data.user);
      }

      return response;
    },
    []
  );

  return {
    isLoggedIn: authState.isLoggedIn,
    user: authState.user,
    isLoading: authState.isLoading,
    isInitialized: authState.isInitialized,
    login,
    logout,
    // Manually refresh authentication status
    refresh: () => authStateManager.checkAuthStatus(),
  };
};
