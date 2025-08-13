// Environment variable configuration management
// Provides type safety and validation functionality

interface EnvironmentConfig {
  // Basic configuration
  API_BASE_URL: string;
  API_ENDPOINT: string;
  APP_TITLE: string;

  // Environment identification
  NODE_ENV: 'development' | 'production' | 'test';
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
  IS_STAGING: boolean;

  // Feature toggles
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_DEBUG_LOGS: boolean;
}

// Environment variable parsing and validation
const parseEnvironmentConfig = (): EnvironmentConfig => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://localhost:7250';
  const nodeEnv = import.meta.env.NODE_ENV as 'development' | 'production' | 'test';
  const mode = import.meta.env.MODE;

  return {
    // API configuration
    API_BASE_URL: apiBaseUrl,
    API_ENDPOINT: `${apiBaseUrl}/api`,
    APP_TITLE: import.meta.env.VITE_APP_TITLE || 'FarmGear',

    // Environment detection
    NODE_ENV: nodeEnv,
    IS_DEVELOPMENT: nodeEnv === 'development',
    IS_PRODUCTION: nodeEnv === 'production',
    IS_STAGING: mode === 'staging',

    // Feature toggles
    ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'false',
    // Only output debug logs when explicitly enabled (don't amplify logs by default)
    ENABLE_DEBUG_LOGS: import.meta.env.VITE_ENABLE_DEBUG_LOGS === 'true',
  };
};

// Environment configuration validation
const validateEnvironmentConfig = (config: EnvironmentConfig): void => {
  // Validate required environment variables
  if (!config.API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is required');
  }

  // Validate URL format
  try {
    new URL(config.API_BASE_URL);
  } catch {
    throw new Error(`Invalid VITE_API_BASE_URL: ${config.API_BASE_URL}`);
  }

  // Only output environment info when debugging is explicitly enabled, avoid default noise
  // Debug console logs removed for clean console in production/demo
};

// Create and validate environment configuration
const ENV_CONFIG = parseEnvironmentConfig();
validateEnvironmentConfig(ENV_CONFIG);

export { ENV_CONFIG };
export type { EnvironmentConfig };
