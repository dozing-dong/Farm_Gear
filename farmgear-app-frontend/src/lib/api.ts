import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { APP_CONFIG } from './config';
import { API_CONFIG } from './constants';
import { logger } from './logger';
import { globalToastEvent } from './toast';

// API base configuration
const API_BASE_URL = API_CONFIG.API_ENDPOINT;

// Use unified environment configuration
const isDevelopment = APP_CONFIG.IS_DEVELOPMENT;

// Track whether auth expired notification has been shown to avoid duplicates
let hasShownAuthExpiredNotification = false;

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Support HttpOnly Cookie
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
  // Development environment special configuration
  ...(isDevelopment && {
    // Special configuration may be needed in development environment
    validateStatus: (status) => status < 500, // Only 5xx errors are considered network errors
  }),
});

// Request interceptor - No need to manually add token in HttpOnly Cookie mode
apiClient.interceptors.request.use(
  (config) => {
    // When data is FormData, delete Content-Type header and let browser set it automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // HttpOnly Cookie is automatically carried, no need to manually set Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle unified errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Reset auth expired notification flag
    hasShownAuthExpiredNotification = false;
    return response;
  },
  (error) => {
    // Handle 401 errors for auth check
    if (error.response?.status === 401) {
      // Check if it's auth check API (/auth/me)
      const isAuthCheck = error.config?.url?.includes('/auth/me');
      // Check if it's login request
      const isLoginRequest = error.config?.url?.includes('/auth/login');

      if (isAuthCheck) {
        // Create a silent error object that won't show extra error info in console
        const silentError = new Error('Authentication check failed') as Error & {
          response?: AxiosResponse;
          status?: number;
          isSilent?: boolean;
        };
        // Keep original response info but mark as silent
        silentError.response = error.response;
        silentError.status = 401;
        silentError.isSilent = true; // Mark as silent error
        return Promise.reject(silentError);
      } else if (isLoginRequest) {
        // Login request failed: don't handle in interceptor, pass directly to login page
        // This avoids duplicate error messages
        return Promise.reject(error);
      } else {
        // For 401 errors from non-auth-check and non-login APIs, handle based on message field
        const responseData = error.response?.data;
        const message = responseData?.message || '';

        // Check if it's Token expired error
        if (message === 'Token has expired. Please log in again.') {
          // Token expired: clear local state, redirect to login page
          if (!hasShownAuthExpiredNotification) {
            hasShownAuthExpiredNotification = true;

            // Clear local auth state
            localStorage.removeItem('hasLoginIntent');
            localStorage.removeItem('lastLoginTime');

            // Trigger auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));

            // Show notification
            globalToastEvent.error(
              'Session Expired',
              'Your session has expired. Please log in again.',
              5000
            );

            // Redirect to homepage after a short delay
            setTimeout(() => {
              const currentPath = window.location.pathname;
              // Only redirect if not currently on homepage or login page
              if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
                window.location.href = '/';
              }
            }, 500);
          }
        } else {
          // Other 401 errors (unknown type), handle according to previous logic
          if (!hasShownAuthExpiredNotification) {
            hasShownAuthExpiredNotification = true;

            // Clear local auth state
            localStorage.removeItem('hasLoginIntent');
            localStorage.removeItem('lastLoginTime');

            // Trigger auth state change event
            window.dispatchEvent(new CustomEvent('authStateChanged'));

            // Show notification
            globalToastEvent.error(
              'Authentication Required',
              'Authentication required. Please log in again.',
              5000
            );

            // Redirect to homepage after a short delay
            setTimeout(() => {
              const currentPath = window.location.pathname;
              // Only redirect if not currently on homepage or login page
              if (currentPath !== '/' && currentPath !== '/login' && currentPath !== '/register') {
                window.location.href = '/';
              }
            }, 500);
          }
        }
      }
    }

    // Other 401 errors (like API permission issues) and all other errors are handled normally
    // These errors will be displayed normally in console to help with development debugging
    return Promise.reject(error);
  }
);

// Generic API response type
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

// Paginated response type
export interface PaginatedList<T> {
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  items: T[];
}

// User related types
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'Farmer' | 'Provider' | 'Official' | 'Admin';
  fullName: string;
  emailConfirmed: boolean;
  avatarUrl?: string;
  lat?: number;
  lng?: number;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
  rememberMe: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresAt: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: 'Farmer' | 'Provider';
}

export interface RegisterResponse {
  userId: string;
  username: string;
  email: string;
  requiresEmailConfirmation: boolean;
}

export interface EmailConfirmationTokenResponse {
  UserId: string;
  Token: string;
  ConfirmationUrl: string;
}

// User profile update types
export interface UserProfileUpdateRequest {
  fullName: string;
  lat?: number;
  lng?: number;
}

// Equipment related types
export interface Equipment {
  id: string;
  name: string;
  description: string;
  dailyPrice: number;
  status: 0 | 1 | 2 | 3 | 4; // Available | Rented | PendingReturn | Maintenance | Offline
  latitude: number;
  longitude: number;
  ownerId: string;
  ownerName?: string; // Optional, maintain backward compatibility
  ownerUsername?: string; // New field
  averageRating?: number; // Optional, new equipment may not have ratings
  totalReviews?: number; // Optional, new equipment may not have reviews
  type?: string; // Equipment type
  imageUrl?: string | null; // New image URL field
  createdAt: string;
  updatedAt?: string; // Optional
}

// Equipment creation related types
export interface CreateEquipmentRequest {
  name: string;
  description: string;
  dailyPrice: number;
  latitude: number;
  longitude: number;
  type: string; // Changed to required field
}

export interface UpdateEquipmentRequest {
  name?: string;
  description?: string;
  dailyPrice?: number;
  latitude?: number;
  longitude?: number;
  status?: 0 | 1 | 2 | 3; // Available | Rented | Maintenance | Offline
  type?: string;
}

// Order related types (strictly according to backend documentation)
export interface Order {
  id: string;
  equipmentId: string;
  equipmentName: string;
  renterId: string;
  renterName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: 0 | 1 | 2 | 3 | 4 | 5; // Pending | Accepted | InProgress | Completed | Rejected | Cancelled
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  equipmentId: string;
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
}

export interface OrderListParams {
  pageNumber?: number;
  pageSize?: number;
  status?: 0 | 1 | 2 | 3 | 4 | 5; // Use numeric status
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  minTotalAmount?: number;
  maxTotalAmount?: number;
  sortBy?: string;
  isAscending?: boolean;
}

// Payment related types
export interface PaymentIntent {
  id: string;
  orderId: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Failed';
  paymentUrl: string;
  createdAt: string;
  completedAt?: string;
}

// Review related types
export interface Review {
  id: string;
  equipmentId: string;
  equipmentName: string;
  orderId: string;
  userId: string;
  userName: string;
  rating: number; // 1-5
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewRequest {
  equipmentId: string;
  orderId: string;
  rating: number;
  content: string;
}

export interface ReviewListParams {
  equipmentId?: string;
  userId?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'rating';
  isAscending?: boolean;
}

// Enhanced error handling function with user-friendly messages and production-safe logging
export const handleApiError = (error: unknown): string => {
  // Log error safely (only in development or for serious issues)
  const isAuthCheck = axios.isAxiosError(error) && error.config?.url?.includes('/auth/me');

  if (!isAuthCheck) {
    // Don't log expected auth check failures
    const shouldLog = !axios.isAxiosError(error) || !error.response || error.response.status >= 500;

    if (shouldLog) {
      logger.error('API Error occurred', {
        url: axios.isAxiosError(error) ? error.config?.url : 'unknown',
        status: axios.isAxiosError(error) ? error.response?.status : 'unknown',
        error: APP_CONFIG.IS_DEVELOPMENT ? error : '[Hidden in production]',
      });
    }
  }
  if (axios.isAxiosError(error)) {
    // If it's an Axios error
    if (error.response) {
      // Server returned an error status code
      const { status, data } = error.response;

      switch (status) {
        case 400:
          // Bad Request - show backend message if available, otherwise user-friendly message
          if (data?.message && !data.message.includes('status code')) {
            return data.message;
          }
          return 'Invalid request. Please check your input and try again.';

        case 401:
          return 'Authentication failed. Please check your credentials and try again.';

        case 403:
          return 'Access denied. You do not have permission to perform this action.';

        case 404:
          return 'The requested resource was not found. Please try again.';

        case 409:
          // Conflict - usually username/email already exists
          if (data?.message && !data.message.includes('status code')) {
            return data.message;
          }
          return 'Username or email already exists. Please try a different one.';

        case 422:
          // Validation error - show backend message if available
          if (data?.message && !data.message.includes('status code')) {
            return data.message;
          }
          return 'Validation failed. Please check your input and try again.';

        case 429:
          return 'Too many requests. Please wait a moment and try again.';

        case 500:
          return 'Internal server error. Please try again later.';

        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again later.';

        default:
          // For any other status codes, avoid showing technical details
          if (
            data?.message &&
            !data.message.includes('status code') &&
            !data.message.includes('Request failed')
          ) {
            return data.message;
          }
          return 'An unexpected error occurred. Please try again.';
      }
    } else if (error.request) {
      // Request was sent but no response received
      return 'Network error. Please check your internet connection and try again.';
    } else {
      // Error in request setup
      return 'Request setup error. Please try again.';
    }
  } else if (error instanceof Error) {
    // Other types of errors - clean up technical messages
    const message = error.message;
    if (message.includes('Request failed with status code') || message.includes('status code')) {
      return 'An error occurred. Please try again.';
    }
    return message || 'An unexpected error occurred. Please try again.';
  } else {
    // Unknown error
    return 'An unknown error occurred. Please try again.';
  }
};

// API client class
class FarmGearAPI {
  // Authentication related
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      const result = response.data;

      // In HttpOnly Cookie mode, auth info is automatically set to Cookie by backend
      // Check multiple possible success indicators
      const isSuccess =
        result.success === true ||
        result.success === 'true' ||
        response.status === 200 ||
        response.status === 201;

      if (isSuccess) {
        // Login successful, reset auth expired notification flag
        hasShownAuthExpiredNotification = false;

        // Wait a short time for Cookie to take effect
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Trigger custom event to notify other components of state change
        window.dispatchEvent(new CustomEvent('authStateChanged'));

        // Return standard format
        return {
          success: true,
          message: result.message || 'Login successful',
          data: result.data || {
            user: result.userInfo || result.user || result.data?.user,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          },
        };
      } else {
        return {
          success: false,
          message: result.message || result.error || 'Login failed',
        };
      }
    } catch (error: unknown) {
      // No need to trigger authStateChanged event when login fails
      // Because user has no login state to begin with, it's just a failed login attempt
      // authStateChanged event should only be triggered on actual state changes (successful login/logout)

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiClient.post('/auth/register', userData);
    const body = response.data as any;

    // Normalize backend RegisterResponseDto (top-level UserId) into { data: { userId, ... } }
    if (response.status === 201 || body?.success === true) {
      const userId: string | undefined = body?.userId ?? body?.UserId ?? body?.data?.userId;
      const normalized: RegisterResponse = {
        userId: userId ?? '',
        username: body?.username ?? userData.username,
        email: body?.email ?? userData.email,
        requiresEmailConfirmation: true,
      };

      return {
        success: true,
        message: body?.message ?? 'Registration successful',
        data: normalized,
      };
    }

    // Fallback: return as-is for error cases
    return {
      success: body?.success === true,
      message: body?.message ?? 'Registration failed',
      data: body?.data,
    };
  }

  // Development environment: Get email confirmation token
  async getEmailConfirmationToken(userId: string): Promise<EmailConfirmationTokenResponse> {
    const response = await apiClient.get(`/auth/get-confirmation-token/${userId}`);
    return response.data; // Return as-is { UserId, Token, ConfirmationUrl }
  }

  // Development environment: Use userId + token to simulate email confirmation
  async confirmEmail(userId: string, token: string): Promise<ApiResponse> {
    const response = await apiClient.get('/auth/confirm-email', {
      params: { userId, token },
    });

    const status = response.status;
    const data = response.data;

    if (status === 200) {
      return {
        success: true,
        message: data?.message || 'Email confirmation successful',
        data: data?.data,
      };
    }

    return {
      success: false,
      message:
        data?.message ||
        (status === 400
          ? 'Invalid or expired token.'
          : status === 404
            ? 'User not found.'
            : 'Email confirmation failed.'),
      data: data?.data,
    };
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/auth/logout');

      // Reset auth expired notification flag when logging out
      hasShownAuthExpiredNotification = false;

      // Trigger custom event to notify other components of state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      return response.data;
    } catch (error) {
      // Even if backend call fails, reset flag and trigger auth state change
      hasShownAuthExpiredNotification = false;
      window.dispatchEvent(new CustomEvent('authStateChanged'));

      throw error;
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  }

  // User profile management
  async getUserProfile(): Promise<ApiResponse<User>> {
    const response = await apiClient.get('/user/profile');
    return response.data;
  }

  async updateUserProfile(profileData: UserProfileUpdateRequest): Promise<ApiResponse<User>> {
    const response = await apiClient.put('/user/profile', profileData);
    const result = response.data;

    // In HttpOnly Cookie mode, user info is managed by backend
    if (result.success && result.data) {
      // Trigger custom event to notify other components of state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    return result;
  }

  async uploadAvatar(
    file: File
  ): Promise<
    ApiResponse<{ fileUrl: string; originalFileName: string; fileSize: number; uploadedAt: string }>
  > {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result = response.data;

    // In HttpOnly Cookie mode, user info is managed by backend
    if (result.success && result.data) {
      // Trigger custom event to notify other components of state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    return result;
  }

  async deleteAvatar(): Promise<ApiResponse> {
    const response = await apiClient.delete('/user/avatar');
    const result = response.data;

    // In HttpOnly Cookie mode, user info is managed by backend
    if (result.success) {
      // Trigger custom event to notify other components of state change
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }

    return result;
  }

  // Equipment related
  async getEquipmentList(
    params?: Record<string, unknown>
  ): Promise<ApiResponse<PaginatedList<Equipment>>> {
    const response = await apiClient.get('/equipment', { params });
    return response.data;
  }

  // Get my equipment list
  async getMyEquipmentList(
    params?: Record<string, unknown>
  ): Promise<ApiResponse<PaginatedList<Equipment>>> {
    const response = await apiClient.get('/equipment/my-equipment', { params });
    return response.data;
  }

  async getEquipmentById(id: string): Promise<ApiResponse<Equipment>> {
    const response = await apiClient.get(`/equipment/${id}`);
    return response.data;
  }

  // Equipment creation - Support image upload
  async createEquipment(
    equipmentData: CreateEquipmentRequest,
    image?: File
  ): Promise<ApiResponse<Equipment>> {
    // Always use FormData format since backend controller uses [FromForm] attribute
    const formData = new FormData();
    formData.append('name', equipmentData.name);
    formData.append('description', equipmentData.description);
    formData.append('dailyPrice', equipmentData.dailyPrice.toString());
    formData.append('latitude', equipmentData.latitude.toString());
    formData.append('longitude', equipmentData.longitude.toString());
    formData.append('type', equipmentData.type);

    // Add image file if available
    if (image) {
      formData.append('image', image);
    }

    // Don't manually set Content-Type when using FormData, let browser set it automatically
    const response = await apiClient.post('/equipment', formData);
    return response.data;
  }

  // Equipment update
  async updateEquipment(
    id: string,
    equipmentData: UpdateEquipmentRequest
  ): Promise<ApiResponse<Equipment>> {
    const response = await apiClient.put(`/equipment/${id}`, equipmentData);
    return response.data;
  }

  // Equipment status update - Dedicated lightweight API
  async updateEquipmentStatus(
    id: string,
    status: 0 | 1 | 2 | 3 | 4
  ): Promise<ApiResponse<Equipment>> {
    const response = await apiClient.patch(`/equipment/${id}/status`, { status });
    return response.data;
  }

  // Equipment deletion
  async deleteEquipment(id: string): Promise<ApiResponse> {
    const response = await apiClient.delete(`/equipment/${id}`);
    return response.data;
  }

  // Confirm equipment return - Provider confirms equipment recovery
  async confirmEquipmentReturn(id: string): Promise<ApiResponse<Equipment>> {
    const response = await apiClient.put(`/equipment/${id}/confirm-return`);
    return response.data;
  }

  // User state management - HttpOnly Cookie mode
  async isLoggedIn(): Promise<boolean> {
    try {
      // Check login status by calling API that requires authentication
      const response = await apiClient.get('/auth/me');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Force logout - Clear all authentication state
  async clearAuth(): Promise<void> {
    try {
      // Call backend logout API to clear HttpOnly Cookie
      await this.logout();
    } catch {
      // Even if API call fails, trigger state change event
      window.dispatchEvent(new CustomEvent('authStateChanged'));
    }
  }

  // Order management API
  async createOrder(orderData: CreateOrderRequest): Promise<ApiResponse<Order>> {
    const response = await apiClient.post('/order', orderData);
    return response.data;
  }

  async getOrderList(params: OrderListParams = {}): Promise<ApiResponse<PaginatedList<Order>>> {
    const response = await apiClient.get('/order/my-orders', { params });
    return response.data;
  }

  async getOrderDetails(orderId: string): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/order/${orderId}`);
    return response.data;
  }

  async updateOrderStatus(orderId: string, status: number): Promise<ApiResponse> {
    const response = await apiClient.put(`/order/${orderId}/status`, status);
    return response.data;
  }

  // Payment management API
  async createPaymentIntent(orderId: string): Promise<ApiResponse<PaymentIntent>> {
    const response = await apiClient.post('/payment/intent', {
      orderId,
      gateway: 'Mock', // Mock payment gateway
    });
    return response.data;
  }

  async getPaymentStatus(orderId: string): Promise<ApiResponse<PaymentIntent>> {
    const response = await apiClient.get(`/payment/status/${orderId}`);
    return response.data;
  }

  // Mock payment completion interface (development only)
  async mockPaymentComplete(orderId: string): Promise<ApiResponse> {
    // This simulates successful payment, should actually call backend test interface
    return {
      success: true,
      message: `Mock payment completed successfully for order ${orderId}`,
    };
  }

  // Mock payment API (directly call backend mock-pay interface)
  async mockPayOrder(orderId: string): Promise<ApiResponse<PaymentIntent>> {
    const response = await apiClient.post(`/payment/mock-pay/${orderId}`);
    return response.data;
  }

  // Review management API
  async createReview(reviewData: CreateReviewRequest): Promise<ApiResponse<Review>> {
    const response = await apiClient.post('/review', reviewData);
    return response.data;
  }

  async getReviewList(params: ReviewListParams = {}): Promise<ApiResponse<PaginatedList<Review>>> {
    const response = await apiClient.get('/review', { params });
    return response.data;
  }

  async getUserReviewForEquipment(equipmentId: string): Promise<ApiResponse<Review | null>> {
    // Use existing /review/my endpoint to get all user reviews, then filter for specific equipment
    const response = await apiClient.get('/review/my');

    if (response.data?.success && response.data?.data?.items) {
      const userReview = response.data.data.items.find(
        (review: Review) => review.equipmentId === equipmentId
      );

      return {
        success: true,
        data: userReview || null,
        message: '',
      };
    }

    return {
      success: true,
      data: null,
      message: '',
    };
  }

  async checkReviewPermission(orderId: string): Promise<ApiResponse<boolean>> {
    const response = await apiClient.get(`/review/check-permission/${orderId}`);
    return response.data;
  }
}

// Export API client instance
export const farmGearAPI = new FarmGearAPI();
export default apiClient;
