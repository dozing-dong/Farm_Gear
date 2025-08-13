import { APP_CONFIG } from './config';

// Simple logger that prevents console leakage in production
class Logger {
  // Core logging methods - only log in development
  error(message: string, data?: unknown): void {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.error(`[${APP_CONFIG.APP_NAME}] ERROR:`, message, data || '');
    }

    // In production, could send to remote logging (future enhancement)
    if (APP_CONFIG.IS_PRODUCTION && APP_CONFIG.ENABLE_ERROR_REPORTING) {
      // TODO: Implement remote logging when needed
    }
  }

  warn(message: string, data?: unknown): void {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.warn(`[${APP_CONFIG.APP_NAME}] WARN:`, message, data || '');
    }
  }

  info(message: string, data?: unknown): void {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.info(`[${APP_CONFIG.APP_NAME}] INFO:`, message, data || '');
    }
  }

  debug(message: string, data?: unknown): void {
    if (APP_CONFIG.ENABLE_CONSOLE_LOGS) {
      console.debug(`[${APP_CONFIG.APP_NAME}] DEBUG:`, message, data || '');
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports
export const logError = (message: string, data?: unknown) => logger.error(message, data);
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data);
export const logInfo = (message: string, data?: unknown) => logger.info(message, data);
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data);
