import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Logger } from '../utils/logger'

// Dynamically import GlobalErrorHandler to ensure client-side only rendering
const GlobalErrorHandler = dynamic(() => import('../components/GlobalErrorHandler'), {
  ssr: false
});

function MyApp({ Component, pageProps }: AppProps) {
  // Add state to track client-side mounting with type annotation
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    // Only run initialization code on the client side
    if (typeof window !== 'undefined') {
      setIsMounted(true);
      
      // Comprehensive application initialization logging
      Logger.info('Application started', {
        timestamp: new Date().toISOString(),
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV,
        }
      });

      // Performance monitoring
      const trackPerformance = () => {
        if (!window.performance) return;
        
        try {
          const performanceEntries = performance.getEntriesByType('navigation');
          performanceEntries.forEach(entry => {
            const navEntry = entry as PerformanceNavigationTiming;
            Logger.info('Page Load Performance', {
              type: navEntry.type,
              duration: navEntry.duration,
              domInteractive: navEntry.domInteractive,
              domComplete: navEntry.domComplete,
              loadTime: navEntry.loadEventEnd - navEntry.startTime
            });
          });
        } catch (error) {
          Logger.error('Performance tracking error', error);
        }
      };

      // Error tracking setup
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        Logger.error('Unhandled Promise Rejection', {
          reason: event.reason,
          promise: event.promise
        });
      };

      // Add event listeners
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      const performanceTimer = setTimeout(trackPerformance, 0);

      // Cleanup function
      return () => {
        Logger.info('Application teardown');
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        clearTimeout(performanceTimer);
        setIsMounted(false);
      };
    }
  }, []); // Empty dependency array for initial mount only

  // Return loading state during SSR
  if (!isMounted) {
    return null;
  }

  // Render the application once mounted on client
  return (
    <>
      <GlobalErrorHandler />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp