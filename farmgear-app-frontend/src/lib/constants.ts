// Equipment categories for classification
export const EQUIPMENT_CATEGORIES = [
  { name: 'Tractors', icon: '🚜' },
  { name: 'Harvesters', icon: '🌾' },
  { name: 'Plows', icon: '🔧' },
  { name: 'Seeders', icon: '🌱' },
  { name: 'Cultivators', icon: '⚙️' },
  { name: 'Sprayers', icon: '💧' },
] as const;

// Filter categories including "all" option for equipment list page
export const EQUIPMENT_FILTER_CATEGORIES = [
  'all',
  ...EQUIPMENT_CATEGORIES.map((cat) => cat.name),
  'Other',
] as const;

// Unified equipment status mapping with display variants and colors
export const EQUIPMENT_STATUS = {
  0: {
    label: 'Available',
    variant: 'success' as const,
    color: 'text-green-600',
  },
  1: {
    label: 'Rented',
    variant: 'warning' as const,
    color: 'text-yellow-600',
  },
  2: {
    label: 'Pending Return',
    variant: 'info' as const,
    color: 'text-blue-600',
  },
  3: {
    label: 'Maintenance',
    variant: 'secondary' as const,
    color: 'text-gray-600',
  },
  4: {
    label: 'Offline',
    variant: 'secondary' as const,
    color: 'text-red-600',
  },
} as const;

// Helper function to get status display information
export const getStatusDisplay = (status: number) => {
  return (
    EQUIPMENT_STATUS[status as keyof typeof EQUIPMENT_STATUS] || {
      label: 'Unknown',
      variant: 'secondary' as const,
      color: 'text-gray-600',
    }
  );
};

import { ENV_CONFIG } from './env-config';

// API Configuration - based on environment variables configuration
export const API_CONFIG = {
  BASE_URL: ENV_CONFIG.API_BASE_URL,
  API_ENDPOINT: ENV_CONFIG.API_ENDPOINT,
  TIMEOUT: 10000,
  UPLOAD_MAX_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Image URL utility function
export const getImageUrl = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl || imageUrl.trim() === '') return null;

  // Fix legacy path issues
  let fixedUrl = imageUrl;
  if (fixedUrl.includes('/uploads/avatars/equipment/')) {
    fixedUrl = fixedUrl.replace('/uploads/avatars/equipment/', '/uploads/equipment/');
  }

  // Return absolute URLs as-is
  if (fixedUrl.startsWith('http://') || fixedUrl.startsWith('https://')) {
    return fixedUrl;
  }

  // Convert API URL to domain URL for static resources
  const domainUrl = API_CONFIG.BASE_URL;
  return `${domainUrl}${fixedUrl.startsWith('/') ? '' : '/'}${fixedUrl}`;
};
