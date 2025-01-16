// utils/logger.ts
export const Logger = {
    info: (message: string, ...args: any[]) => {
      if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
        console.log(`[INFO] ${message}`, ...args);
      }
    },
    error: (message: string, error?: any) => {
      console.error(`[ERROR] ${message}`, error);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`[WARN] ${message}`, ...args);
    },
    // Added debug method for more granular logging
    debug: (message: string, ...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    }
  };