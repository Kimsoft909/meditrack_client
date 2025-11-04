import { config } from '@/config/environment';

class Logger {
  private shouldLog = config.enableLogging;

  info(message: string, ...args: any[]) {
    if (this.shouldLog) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  // Always log critical errors, even in production (but sanitized)
  critical(message: string, error?: Error) {
    console.error(`[CRITICAL] ${message}`, error?.message || '');
  }
}

export const logger = new Logger();
