import React, { PropsWithChildren } from 'react';
import { Logger } from '../utils/logger';

const GlobalErrorHandler: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  React.useEffect(() => {
    // Ensure this only runs on the client-side
    if (typeof window !== 'undefined') {
      // Global error logging
      const handleError = (event: ErrorEvent) => {
        Logger.error('Uncaught Client-Side Error', {
          message: event.error?.message,
          stack: event.error?.stack,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      };

      // Unhandled Promise Rejection Logging
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        Logger.error('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise
        });
      };

      // Console error interception for additional logging
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        Logger.error('Console Error', { args });
        originalConsoleError(...args);
      };

      // Add global error listeners
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);

      // Log component initialization
      Logger.info('GlobalErrorHandler initialized');

      // Cleanup listeners on unmount
      return () => {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        
        // Restore original console.error
        console.error = originalConsoleError;
        
        Logger.info('GlobalErrorHandler unmounted');
      };
    }
  }, []);

  return <>{children}</>;
};

export default GlobalErrorHandler;