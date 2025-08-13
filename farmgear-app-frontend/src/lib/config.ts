import { ENV_CONFIG } from './env-config';

// Application configuration - based on environment variables configuration
export const APP_CONFIG = {
  // Environment detection
  IS_PRODUCTION: ENV_CONFIG.IS_PRODUCTION,
  IS_DEVELOPMENT: ENV_CONFIG.IS_DEVELOPMENT,
  IS_STAGING: ENV_CONFIG.IS_STAGING,

  // Application information
  APP_NAME: ENV_CONFIG.APP_TITLE,

  // Feature toggles
  ENABLE_CONSOLE_LOGS: ENV_CONFIG.ENABLE_DEBUG_LOGS,
  ENABLE_ERROR_REPORTING: ENV_CONFIG.ENABLE_ERROR_REPORTING,
} as const;
