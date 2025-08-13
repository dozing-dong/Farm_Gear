import axios, { type AxiosInstance, type AxiosResponse } from 'axios';

// Backup: Bearer Token mode API client
// If HttpOnly Cookie has issues, this version can be used temporarily

const API_BASE_URL = 'https://localhost:7250/api';

// Type definitions
interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  token?: string;
}

// Create axios instance - Bearer Token mode
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage utility
const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem('farmgear_token');
  },

  setToken(token: string): void {
    localStorage.setItem('farmgear_token', token);
  },

  removeToken(): void {
    localStorage.removeItem('farmgear_token');
  },
};

// Request interceptor - add Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage (backup solution)
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle Token expiration
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear and redirect to login
      tokenStorage.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Backup API class
class BackupFarmGearAPI {
  async login(credentials: LoginCredentials): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const result = response.data;

      // If backend returns token, store to localStorage
      if (result.success && result.data?.token) {
        // Backup solution: store Token to localStorage
        localStorage.setItem('auth_token', result.data.token);
        return result;
      } else {
        return {
          success: false,
          message: result.message || 'Login failed',
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/auth/logout');
      localStorage.removeItem('auth_token');
      return response.data;
    } catch {
      localStorage.removeItem('auth_token');
      return {
        success: true,
        message: 'Logged out locally',
      };
    }
  }
}

// Export backup API instance
export const backupFarmGearAPI = new BackupFarmGearAPI();
