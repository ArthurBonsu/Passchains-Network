import React, { useEffect } from 'react';
import { Logger } from '@/utils/logger';

export function ClientInit() {
  useEffect(() => {
    // Comprehensive logging for initialization
    try {
      const startTime = performance.now();
      
      Logger.info('Home page initialized', {
        timestamp: new Date().toISOString()
      });
      
      Logger.info('Blockchain Context Initialization started');

      // Performance monitoring
      if (window.performance) {
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
      }

      return () => {
        const endTime = performance.now();
        Logger.info('Home component lifecycle', {
          duration: `${endTime - startTime}ms`
        });
      };
    } catch (error) {
      Logger.error('Error in home page initialization', error);
    }
  }, []);

  return null;
}