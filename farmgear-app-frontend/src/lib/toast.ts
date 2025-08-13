import { useContext } from 'react';
import { ToastContext } from '../components/ui/toast';

// useToast hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Utility functions for creating different types of toasts
export const createToast = {
  success: (title: string, description?: string) => ({
    type: 'success' as const,
    title,
    description,
  }),
  error: (title: string, description?: string) => ({ type: 'error' as const, title, description }),
  warning: (title: string, description?: string) => ({
    type: 'warning' as const,
    title,
    description,
  }),
  info: (title: string, description?: string) => ({ type: 'info' as const, title, description }),
};

// Global toast event system - allows triggering toasts outside React components
export interface GlobalToastEvent {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

export const globalToastEvent = {
  // Trigger toast event
  emit: (toast: GlobalToastEvent) => {
    window.dispatchEvent(new CustomEvent('global-toast', { detail: toast }));
  },

  // Convenience methods
  success: (title: string, description?: string, duration?: number) => {
    globalToastEvent.emit({ type: 'success', title, description, duration });
  },

  error: (title: string, description?: string, duration?: number) => {
    globalToastEvent.emit({ type: 'error', title, description, duration });
  },

  warning: (title: string, description?: string, duration?: number) => {
    globalToastEvent.emit({ type: 'warning', title, description, duration });
  },

  info: (title: string, description?: string, duration?: number) => {
    globalToastEvent.emit({ type: 'info', title, description, duration });
  },
};
