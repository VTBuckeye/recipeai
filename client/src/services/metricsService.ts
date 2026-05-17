import { Metric } from 'web-vitals';
import logger from '../utils/logger';

/**
 * Send web vitals metrics to the server
 */
export const sendMetricToServer = async (metric: Metric): Promise<void> => {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: (metric as any).rating,
      delta: metric.delta,
      id: metric.id,
      navigationType: (metric as any).navigationType,
    });

    // Use navigator.sendBeacon if available (more reliable for page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon('/api/metrics/web-vitals', blob);
    } else {
      // Fallback to fetch
      fetch('/api/metrics/web-vitals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        keepalive: true,
      }).catch((error) => {
        logger.error('Failed to send web vitals metric', { error, metric: metric.name });
      });
    }
  } catch (error) {
    logger.error('Error sending metric to server', { error, metric: metric.name });
  }
};

/**
 * Log web vitals to console in development
 */
export const logWebVitals = (metric: Metric): void => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: (metric as any).rating,
      delta: metric.delta,
    });
  }
};

/**
 * Send web vitals to both server and console
 */
export const reportWebVitals = (metric: Metric): void => {
  logWebVitals(metric);
  sendMetricToServer(metric);
};
