// Logger utility - only logs in development mode
const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, but sanitize in production
    if (isDev) {
      console.error(...args);
    } else {
      // In production, log a generic message without sensitive details
      console.error('An error occurred. Check logs for details.');
    }
  },
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },
};

export default logger;
