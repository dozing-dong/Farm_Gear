import axios from 'axios';
import { APP_CONFIG } from './config';
import { logger } from './logger';
import { globalToastEvent } from './toast';

// Simple error categorization for user-friendly messages
interface ErrorInfo {
  userMessage: string;
  shouldNotifyUser: boolean;
  shouldLog: boolean;
}

class ErrorHandler {
  // Core function: convert any error to safe user message
  handleError(error: unknown): string {
    const errorInfo = this.categorizeError(error);

    // Log error only in development or for serious issues
    if (errorInfo.shouldLog) {
      logger.error('Error occurred', {
        error: APP_CONFIG.IS_DEVELOPMENT ? error : '[Hidden in production]',
      });
    }

    // Show user notification if needed
    if (errorInfo.shouldNotifyUser) {
      this.notifyUser(errorInfo.userMessage);
    }

    return errorInfo.userMessage;
  }

  private categorizeError(error: unknown): ErrorInfo {
    // Handle Axios errors (API calls)
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const url = error.config?.url || '';

      // Silent auth check errors - core requirement
      if (url.includes('/auth/me') && status === 401) {
        return {
          userMessage: '', // No user message for silent auth checks
          shouldNotifyUser: false,
          shouldLog: false, // Don't log expected auth failures
        };
      }

      // Silent login errors - handled by LoginPage
      if (url.includes('/auth/login') && status === 401) {
        return {
          userMessage: '', // No user message for login failures
          shouldNotifyUser: false,
          shouldLog: false, // Don't log expected login failures
        };
      }

      // Standard HTTP error handling
      switch (status) {
        case 400:
          return {
            userMessage:
              error.response?.data?.message || 'Invalid request. Please check your input.',
            shouldNotifyUser: true,
            shouldLog: false,
          };
        case 401: {
          // Check message field to differentiate between login failure and token expiry
          const message = error.response?.data?.message || '';

          if (message === 'Invalid login credentials') {
            return {
              userMessage: 'Invalid username/email or password. Please try again.',
              shouldNotifyUser: true,
              shouldLog: false,
            };
          } else if (message === 'Token has expired. Please log in again.') {
            return {
              userMessage: 'Your session has expired. Please log in again.',
              shouldNotifyUser: true,
              shouldLog: false,
            };
          } else {
            // Default 401 handling for unknown cases
            return {
              userMessage: 'Authentication required. Please log in again.',
              shouldNotifyUser: true,
              shouldLog: false,
            };
          }
        }
        case 403:
          return {
            userMessage: 'You do not have permission to perform this action.',
            shouldNotifyUser: true,
            shouldLog: false,
          };
        case 404:
          return {
            userMessage: 'The requested resource was not found.',
            shouldNotifyUser: true,
            shouldLog: false,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            userMessage: 'Server temporarily unavailable. Please try again later.',
            shouldNotifyUser: true,
            shouldLog: true, // Log server errors
          };
        default:
          if (!status) {
            return {
              userMessage: 'Network connection problem. Please check your internet connection.',
              shouldNotifyUser: true,
              shouldLog: true,
            };
          }
          return {
            userMessage: 'An unexpected error occurred. Please try again.',
            shouldNotifyUser: true,
            shouldLog: true,
          };
      }
    }

    // Handle generic JavaScript errors
    if (error instanceof Error) {
      return {
        userMessage: 'An error occurred. Please try again.',
        shouldNotifyUser: true,
        shouldLog: true,
      };
    }

    // Unknown error type
    return {
      userMessage: 'Something went wrong. Please try again.',
      shouldNotifyUser: true,
      shouldLog: true,
    };
  }

  private notifyUser(message: string): void {
    if (!message) return;

    globalToastEvent.error('Error', message, 5000);
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// Main export - replaces the existing handleApiError function
export const handleApiError = (error: unknown): string => {
  return errorHandler.handleError(error);
};
